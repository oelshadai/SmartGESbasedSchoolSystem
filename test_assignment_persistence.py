#!/usr/bin/env python3
"""
Test script to verify assignment persistence after teacher re-login
"""
import os
import sys
import django

# Add the backend directory to Python path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'school_report_saas.settings')
django.setup()

from django.contrib.auth import get_user_model
from assignments.models import Assignment
from schools.models import Class, ClassSubject
from django.db import models

User = get_user_model()

def test_assignment_persistence():
    """Test that assignments persist after teacher re-login"""
    
    print("🔍 Testing Assignment Persistence After Teacher Re-login")
    print("=" * 60)
    
    # Find a teacher user
    teacher_users = User.objects.filter(role='TEACHER')[:5]
    
    if not teacher_users.exists():
        print("❌ No teacher users found. Please create a teacher first.")
        return
    
    for teacher in teacher_users:
        print(f"\n👨‍🏫 Testing Teacher: {teacher.get_full_name()} (ID: {teacher.id})")
        print(f"   Email: {teacher.email}")
        
        # Check classes where teacher has access
        class_teacher_classes = Class.objects.filter(class_teacher=teacher)
        subject_classes = ClassSubject.objects.filter(teacher=teacher)
        
        print(f"   Classes as Class Teacher: {class_teacher_classes.count()}")
        print(f"   Subject Assignments: {subject_classes.count()}")
        
        if class_teacher_classes.exists() or subject_classes.exists():
            # Get all classes teacher has access to
            all_class_ids = list(class_teacher_classes.values_list('id', flat=True))
            all_class_ids.extend(subject_classes.values_list('class_instance', flat=True))
            all_class_ids = list(set(all_class_ids))
            
            print(f"   Total Classes with Access: {len(all_class_ids)}")
            
            # Check assignments using the new filtering logic
            teacher_assignments = Assignment.objects.filter(
                models.Q(created_by=teacher) |
                models.Q(class_instance__in=all_class_ids)
            ).distinct()
            
            print(f"   📚 Total Assignments (New Logic): {teacher_assignments.count()}")
            
            # Check assignments using old logic (created_by only)
            old_assignments = Assignment.objects.filter(created_by=teacher)
            print(f"   📚 Assignments (Old Logic): {old_assignments.count()}")
            
            if teacher_assignments.exists():
                print("   ✅ Assignments found with new filtering logic")
                for assignment in teacher_assignments[:3]:
                    print(f"      - {assignment.title} ({assignment.assignment_type}) - Status: {assignment.status}")
            else:
                print("   ⚠️  No assignments found")
                
            # Test the API filtering logic
            from schools.models import ClassSubject
            teacher_subjects = ClassSubject.objects.filter(
                teacher=teacher
            ).values_list('id', flat=True)
            
            api_assignments = Assignment.objects.filter(
                models.Q(created_by=teacher) |
                models.Q(class_subject__in=teacher_subjects)
            ).distinct()
            
            print(f"   🔌 API Assignments Count: {api_assignments.count()}")
            
        else:
            print("   ⚠️  Teacher has no class assignments")
    
    print("\n" + "=" * 60)
    print("✅ Assignment persistence test completed")

if __name__ == '__main__':
    test_assignment_persistence()