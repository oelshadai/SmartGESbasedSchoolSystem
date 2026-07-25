"""Cleanup expired lesson resources

Deletes files from storage and removes DB records for resources whose
`expires_at` timestamp is in the past.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.files.storage import default_storage

from timetable.models import LessonResource


class Command(BaseCommand):
    help = 'Delete expired lesson resources (files and DB records)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show which resources would be deleted without making changes'
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        now = timezone.now()
        expired = LessonResource.objects.filter(expires_at__lt=now)

        if not expired.exists():
            self.stdout.write(self.style.SUCCESS('No expired lesson resources found'))
            return

        total = expired.count()
        self.stdout.write(f'Found {total} expired resource(s)')

        deleted = 0
        for res in expired:
            try:
                file_name = getattr(res.file, 'name', None)
                self.stdout.write(f'-> Resource {res.id}: {res.title or res.original_filename} (file={file_name})')
                if not dry_run:
                    # Delete file from storage (works with local or cloud storage)
                    if file_name:
                        try:
                            default_storage.delete(file_name)
                        except Exception as e:
                            self.stderr.write(f'Failed to delete file {file_name}: {e}')
                    res.delete()
                    deleted += 1
            except Exception as e:
                self.stderr.write(f'Error processing resource {res.id}: {e}')

        if dry_run:
            self.stdout.write(self.style.SUCCESS('Dry run complete — no changes made'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Deleted {deleted} resource(s)'))
