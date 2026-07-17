import { useState, useEffect } from 'react';
import DataTable from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, UserCheck, UserX, Loader2, UserPlus, Copy, Check, Users, Camera } from 'lucide-react';
import { secureApiClient } from '@/lib/secureApiClient';
import { useToast } from '@/hooks/use-toast';

interface Student {
  id: number;
  student_id: string;
  full_name: string;
  first_name: string;
  last_name: string;
  other_names: string;
  gender: string;
  date_of_birth: string;
  age: number;
  current_class: number;
  class_name: string;
  guardian_name: string;
  guardian_phone: string;
  guardian_email: string;
  guardian_address: string;
  admission_date: string;
  is_active: boolean;
  username: string;
  password: string;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  // Add Student Form State
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addingStudent, setAddingStudent] = useState(false);
  const [showCredentials, setShowCredentials] = useState(false);
  const [newStudentCredentials, setNewStudentCredentials] = useState<{username: string, password: string, name: string} | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [canAddStudents, setCanAddStudents] = useState(true);
  const [formData, setFormData] = useState({
    student_id: '',
    first_name: '',
    last_name: '',
    other_names: '',
    gender: '',
    date_of_birth: '',
    guardian_name: '',
    guardian_phone: '',
    guardian_email: '',
    guardian_address: '',
    admission_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchStudents();
    fetchPermission();
  }, []);

  const fetchPermission = async () => {
    try {
      const res = await secureApiClient.get('/schools/settings/');
      setCanAddStudents(res.teachers_can_add_students !== false);
    } catch {
      // default to true if settings unavailable
    }
  };

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await secureApiClient.get('/students/');
      const data = Array.isArray(response) ? response : response.results || response.data || [];
      setStudents(data);
    } catch (error: any) {
      console.error('Failed to fetch students:', error);
      toast({ 
        title: "Error", 
        description: "Failed to load students", 
        variant: "destructive" 
      });
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setShowViewDialog(true);
  };

  const handleToggleStatus = async (student: Student) => {
    try {
      setActionLoading(true);
      // Backend toggles status on DELETE request for teachers
      await secureApiClient.delete(`/students/${student.id}/`);
      
      toast({ 
        title: "Success", 
        description: `Student ${student.is_active ? 'deactivated' : 'activated'} successfully` 
      });
      
      await fetchStudents();
    } catch (error: any) {
      console.error('Failed to toggle student status:', error);
      toast({ 
        title: "Error", 
        description: error.response?.data?.detail || "Failed to update student status", 
        variant: "destructive" 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddStudent = async () => {
    // Validate required fields
    if (!formData.student_id || !formData.first_name || !formData.last_name || 
        !formData.gender || !formData.date_of_birth || !formData.guardian_name || 
        !formData.guardian_phone || !formData.guardian_address || !formData.admission_date) {
      toast({ 
        title: "Validation Error", 
        description: "Please fill all required fields", 
        variant: "destructive" 
      });
      return;
    }

    try {
      setAddingStudent(true);
      
      // Use FormData if there's a photo, otherwise use JSON
      let response;
      if (photoFile) {
        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
          formDataToSend.append(key, value);
        });
        formDataToSend.append('photo', photoFile);
        
        response = await secureApiClient.post('/students/', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await secureApiClient.post('/students/', formData);
      }
      
      // Show credentials dialog
      setNewStudentCredentials({
        username: response.username || response.generated_username || `std_${formData.student_id}`,
        password: response.password || response.generated_password || 'Generated',
        name: `${formData.first_name} ${formData.last_name}`
      });
      setShowAddDialog(false);
      setShowCredentials(true);
      
      // Reset form
      setFormData({
        student_id: '',
        first_name: '',
        last_name: '',
        other_names: '',
        gender: '',
        date_of_birth: '',
        guardian_name: '',
        guardian_phone: '',
        guardian_email: '',
        guardian_address: '',
        admission_date: new Date().toISOString().split('T')[0],
      });
      setPhotoFile(null);
      setPhotoPreview(null);
      
      await fetchStudents();
      
      toast({ 
        title: "Success", 
        description: "Student added successfully!" 
      });
    } catch (error: any) {
      console.error('Failed to add student:', error);
      const errorMsg = error.response?.data?.detail || 
                       error.response?.data?.student_id?.[0] ||
                       error.response?.data?.error ||
                       "Failed to add student";
      toast({ 
        title: "Error", 
        description: errorMsg, 
        variant: "destructive" 
      });
    } finally {
      setAddingStudent(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const columns = [
    { 
      key: 'student_id', 
      label: 'Student ID',
      render: (s: Student) => (
        <span className="font-medium text-foreground">{s.student_id}</span>
      )
    },
    { 
      key: 'full_name', 
      label: 'Full Name',
      render: (s: Student) => (
        <span className="font-medium text-foreground">{s.full_name}</span>
      )
    },
    { 
      key: 'gender', 
      label: 'Gender',
      render: (s: Student) => (
        <span className="text-sm text-muted-foreground">
          {s.gender === 'M' ? 'Male' : 'Female'}
        </span>
      )
    },
    { 
      key: 'age', 
      label: 'Age',
      render: (s: Student) => (
        <span className="text-sm text-muted-foreground">{s.age} years</span>
      )
    },
    { 
      key: 'class_name', 
      label: 'Class',
      render: (s: Student) => (
        <Badge variant="outline">{s.class_name || 'No Class'}</Badge>
      )
    },
    { 
      key: 'guardian_phone', 
      label: 'Guardian Phone',
      render: (s: Student) => (
        <span className="text-sm text-muted-foreground">{s.guardian_phone}</span>
      )
    },
    { 
      key: 'is_active', 
      label: 'Status',
      render: (s: Student) => (
        <Badge variant={s.is_active ? "default" : "secondary"}>
          {s.is_active ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    { 
      key: 'actions', 
      label: 'Actions',
      render: (s: Student) => (
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => handleView(s)}
            title="View Details"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => handleToggleStatus(s)}
            disabled={actionLoading}
            title={s.is_active ? 'Deactivate' : 'Activate'}
          >
            {s.is_active ? (
              <UserX className="h-4 w-4 text-destructive" />
            ) : (
              <UserCheck className="h-4 w-4 text-green-600" />
            )}
          </Button>
        </div>
      )
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-primary" />
          <p className="text-muted-foreground">Loading students...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Students</h1>
          <p className="text-muted-foreground mt-1">View and manage students in your class</p>
        </div>
        {canAddStudents && (
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Student
          </Button>
        )}
      </div>
      
      {students.length === 0 ? (
        <div className="animated-border">
          <div className="animated-border-content p-8 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-foreground">No students found in your class</p>
            <p className="text-sm mt-2 text-muted-foreground">{canAddStudents ? 'Click "Add Student" to add students to your class.' : 'Your school admin manages student enrollment.'}</p>
            {canAddStudents && (
              <Button onClick={() => setShowAddDialog(true)} className="mt-4 gap-2">
                <UserPlus className="h-4 w-4" />
                Add Your First Student
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="animated-border">
          <div className="animated-border-content p-4">
            <DataTable 
              columns={columns} 
              data={students} 
              searchKey="full_name" 
              searchPlaceholder="Search students..." 
            />
          </div>
        </div>
      )}

      {/* View Student Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Complete information about the student
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Personal Information */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium text-foreground">{selectedStudent.student_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Full Name</p>
                    <p className="font-medium text-foreground">{selectedStudent.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium text-foreground">
                      {selectedStudent.gender === 'M' ? 'Male' : 'Female'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date of Birth</p>
                    <p className="font-medium text-foreground">
                      {new Date(selectedStudent.date_of_birth).toLocaleDateString()} ({selectedStudent.age} years)
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium text-foreground">{selectedStudent.class_name || 'No Class'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Admission Date</p>
                    <p className="font-medium text-foreground">
                      {new Date(selectedStudent.admission_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={selectedStudent.is_active ? "default" : "secondary"}>
                      {selectedStudent.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Guardian Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Guardian Name</p>
                    <p className="font-medium text-foreground">{selectedStudent.guardian_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium text-foreground">{selectedStudent.guardian_phone}</p>
                  </div>
                  {selectedStudent.guardian_email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium text-foreground">{selectedStudent.guardian_email}</p>
                    </div>
                  )}
                  <div className="col-span-2">
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium text-foreground">{selectedStudent.guardian_address}</p>
                  </div>
                </div>
              </div>

              {/* Login Credentials */}
              <div>
                <h3 className="font-semibold mb-3 text-foreground">Student Portal Access</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Username</p>
                    <p className="font-medium text-foreground font-mono">{selectedStudent.username}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Password</p>
                    <p className="font-medium text-foreground font-mono">{selectedStudent.password}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Share these credentials with the student for portal access
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowViewDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Student Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Fill in the student details. Login credentials will be auto-generated.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Photo Upload */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-primary/50 flex items-center justify-center overflow-hidden">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <label htmlFor="photo-upload" className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1.5 cursor-pointer hover:bg-primary/90 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoChange}
                  />
                </label>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">Upload student photo (for report card)</p>

            {/* Student ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="student_id">Student ID *</Label>
                <Input
                  id="student_id"
                  placeholder="e.g., STD001"
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admission_date">Admission Date *</Label>
                <Input
                  id="admission_date"
                  type="date"
                  value={formData.admission_date}
                  onChange={(e) => setFormData({...formData, admission_date: e.target.value})}
                />
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="first_name">First Name *</Label>
                <Input
                  id="first_name"
                  placeholder="First Name"
                  value={formData.first_name}
                  onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Last Name *</Label>
                <Input
                  id="last_name"
                  placeholder="Last Name"
                  value={formData.last_name}
                  onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="other_names">Other Names</Label>
                <Input
                  id="other_names"
                  placeholder="Other Names"
                  value={formData.other_names}
                  onChange={(e) => setFormData({...formData, other_names: e.target.value})}
                />
              </div>
            </div>

            {/* Gender & DOB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender *</Label>
                <Select value={formData.gender} onValueChange={(v) => setFormData({...formData, gender: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Male</SelectItem>
                    <SelectItem value="F">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date_of_birth">Date of Birth *</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})}
                />
              </div>
            </div>

            {/* Guardian Info */}
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Guardian Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guardian_name">Guardian Name *</Label>
                  <Input
                    id="guardian_name"
                    placeholder="Parent/Guardian Name"
                    value={formData.guardian_name}
                    onChange={(e) => setFormData({...formData, guardian_name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_phone">Guardian Phone *</Label>
                  <Input
                    id="guardian_phone"
                    placeholder="Phone Number"
                    value={formData.guardian_phone}
                    onChange={(e) => setFormData({...formData, guardian_phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian_email">Guardian Email</Label>
                  <Input
                    id="guardian_email"
                    type="email"
                    placeholder="Email (optional)"
                    value={formData.guardian_email}
                    onChange={(e) => setFormData({...formData, guardian_email: e.target.value})}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="guardian_address">Guardian Address *</Label>
                  <Input
                    id="guardian_address"
                    placeholder="Home Address"
                    value={formData.guardian_address}
                    onChange={(e) => setFormData({...formData, guardian_address: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddStudent} disabled={addingStudent}>
              {addingStudent ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Student
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials Dialog */}
      <Dialog open={showCredentials} onOpenChange={setShowCredentials}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" />
              Student Added Successfully!
            </DialogTitle>
            <DialogDescription>
              Share these login credentials with the student for portal access.
            </DialogDescription>
          </DialogHeader>
          
          {newStudentCredentials && (
            <div className="space-y-4 py-4">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                <p className="font-semibold text-green-800 dark:text-green-200 mb-3">
                  {newStudentCredentials.name}
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border">
                    <div>
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="font-mono font-medium">{newStudentCredentials.username}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(newStudentCredentials.username, 'username')}
                    >
                      {copiedField === 'username' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-2 rounded border">
                    <div>
                      <p className="text-xs text-muted-foreground">Password</p>
                      <p className="font-mono font-medium">{newStudentCredentials.password}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => copyToClipboard(newStudentCredentials.password, 'password')}
                    >
                      {copiedField === 'password' ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              
              <p className="text-xs text-muted-foreground text-center">
                Students can login at the Student Portal using these credentials
              </p>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowCredentials(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Students;
