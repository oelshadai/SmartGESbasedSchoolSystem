"""Subscription API views."""
from datetime import date, timedelta
from decimal import Decimal
import uuid

import requests

from django.utils import timezone
from django.conf import settings
from django.db import transaction
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    PLAN_CHOICES, PLAN_DURATIONS, PLAN_FREE, PLAN_MONTHLY, PLAN_PRICES,
    PLAN_YEARLY, Subscription,
)
from .models import Payment, SubscriptionPlan


def _subscription_payload(school):
    """Build a consistent subscription-status dict for *school*."""
    sub = (
        school.subscriptions
        .filter(status=Subscription.STATUS_ACTIVE)
        .order_by('-end_date')
        .first()
    )

    if not sub:
        # Fall back to the plain School fields (legacy / no subscription row)
        plan = school.subscription_plan or PLAN_FREE
        expires = school.subscription_expires
        is_locked = bool(expires and expires < date.today())
        days_left = max((expires - date.today()).days, 0) if expires else None
        return {
            'plan': plan,
            'status': 'LOCKED' if is_locked else 'ACTIVE',
            'start_date': None,
            'end_date': str(expires) if expires else None,
            'days_remaining': days_left,
            'is_locked': is_locked,
            'prices': PLAN_PRICES,
        }

    is_locked = not sub.is_valid()
    return {
        'plan': sub.plan_type,
        'status': sub.status,
        'start_date': str(sub.start_date),
        'end_date': str(sub.end_date),
        'days_remaining': sub.days_remaining(),
        'is_locked': is_locked,
        'prices': PLAN_PRICES,
    }


class SubscriptionStatusView(APIView):
    """GET  /api/subscriptions/status/
    Returns the current subscription status for the requesting school.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        school = getattr(request.user, 'school', None)
        if not school:
            return Response({'error': 'No school associated with this account.'}, status=400)

        # Auto-lock expired subscriptions (any plan type)
        active_sub = (
            school.subscriptions
            .filter(status=Subscription.STATUS_ACTIVE)
            .order_by('-end_date')
            .first()
        )
        if active_sub and active_sub.end_date < date.today():
            active_sub.status = Subscription.STATUS_EXPIRED
            active_sub.save(update_fields=['status', 'updated_at'])
            school.is_active = False
            school.save(update_fields=['is_active'])

        return Response(_subscription_payload(school))


class SubscriptionUpgradeView(APIView):
    """POST /api/subscriptions/upgrade/
    Body: { "plan": "MONTHLY" | "YEARLY" }

    In production this would integrate with a payment gateway.
    For now it upgrades immediately (admin-confirmed workflow).
    Only SCHOOL_ADMIN can call this.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        return Response(
            {'error': 'Online upgrades must use the Paystack payment flow.'},
            status=status.HTTP_410_GONE,
        )



