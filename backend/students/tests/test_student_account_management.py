from datetime import date

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.request import Request
from rest_framework.test import APIClient, APIRequestFactory

from schools.models import School
from students.models import Student
from students.serializers import StudentCreateSerializer, StudentSerializer


class StudentAccountManagementTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(
            name='Account Test School',
            address='Test address',
            location='Test location',
            phone_number='0200000000',
            email='accounts-test@example.edu',
        )

    def student_data(self, student_id):
        return {
            'student_id': student_id,
            'first_name': 'Ama',
            'last_name': 'Mensah',
            'gender': 'F',
            'date_of_birth': date(2015, 1, 1),
            'guardian_name': 'Kofi Mensah',
            'guardian_phone': '0200000000',
            'guardian_address': 'Test address',
            'admission_date': date(2024, 9, 1),
        }

    def test_create_account_opt_out_creates_student_without_user_or_credentials(self):
        raw_request = APIRequestFactory().post(
            '/api/students/', {'create_account': 'false'}, format='multipart'
        )
        request = Request(raw_request)
        serializer = StudentCreateSerializer(
            data=self.student_data('NOACCOUNT01'),
            context={'request': request},
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)

        student = serializer.save(school=self.school)

        self.assertIsNone(student.user_id)
        self.assertIsNone(student.username)
        self.assertIsNone(student.password)
        self.assertFalse(StudentSerializer(student).data['has_user_account'])
        self.assertEqual(get_user_model().objects.filter(school=self.school).count(), 0)

    def test_admin_can_delete_portal_account_without_deleting_student(self):
        User = get_user_model()
        account = User.objects.create_user(
            email='student-account@example.edu',
            password='temporary-password',
            role='STUDENT',
            school=self.school,
        )
        student = Student.objects.create(
            **self.student_data('HASACCOUNT01'),
            school=self.school,
            user=account,
            username='std_HASACCOUNT01',
            password='temporary',
        )
        admin = User.objects.create_user(
            email='admin@example.edu',
            password='admin-password',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        client = APIClient()
        client.force_authenticate(user=admin)

        response = client.delete(f'/api/students/{student.id}/delete-account/')

        self.assertEqual(response.status_code, 200)
        self.assertTrue(Student.objects.filter(pk=student.pk).exists())
        student.refresh_from_db()
        self.assertIsNone(student.user_id)
        self.assertIsNone(student.username)
        self.assertIsNone(student.password)
        self.assertFalse(User.objects.filter(pk=account.pk).exists())

    def test_admin_can_update_student_without_sending_school(self):
        User = get_user_model()
        student = Student.objects.create(
            **self.student_data('UPDATESTUDENT01'),
            school=self.school,
        )
        other_school = School.objects.create(
            name='Other School',
            address='Other address',
            location='Other location',
            phone_number='0200000001',
            email='other-school@example.edu',
        )
        admin = User.objects.create_user(
            email='update-admin@example.edu',
            password='admin-password',
            role='SCHOOL_ADMIN',
            school=self.school,
        )
        client = APIClient()
        client.force_authenticate(user=admin)
        payload = {
            key: value.isoformat() if isinstance(value, date) else value
            for key, value in self.student_data(student.student_id).items()
        }
        payload['first_name'] = 'Abena'
        payload['school'] = other_school.pk

        response = client.put(
            f'/api/students/{student.id}/',
            payload,
            format='multipart',
        )

        self.assertEqual(response.status_code, 200, response.data)
        student.refresh_from_db()
        self.assertEqual(student.first_name, 'Abena')
        self.assertEqual(student.school_id, self.school.id)
