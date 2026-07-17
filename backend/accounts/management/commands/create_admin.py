from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
import os

User = get_user_model()

class Command(BaseCommand):
    help = 'Create admin user from environment variables'

    def handle(self, *args, **options):
        email = os.environ.get('SUPERADMIN_EMAIL', '').strip().lower()
        password = os.environ.get('SUPERADMIN_PASSWORD', '')

        if not email or not password:
            self.stdout.write(self.style.WARNING('SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD are required to create a superadmin.'))
            return
        
        if not User.objects.filter(email__iexact=email).exists():
            User.objects.create_superuser(
                email=email,
                password=password,
                first_name=os.environ.get('ADMIN_FIRST_NAME', 'System'),
                last_name=os.environ.get('ADMIN_LAST_NAME', 'Admin'),
                role='SUPER_ADMIN',
            )
            self.stdout.write(self.style.SUCCESS(f'Admin user "{email}" created successfully'))
        else:
            self.stdout.write(self.style.WARNING(f'Admin user "{email}" already exists'))
