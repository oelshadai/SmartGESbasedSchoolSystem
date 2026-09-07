from datetime import date, timedelta

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from notifications.models import Notification
from notifications.views import create_notification
from schools.models import School
from subscriptions.models import Subscription


User = get_user_model()
EXPIRY_WARNING_DAYS = 5
ACTIVITY_TYPE = 'subscription_expiry'


class Command(BaseCommand):
    help = 'Notify school admins when their subscription expires in five days'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show pending notifications without creating them',
        )

    def handle(self, *args, **options):
        today = date.today()
        expiry_date = today + timedelta(days=EXPIRY_WARNING_DAYS)
        dry_run = options['dry_run']
        notified = 0
        skipped = 0
        schools_with_active_subscriptions = set(
            Subscription.objects.filter(status=Subscription.STATUS_ACTIVE)
            .values_list('school_id', flat=True)
        )

        subscriptions = Subscription.objects.filter(
            status=Subscription.STATUS_ACTIVE,
            end_date=expiry_date,
        ).select_related('school')

        for subscription in subscriptions:
            sent, skipped_count = self.notify_school_admins(
                subscription.school,
                expiry_date,
                dry_run,
            )
            notified += sent
            skipped += skipped_count

        legacy_schools = School.objects.filter(
            subscription_expires=expiry_date,
        ).exclude(id__in=schools_with_active_subscriptions)

        for school in legacy_schools:
            sent, skipped_count = self.notify_school_admins(school, expiry_date, dry_run)
            notified += sent
            skipped += skipped_count

        action = 'would notify' if dry_run else 'notified'
        self.stdout.write(
            self.style.SUCCESS(
                f'{action.title()} {notified} school admin(s); skipped {skipped} duplicate notification(s).'
            )
        )

    def notify_school_admins(self, school, expiry_date, dry_run):
        admins = User.objects.filter(school=school, role='SCHOOL_ADMIN')
        sent = 0
        skipped = 0
        title = 'Subscription expires in 5 days'
        message = (
            f'{school.name} subscription expires on {expiry_date:%B} {expiry_date.day}, {expiry_date.year}. '
            'Renew your subscription to keep access to the school system.'
        )

        for admin in admins:
            already_notified = Notification.objects.filter(
                user=admin,
                activity_type=ACTIVITY_TYPE,
                created_at__date=date.today(),
            ).exists()
            if already_notified:
                skipped += 1
                continue

            if not dry_run:
                create_notification(
                    user=admin,
                    title=title,
                    message=message,
                    notification_type='warning',
                    activity_type=ACTIVITY_TYPE,
                    url='/school/subscription',
                )
            sent += 1

        return sent, skipped
