# SystemSettings Page - Testing Guide

## Prerequisites
1. Backend server running: `python manage.py runserver`
2. Frontend server running: `npm run dev`
3. Admin user logged in

## Test Cases

### Test 1: Page Loads Successfully
**Steps:**
1. Login as admin user
2. Navigate to System Settings page
3. Wait for page to load

**Expected Results:**
- ✅ Page loads without errors
- ✅ All sections are visible:
  - School Profile
  - Academic Settings
  - Report Settings
  - Grading Scale Settings
- ✅ Current settings are displayed
- ✅ No console errors

**If it fails:**
- Check browser console for errors
- Verify API endpoint: `GET /api/schools/settings/`
- Ensure user has a school associated

---

### Test 2: School Profile Section
**Steps:**
1. Update School Name
2. Update Email
3. Update Phone
4. Update Address
5. Update Location
6. Update Motto
7. Update Website
8. Click "Save Settings"

**Expected Results:**
- ✅ Success message appears
- ✅ Refresh page - changes are persisted
- ✅ Database updated

---

### Test 3: Academic Settings - Current Term Dropdown
**Steps:**
1. Click on "Current Term" dropdown
2. Verify terms are listed
3. Select a different term
4. Click "Save Settings"
5. Refresh page

**Expected Results:**
- ✅ Dropdown shows all available terms
- ✅ Terms display as "2024/2025 - 1st Term" format
- ✅ Selected term is saved
- ✅ After refresh, selected term is still shown

**If dropdown is empty:**
- Check: `GET /api/schools/terms/`
- Create terms via admin panel or API
- Ensure terms belong to user's school

---

### Test 4: Academic Settings - Score Entry Mode
**Steps:**
1. Change Score Entry Mode to "Class Teacher Mode"
2. Save settings
3. Go to Teacher Score Entry page
4. Verify behavior matches mode
5. Change to "Subject Teacher Mode"
6. Save and verify again

**Expected Results:**
- ✅ Mode changes are saved
- ✅ Score entry page behavior changes accordingly
- ✅ Class Teacher Mode: Shows all classes where teacher is class teacher
- ✅ Subject Teacher Mode: Shows classes + subjects teacher teaches

---

### Test 5: Report Settings - Toggles
**Steps:**
1. Toggle "Show Class Average" OFF
2. Toggle "Show Position in Class" OFF
3. Toggle "Show Attendance" OFF
4. Click "Save Settings"
5. Click "Preview Report Template" button
6. Verify report doesn't show these fields
7. Toggle them back ON
8. Save and preview again

**Expected Results:**
- ✅ Toggles change state visually
- ✅ Changes are saved to database
- ✅ Report preview reflects toggle states
- ✅ When OFF: Fields don't appear in report
- ✅ When ON: Fields appear in report

**Test each toggle:**
- [ ] Show Class Average
- [ ] Show Position in Class
- [ ] Show Attendance
- [ ] Show Behavior Comments
- [ ] Show Student Photos
- [ ] Show Headteacher Signature

---

### Test 6: Report Settings - Template Selection
**Steps:**
1. Select "Standard Template"
2. Save and preview
3. Select "Detailed Template"
4. Save and preview
5. Select "Ghana Education Service"
6. Save and preview

**Expected Results:**
- ✅ Each template has different layout
- ✅ Template selection is saved
- ✅ Preview shows correct template

---

### Test 7: Grading Scale Settings
**Steps:**
1. Change Grade A minimum to 85
2. Change Grade B minimum to 75
3. Change Grade C minimum to 65
4. Change Grade D minimum to 55
5. Click "Save Settings"
6. Go to student report
7. Verify grades are calculated with new scale

**Expected Results:**
- ✅ Grade scale values are saved
- ✅ Validation: A > B > C > D > F
- ✅ Student grades recalculated with new scale
- ✅ Report cards show correct grades

**Invalid test:**
1. Try to set Grade B (75) higher than Grade A (70)
2. Click Save

**Expected:**
- ❌ Validation error appears
- ❌ Settings not saved

---

### Test 8: Term Dates
**Steps:**
1. Set Term Closing Date: 2024-12-20
2. Set Term Reopening Date: 2025-01-15
3. Save settings
4. Preview terminal report

**Expected Results:**
- ✅ Dates are saved
- ✅ Terminal report shows closing date
- ✅ Terminal report shows reopening date

---

### Test 9: File Uploads (Logo & Signature)
**Steps:**
1. Click "School Logo" file input
2. Select an image file
3. Click "Principal Signature" file input
4. Select a signature image
5. Click "Save Settings"
6. Preview report

**Expected Results:**
- ✅ Files upload successfully
- ✅ Logo appears on reports
- ✅ Signature appears on reports

---

### Test 10: Error Handling
**Steps:**
1. Stop backend server
2. Try to save settings
3. Start backend server
4. Try again

**Expected Results:**
- ✅ Error message appears when backend is down
- ✅ Success message appears when backend is up
- ✅ No crashes or blank screens

---

## Quick Test Checklist

### Before Testing
- [ ] Backend running
- [ ] Frontend running
- [ ] Admin user logged in
- [ ] School has terms created

### Core Functionality
- [ ] Page loads with current settings
- [ ] School Profile fields editable
- [ ] Current Term dropdown populated
- [ ] Score Entry Mode selector works
- [ ] All Report Settings toggles work
- [ ] Grading Scale inputs work
- [ ] Save button works
- [ ] Success/error messages appear

### Integration Tests
- [ ] Settings persist after refresh
- [ ] Report preview reflects settings
- [ ] Score entry respects mode setting
- [ ] Grades calculated with custom scale
- [ ] Term dates appear on reports

---

## Common Issues & Solutions

### Issue: "Current Term" dropdown is empty
**Solution:**
1. Create academic year: `POST /api/schools/academic-years/`
2. Create terms for that year: `POST /api/schools/terms/`
3. Refresh settings page

### Issue: Settings don't save
**Solution:**
1. Check browser console for errors
2. Verify token is valid
3. Check user has admin permissions
4. Verify API endpoint: `PATCH /api/schools/settings/`

### Issue: Report preview doesn't reflect changes
**Solution:**
1. Ensure settings are saved first
2. Hard refresh preview (Ctrl+F5)
3. Check report generation code uses settings from database

### Issue: Grading scale validation error
**Solution:**
1. Ensure: A > B > C > D > F >= 0
2. All values must be between 0-100
3. Each grade must be higher than the next

---

## API Endpoints Used

```
GET    /api/schools/settings/          - Fetch current settings
PATCH  /api/schools/settings/          - Update settings
GET    /api/schools/terms/              - Fetch available terms
```

## Database Tables Affected

- `schools` - All settings stored here
- `terms` - Referenced by current_term
- `academic_years` - Referenced by terms

---

## Success Criteria

✅ All 10 test cases pass
✅ No console errors
✅ Settings persist after refresh
✅ Report preview reflects settings
✅ Score entry respects mode
✅ Grades use custom scale

---

**Last Updated:** 2024
**Tested By:** _____________
**Date:** _____________
**Result:** PASS / FAIL
