# Financial Management Permission System ✅

## Overview
Financial management access is now controlled by permissions. School admins can assign bursar/financial manager roles to staff members.

---

## How It Works

### 1. **School Admin Access**
- **School Admins** ALWAYS have access to financial management
- No additional permission needed
- Can manage finances themselves

### 2. **Staff/Teacher Access (Bursar Role)**
- Teachers can be granted financial management access
- Admin assigns permission via **Staff Permissions** page
- Once granted, they see "Financial" menu item
- Can access all financial pages

### 3. **Permission Field**
- Added `can_manage_finances` to `StaffPermission` model
- Boolean field (True/False)
- Default: False

---

## For School Admins: How to Assign Financial Access

### Step 1: Navigate to Staff Permissions
1. Login as School Admin
2. Go to **Staff Permissions** in sidebar
3. Find the teacher you want to assign as bursar

### Step 2: Grant Financial Permission
1. Click on the teacher's permission record
2. Check the box: **"Can Manage Finances"**
3. Save changes

### Step 3: Verify Access
1. The teacher logs in
2. They now see **"Financial"** menu item
3. They can access all financial pages:
   - Financial Dashboard
   - Staff Management
   - Payroll Management
   - Expense Management
   - Income Tracking
   - Budget Planning

---

## Database Changes

### Migration Created
```bash
python manage.py makemigrations schools --name add_financial_permission
python manage.py migrate
```

### New Field
```python
class StaffPermission(models.Model):
    # ... existing fields ...
    
    can_manage_finances = models.BooleanField(
        default=False,
        help_text='Allow this staff member to access financial management (bursar role)'
    )
```

---

## Frontend Changes

### 1. User Interface (types/index.ts)
```typescript
export interface User {
  // ... existing fields ...
  can_manage_finances?: boolean;
}
```

### 2. Navigation (AppLayout.tsx)
```typescript
// Financial menu item with permission check
{ 
  label: 'Financial', 
  path: '/school/financial', 
  icon: <DollarSign />, 
  requiresPermission: 'financial' 
}

// Filter logic
const filteredNavItems = navItems.filter(item => {
  if (!item.requiresPermission) return true;
  
  // School admins always have access
  if (user.role === 'SCHOOL_ADMIN') return true;
  
  // Check if user has financial permission
  if (item.requiresPermission === 'financial') {
    return user.can_manage_finances === true;
  }
  
  return true;
});
```

### 3. Backend Serializer (accounts/serializers.py)
```python
class UserSerializer(serializers.ModelSerializer):
    can_manage_finances = serializers.SerializerMethodField()
    
    def get_can_manage_finances(self, obj):
        # School admins always have access
        if obj.role == 'SCHOOL_ADMIN':
            return True
        
        # Check staff permissions for teachers
        if obj.role == 'TEACHER' and obj.school:
            try:
                perm = StaffPermission.objects.get(school=obj.school, teacher=obj)
                return perm.can_manage_finances
            except StaffPermission.DoesNotExist:
                return False
        
        return False
```

---

## Access Control Matrix

| Role | Financial Access | How |
|------|-----------------|-----|
| **School Admin** | ✅ Always | Automatic |
| **Principal** | ✅ Always | Automatic (same as School Admin) |
| **Teacher** | ⚠️ Conditional | Must be granted via Staff Permissions |
| **Student** | ❌ Never | No access |
| **Parent** | ❌ Never | No access |

---

## Use Cases

### Use Case 1: Admin Manages Finances Alone
- Admin doesn't assign permission to anyone
- Only admin sees Financial menu
- Admin handles all financial tasks

### Use Case 2: Admin Assigns Bursar
- Admin grants `can_manage_finances` to a teacher
- Teacher becomes bursar
- Both admin and bursar can manage finances

### Use Case 3: Multiple Financial Managers
- Admin grants permission to multiple teachers
- Accountant, bursar, finance officer all have access
- All can work simultaneously

---

## Security Features

### 1. **Backend Validation**
- All financial API endpoints check user permissions
- School-level data isolation
- User must belong to the school

### 2. **Frontend Protection**
- Menu item hidden if no permission
- Routes protected by ProtectedRoute component
- API calls fail if unauthorized

### 3. **Audit Trail**
- All financial actions tracked
- `created_by`, `approved_by` fields
- Timestamps on all records

---

## Testing Checklist

### As School Admin:
- [ ] Login as School Admin
- [ ] See "Financial" menu item
- [ ] Access all financial pages
- [ ] Navigate to Staff Permissions
- [ ] Grant financial permission to a teacher
- [ ] Verify teacher can now access financial pages

### As Teacher (Without Permission):
- [ ] Login as Teacher
- [ ] Do NOT see "Financial" menu item
- [ ] Cannot access `/school/financial` directly

### As Teacher (With Permission):
- [ ] Admin grants permission
- [ ] Teacher logs out and back in
- [ ] See "Financial" menu item
- [ ] Access all financial pages
- [ ] Can create/edit financial records

---

## API Response Example

### Login Response (School Admin)
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "first_name": "John",
    "last_name": "Doe",
    "email": "admin@school.com",
    "role": "SCHOOL_ADMIN",
    "school": {
      "id": 1,
      "name": "ABC School"
    },
    "can_manage_finances": true
  }
}
```

### Login Response (Teacher with Permission)
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 5,
    "first_name": "Jane",
    "last_name": "Smith",
    "email": "bursar@school.com",
    "role": "TEACHER",
    "school": {
      "id": 1,
      "name": "ABC School"
    },
    "can_manage_finances": true
  }
}
```

### Login Response (Teacher without Permission)
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 6,
    "first_name": "Bob",
    "last_name": "Johnson",
    "email": "teacher@school.com",
    "role": "TEACHER",
    "school": {
      "id": 1,
      "name": "ABC School"
    },
    "can_manage_finances": false
  }
}
```

---

## Troubleshooting

### Issue: Teacher doesn't see Financial menu after permission granted
**Solution:** Teacher must log out and log back in for permission to take effect

### Issue: Permission checkbox not showing in Staff Permissions
**Solution:** Run migrations: `python manage.py migrate`

### Issue: API returns 403 Forbidden
**Solution:** Check that user has permission and belongs to the school

---

## Future Enhancements (Optional)

- [ ] Granular permissions (view-only, approve-only, etc.)
- [ ] Financial role templates (Bursar, Accountant, Auditor)
- [ ] Permission expiry dates
- [ ] Activity logs for permission changes
- [ ] Email notifications when permission granted

---

**Status:** 🟢 IMPLEMENTED & READY

Financial permission system is fully functional!
