from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LessonResourceViewSet, TeacherTimetableViewSet, StudentTimetableViewSet

router = DefaultRouter()
router.register(r'teacher', TeacherTimetableViewSet, basename='timetable-teacher')
router.register(r'student', StudentTimetableViewSet, basename='timetable-student')
router.register(r'resource', LessonResourceViewSet, basename='timetable-resource')

urlpatterns = [
    path('', include(router.urls)),
]
