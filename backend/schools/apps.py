from django.apps import AppConfig


class SchoolsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'schools'

    def ready(self):
        # Load financial audit signal handlers
        from . import signals  # noqa: F401
