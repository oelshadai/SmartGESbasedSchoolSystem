from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from students.models import Student, StudentPromotion
from schools.models import School, Class, AcademicYear, Term
from students.promotion_views import _get_next_class, _check_promotion_eligibility, _is_graduation_class


class Command(BaseCommand):
    help = 'Bulk promote students at the end of academic year'

    def add_arguments(self, parser):
        parser.add_argument(
            '--school-id',
            type=int,
            required=True,
            help='School ID to process promotions for'
        )
        parser.add_argument(
            '--academic-year-id',
            type=int,
            required=True,
            help='Academic year ID for the promotion'
        )
        parser.add_argument(
            '--from-class',
            type=str,
            help='Specific class level to promote (e.g., BASIC_1). If not provided, promotes all classes.'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be promoted without actually doing it'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force promotion ignoring eligibility requirements'
        )

    def handle(self, *args, **options):
        school_id = options['school_id']
        academic_year_id = options['academic_year_id']
        from_class_level = options.get('from_class')
        dry_run = options['dry_run']
        force_promotion = options['force']

        try:
            school = School.objects.get(id=school_id)
            academic_year = AcademicYear.objects.get(id=academic_year_id, school=school)
        except (School.DoesNotExist, AcademicYear.DoesNotExist):
            raise CommandError('Invalid school or academic year ID')

        self.stdout.write(
            self.style.SUCCESS(f'Processing promotions for {school.name} - {academic_year.name}')
        )

        # Check if third term is completed
        if not force_promotion:
            third_term = Term.objects.filter(
                academic_year=academic_year,
                name='THIRD'
            ).first()
            
            if not third_term:
                raise CommandError('Third term not found for this academic year')
            
            from django.utils import timezone
            if third_term.end_date > timezone.now().date():
                raise CommandError(
                    f'Third term ends on {third_term.end_date}. '
                    'Use --force to override this check.'
                )

        # Get classes to process
        if from_class_level:
            classes = Class.objects.filter(school=school, level=from_class_level)
            if not classes.exists():
                raise CommandError(f'No classes found with level {from_class_level}')
        else:
            classes = Class.objects.filter(school=school).order_by('level')

        total_promoted = 0
        total_failed = 0
        promotion_summary = []

        for class_obj in classes:
            self.stdout.write(f'\nProcessing {class_obj}...')
            
            # Get next class
            next_class = _get_next_class(class_obj, school)
            if not next_class and not _is_graduation_class(class_obj):
                self.stdout.write(
                    self.style.WARNING(f'  No next class found for {class_obj}, skipping')
                )
                continue

            # Get students in this class
            students = Student.objects.filter(
                current_class=class_obj,
                is_active=True,
                school=school
            )

            if not students.exists():
                self.stdout.write(f'  No active students found in {class_obj}')
                continue

            class_promoted = 0
            class_failed = 0
            
            for student in students:
                # Check eligibility
                if not force_promotion:
                    eligible, reason = _check_promotion_eligibility(student, academic_year)
                    if not eligible:
                        self.stdout.write(
                            self.style.WARNING(f'  ❌ {student.get_full_name()}: {reason}')
                        )
                        class_failed += 1
                        continue

                if dry_run:
                    if next_class:
                        self.stdout.write(
                            f'  ✓ Would promote {student.get_full_name()} to {next_class}'
                        )
                    else:
                        self.stdout.write(
                            f'  🎓 Would graduate {student.get_full_name()}'
                        )
                    class_promoted += 1
                else:
                    # Actually promote the student
                    try:
                        with transaction.atomic():
                            promotion = StudentPromotion.objects.create(
                                student=student,
                                from_class=class_obj,
                                to_class=next_class,
                                academic_year=academic_year,
                                is_graduated=_is_graduation_class(class_obj),
                                remarks=f'Automatic promotion after completing {academic_year.name}'
                            )
                            
                            # Update student's current class (only if not graduating)
                            if not promotion.is_graduated:
                                student.current_class = next_class
                                student.save(update_fields=['current_class'])
                            
                            if next_class:
                                self.stdout.write(
                                    self.style.SUCCESS(f'  ✓ Promoted {student.get_full_name()} to {next_class}')
                                )
                            else:
                                self.stdout.write(
                                    self.style.SUCCESS(f'  🎓 Graduated {student.get_full_name()}')
                                )
                            class_promoted += 1
                            
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'  ❌ Failed to promote {student.get_full_name()}: {str(e)}')
                        )
                        class_failed += 1

            promotion_summary.append({
                'class': str(class_obj),
                'next_class': str(next_class) if next_class else 'GRADUATION',
                'promoted': class_promoted,
                'failed': class_failed,
                'total': len(students)
            })
            
            total_promoted += class_promoted
            total_failed += class_failed

        # Print summary
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('PROMOTION SUMMARY'))
        self.stdout.write('='*60)
        
        for summary in promotion_summary:
            self.stdout.write(
                f"{summary['class']} → {summary['next_class']}: "
                f"{summary['promoted']}/{summary['total']} promoted"
            )
            if summary['failed'] > 0:
                self.stdout.write(
                    self.style.WARNING(f"  {summary['failed']} students failed eligibility")
                )

        self.stdout.write(f'\nTotal: {total_promoted} promoted, {total_failed} failed')
        
        if dry_run:
            self.stdout.write(
                self.style.WARNING('\nThis was a dry run. No actual promotions were made.')
            )
            self.stdout.write('Run without --dry-run to execute the promotions.')
        else:
            self.stdout.write(
                self.style.SUCCESS(f'\n✅ Promotion process completed for {school.name}')
            )