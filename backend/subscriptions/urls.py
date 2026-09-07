# Subscription routes
from django.urls import path
from .views import (
    SubscriptionStatusView,
    SubscriptionUpgradeView,
    SubscriptionPlansView,
    SubscriptionPaymentInitiateView,
    SubscriptionPaymentVerifyView,
)
from .billing_views import (
    billing_dashboard, billing_cycles_management, billing_cycle_detail,
    invoices_management, invoice_detail, payment_failures_management,
    refunds_management, dunning_management,
)

urlpatterns = [
    path('status/', SubscriptionStatusView.as_view(), name='subscription_status'),
    path('upgrade/', SubscriptionUpgradeView.as_view(), name='subscription_upgrade'),
    path('plans/', SubscriptionPlansView.as_view(), name='subscription_plans'),
    path('payment/initiate/', SubscriptionPaymentInitiateView.as_view(), name='subscription_payment_initiate'),
    path('payment/verify/', SubscriptionPaymentVerifyView.as_view(), name='subscription_payment_verify'),
]

# These are mounted under /api/auth/superadmin/billing/ via main urls.py
billing_urlpatterns = [
    path('dashboard/', billing_dashboard, name='billing_dashboard'),
    path('cycles/', billing_cycles_management, name='billing_cycles'),
    path('cycles/<int:cycle_id>/', billing_cycle_detail, name='billing_cycle_detail'),
    path('invoices/', invoices_management, name='invoices'),
    path('invoices/<int:invoice_id>/', invoice_detail, name='invoice_detail'),
    path('failures/', payment_failures_management, name='payment_failures'),
    path('refunds/', refunds_management, name='refunds'),
    path('dunning/', dunning_management, name='dunning'),
]
