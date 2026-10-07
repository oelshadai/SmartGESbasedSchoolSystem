from rest_framework import serializers
from .models import Notification, SupportTicket, SmsLog

class SupportTicketSerializer(serializers.ModelSerializer):
    submitter_name = serializers.SerializerMethodField()
    submitter_email = serializers.SerializerMethodField()
    replied_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SupportTicket
        fields = [
            'id', 'subject', 'message', 'status', 'priority',
            'school_name', 'admin_reply', 'replied_at', 'replied_by_name',
            'submitter_name', 'submitter_email', 'created_at', 'updated_at',
        ]
        read_only_fields = ['status', 'school_name', 'created_at', 'updated_at', 'admin_reply', 'replied_at', 'replied_by_name']

    def get_submitter_name(self, obj):
        return obj.user.get_full_name() or obj.user.email

    def get_submitter_email(self, obj):
        return obj.user.email

    def get_replied_by_name(self, obj):
        if obj.replied_by:
            return obj.replied_by.get_full_name() or obj.replied_by.email
        return None

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'title', 'message', 'type', 'read', 'created_at']


class SmsLogSerializer(serializers.ModelSerializer):
    sent_by_name = serializers.SerializerMethodField()
    can_resend_failed = serializers.SerializerMethodField()

    class Meta:
        model = SmsLog
        fields = [
            'id', 'sms_type', 'status',
            'total_recipients', 'sent_count', 'failed_count', 'no_phone_count',
            'message_preview', 'filters_used', 'details',
            'failure_reason', 'sent_by_name', 'can_resend_failed', 'created_at',
        ]

    def get_sent_by_name(self, obj):
        if obj.sent_by:
            return obj.sent_by.get_full_name() or obj.sent_by.email
        return None

    def get_can_resend_failed(self, obj):
        complete_message_available = bool(obj.message_body) or (
            0 < len(obj.message_preview) < 200
        )
        return (
            obj.sms_type == 'general'
            and obj.filters_used.get('type') == 'direct_sms'
            and obj.failed_count > 0
            and complete_message_available
        )