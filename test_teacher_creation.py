#!/usr/bin/env python
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))
django.setup()

from teachers.serializers import TeacherCreateSerializer
from django.test import RequestFactory
from django.contrib.auth import get_user_model
from schools.models import School

def test_teacher_creation():
    print("Testing Teacher Creation...")

    # Create a mock request
    factory = RequestFactory()
    User = get_user_model()

    # Get first school
    try:
        school = School.objects.first()
        if not school:
            print('❌ No school found')
            return False
        print(f'✅ Using school: {school.name}')
    except Exception as e:
        print(f'❌ Error getting school: {e}')
        return False

    # Create a mock user
    try:
        user = User.objects.create_user(
            email='admin@example.com',
            password='admin123',
            role='SCHOOL_ADMIN',
            school=school
        )
        print(f'✅ Created mock admin user: {user.email}')
    except Exception as e:
        print(f'❌ Error creating mock user: {e}')
        return False

    # Create mock request
    request = factory.post('/api/teachers/')
    request.user = user

    # Test data
    test_data = {
        'email': 'test.teacher@example.com',
        'first_name': 'Test',
        'last_name': 'Teacher',
        'password': 'testpass123',
        'employee_id': 'TEST001',
        'hire_date': '2024-01-01'
    }

    print(f'📝 Testing with data: {test_data}')

    try:
        serializer = TeacherCreateSerializer(data=test_data, context={'request': request})
        print('✅ Serializer created successfully')

        if serializer.is_valid():
            print('✅ Serializer validation passed')
            teacher = serializer.save(school=school)
            print(f'✅ Teacher created: {teacher}')

            # Test serialization for response
            from teachers.serializers import TeacherSerializer
            response_serializer = TeacherSerializer(teacher)
            response_data = response_serializer.data
            print(f'✅ Response serialization successful: {len(response_data)} fields')

            # Clean up
            teacher.user.delete()
            teacher.delete()
            user.delete()
            print('🧹 Cleanup completed')

            print('🎉 Test successful! Teacher creation works without hanging.')
            return True
        else:
            print(f'❌ Serializer validation errors: {serializer.errors}')
            return False

    except Exception as e:
        print(f'❌ Error during test: {e}')
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    success = test_teacher_creation()
    sys.exit(0 if success else 1)