class SubscriptionPaymentInitiateView(APIView):
    """Initialize a subscription payment through the global Paystack account."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        if request.user.role not in ('SCHOOL_ADMIN', 'PRINCIPAL'):
            return Response({'error': 'Only school administrators can renew subscriptions.'}, status=403)

        school = getattr(request.user, 'school', None)
        plan = request.data.get('plan', '').upper()
        if not school:
            return Response({'error': 'No school associated with this account.'}, status=400)
        if plan not in (PLAN_MONTHLY, PLAN_YEARLY):
            return Response({'error': 'Choose MONTHLY or YEARLY.'}, status=400)

        secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
        public_key = getattr(settings, 'PAYSTACK_PUBLIC_KEY', '')
        if not secret_key or not public_key:
            return Response({'error': 'Payment gateway is not configured. Contact support.'}, status=503)
        if not request.user.email:
            return Response({'error': 'Account email is required for payment.'}, status=400)

        reference = f'SUB-{school.id}-{uuid.uuid4().hex[:12].upper()}'
        amount = Decimal(PLAN_PRICES[plan])
        current = school.subscriptions.filter(status=Subscription.STATUS_ACTIVE).order_by('-end_date').first()
        payment = Payment.objects.create(
            school=school,
            subscription=current,
            plan_type=plan,
            amount=amount,
            payment_method=Payment.METHOD_MOBILE,
            transaction_id=reference,
            reference=reference,
            status=Payment.STATUS_PENDING,
        )
        frontend_url = getattr(settings, 'FRONTEND_URL', '').rstrip('/')
        payload = {
            'email': request.user.email,
            'amount': int(amount * 100),
            'reference': reference,
            'currency': 'GHS',
            'metadata': {
                'payment_id': payment.id,
                'school_id': school.id,
                'plan': plan,
                'purchase_type': 'subscription',
            },
            'callback_url': f'{frontend_url}/school/subscription?paystack_ref={reference}',
        }
        try:
            response = requests.post(
                'https://api.paystack.co/transaction/initialize',
                json=payload,
                headers={'Authorization': f'Bearer {secret_key}', 'Content-Type': 'application/json'},
                timeout=30,
            )
            data = response.json()
        except requests.RequestException as exc:
            payment.status = Payment.STATUS_FAILED
            payment.remarks = str(exc)
            payment.save(update_fields=['status', 'remarks', 'updated_at'])
            return Response({'error': 'Payment gateway is unavailable.'}, status=503)

        if response.status_code != 200 or not data.get('status'):
            payment.status = Payment.STATUS_FAILED
            payment.remarks = data.get('message', 'Paystack initialization failed')
            payment.save(update_fields=['status', 'remarks', 'updated_at'])
            return Response({'error': payment.remarks}, status=502)

        return Response({
            'authorization_url': data['data']['authorization_url'],
            'reference': reference,
            'public_key': public_key,
        })


class SubscriptionPaymentVerifyView(APIView):
    """Verify a Paystack payment and extend the school's subscription."""
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('SCHOOL_ADMIN', 'PRINCIPAL'):
            return Response({'error': 'Only school administrators can renew subscriptions.'}, status=403)
        reference = request.query_params.get('reference', '').strip()
        if not reference:
            return Response({'error': 'Payment reference is required.'}, status=400)

        with transaction.atomic():
            try:
                payment = Payment.objects.select_for_update().get(
                    reference=reference,
                    school=request.user.school,
                )
            except Payment.DoesNotExist:
                return Response({'error': 'Payment not found.'}, status=404)

            if payment.status == Payment.STATUS_COMPLETED:
                return Response({'success': True, 'message': 'Payment was already applied.', 'subscription': _subscription_payload(request.user.school)})

            secret_key = getattr(settings, 'PAYSTACK_SECRET_KEY', '')
            try:
                response = requests.get(
                    f'https://api.paystack.co/transaction/verify/{reference}',
                    headers={'Authorization': f'Bearer {secret_key}'},
                    timeout=30,
                )
                data = response.json()
            except requests.RequestException:
                return Response({'error': 'Payment gateway is unavailable.'}, status=503)

            transaction_data = data.get('data', {})
            if response.status_code != 200 or not data.get('status') or transaction_data.get('status') != 'success':
                return Response({'success': False, 'message': 'Payment was not successful.'})
            if int(transaction_data.get('amount', 0)) != int(payment.amount * 100):
                payment.status = Payment.STATUS_FAILED
                payment.remarks = 'Paystack amount did not match the subscription price.'
                payment.save(update_fields=['status', 'remarks', 'updated_at'])
                return Response({'error': 'Payment amount mismatch.'}, status=400)

            school = payment.school
            today = date.today()
            current = school.subscriptions.filter(status=Subscription.STATUS_ACTIVE).order_by('-end_date').first()
            start_date = max(today, current.end_date) if current else today
            end_date = start_date + timedelta(days=PLAN_DURATIONS[payment.plan_type])
            if current:
                current.status = Subscription.STATUS_CANCELLED
                current.save(update_fields=['status', 'updated_at'])
            plan_obj = SubscriptionPlan.objects.filter(plan_type=payment.plan_type, is_active=True).first()
            new_subscription = Subscription.objects.create(
                school=school,
                plan=plan_obj,
                plan_type=payment.plan_type,
                start_date=start_date,
                end_date=end_date,
                status=Subscription.STATUS_ACTIVE,
            )
            payment.subscription = new_subscription
            payment.status = Payment.STATUS_COMPLETED
            payment.payment_date = timezone.now()
            payment.save(update_fields=['subscription', 'status', 'payment_date', 'updated_at'])
            school.subscription_plan = payment.plan_type
            school.subscription_expires = end_date
            school.is_active = True
            school.save(update_fields=['subscription_plan', 'subscription_expires', 'is_active'])

        return Response({
            'success': True,
            'message': f'{payment.plan_type.title()} subscription renewed successfully.',
            'subscription': _subscription_payload(school),
        })


class SubscriptionPlansView(APIView):
    """GET /api/subscriptions/plans/
    Returns the available plans and their prices (no auth required).
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        plans = [
            {
                'key': PLAN_FREE,
                'name': 'Free Trial',
                'price': PLAN_PRICES[PLAN_FREE],
                'duration_days': PLAN_DURATIONS[PLAN_FREE],
                'description': '10-day free trial. Full access. No credit card needed.',
                'badge': '10 days free',
            },
            {
                'key': PLAN_MONTHLY,
                'name': 'Monthly',
                'price': PLAN_PRICES[PLAN_MONTHLY],
                'duration_days': PLAN_DURATIONS[PLAN_MONTHLY],
                'description': 'Full access billed monthly.',
                'badge': 'GH₵ 200/mo',
            },
            {
                'key': PLAN_YEARLY,
                'name': 'Yearly',
                'price': PLAN_PRICES[PLAN_YEARLY],
                'duration_days': PLAN_DURATIONS[PLAN_YEARLY],
                'description': 'Pay for 11 months, get 12. Save GH₵ 200.',
                'badge': 'Save 2 months',
            },
        ]
        return Response(plans)
