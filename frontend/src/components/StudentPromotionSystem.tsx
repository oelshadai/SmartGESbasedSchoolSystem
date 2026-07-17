import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/services/api';
import { toast } from 'sonner';
import { Users, GraduationCap, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

interface Student {
  id: number;
  student_id: string;
  name: string;
  current_class: string;
  next_class?: string;
  reason?: string;
}

interface Class {
  id: number;
  level: string;
  section: string;
  full_name: string;
}

interface AcademicYear {
  id: number;
  name: string;
  is_current: boolean;
}

interface PromotionPreview {
  class_info: {
    id: number;
    name: string;
    next_class: string;
    is_graduation_class: boolean;
  };
  academic_year: string;
  eligible_students: Student[];
  ineligible_students: Student[];
  summary: {
    total_students: number;
    eligible_count: number;
    ineligible_count: number;
  };
}

export default function StudentPromotionSystem() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [promotionPreview, setPromotionPreview] = useState<PromotionPreview | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [customToClass, setCustomToClass] = useState<string>('');
  const [promotionRemarks, setPromotionRemarks] = useState<string>('');
  const [forcePromotion, setForcePromotion] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('bulk');

  useEffect(() => {
    fetchClasses();
    fetchAcademicYears();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await api.get('/schools/classes/');
      setClasses(response.data);
    } catch (error) {
      toast.error('Failed to fetch classes');
    }
  };

  const fetchAcademicYears = async () => {
    try {
      const response = await api.get('/schools/academic-years/');
      setAcademicYears(response.data);
      
      // Auto-select current academic year
      const currentYear = response.data.find((year: AcademicYear) => year.is_current);
      if (currentYear) {
        setSelectedAcademicYear(currentYear.id.toString());
      }
    } catch (error) {
      toast.error('Failed to fetch academic years');
    }
  };

  const fetchPromotionPreview = async () => {
    if (!selectedClass || !selectedAcademicYear) {
      toast.error('Please select both class and academic year');
      return;
    }

    setLoading(true);
    try {
      const response = await api.get('/students/promotions/preview/', {
        params: {
          class_id: selectedClass,
          academic_year_id: selectedAcademicYear
        }
      });
      setPromotionPreview(response.data);
      setSelectedStudents(response.data.eligible_students.map((s: Student) => s.id));
    } catch (error) {
      toast.error('Failed to fetch promotion preview');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkClassPromotion = async () => {
    if (!selectedClass || !selectedAcademicYear) {
      toast.error('Please select both class and academic year');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/students/promotions/bulk-class/', {
        from_class_id: selectedClass,
        to_class_id: customToClass || undefined,
        academic_year_id: selectedAcademicYear,
        force_promotion: forcePromotion
      });

      toast.success(response.data.message);
      
      // Show detailed results
      const { promoted_students, failed_students } = response.data;
      if (failed_students.length > 0) {
        toast.warning(`${failed_students.length} students could not be promoted. Check the results below.`);
      }
      
      // Refresh preview
      fetchPromotionPreview();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to promote class');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectivePromotion = async () => {
    if (selectedStudents.length === 0) {
      toast.error('Please select at least one student');
      return;
    }

    if (!customToClass) {
      toast.error('Please select destination class');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/students/promotions/selective/', {
        student_ids: selectedStudents,
        to_class_id: customToClass,
        academic_year_id: selectedAcademicYear,
        remarks: promotionRemarks,
        force_promotion: forcePromotion
      });

      toast.success(response.data.message);
      
      // Refresh preview
      fetchPromotionPreview();
      setSelectedStudents([]);
      setPromotionRemarks('');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to promote students');
    } finally {
      setLoading(false);
    }
  };

  const toggleStudentSelection = (studentId: number) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const selectAllEligible = () => {
    if (!promotionPreview) return;
    setSelectedStudents(promotionPreview.eligible_students.map(s => s.id));
  };

  const clearSelection = () => {
    setSelectedStudents([]);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Student Promotion System
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="class-select">Select Class</Label>
              <Select value={selectedClass} onValueChange={setSelectedClass}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>
                      {cls.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="year-select">Academic Year</Label>
              <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id.toString()}>
                      {year.name} {year.is_current && '(Current)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                onClick={fetchPromotionPreview} 
                disabled={loading || !selectedClass || !selectedAcademicYear}
                className="w-full"
              >
                {loading ? 'Loading...' : 'Preview Promotion'}
              </Button>
            </div>
          </div>

          {promotionPreview && (
            <div className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>{promotionPreview.class_info.name}</strong> → <strong>{promotionPreview.class_info.next_class}</strong>
                  <br />
                  {promotionPreview.summary.eligible_count} of {promotionPreview.summary.total_students} students are eligible for promotion.
                  {promotionPreview.class_info.is_graduation_class && (
                    <span className="text-amber-600 font-medium"> This is a graduation class.</span>
                  )}
                </AlertDescription>
              </Alert>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="bulk">Bulk Class Promotion</TabsTrigger>
                  <TabsTrigger value="selective">Selective Promotion</TabsTrigger>
                </TabsList>

                <TabsContent value="bulk" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Promote Entire Class</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Custom Destination Class (Optional)</Label>
                          <Select value={customToClass} onValueChange={setCustomToClass}>
                            <SelectTrigger>
                              <SelectValue placeholder={`Auto: ${promotionPreview.class_info.next_class}`} />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                  {cls.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="force-bulk" 
                            checked={forcePromotion}
                            onCheckedChange={setForcePromotion}
                          />
                          <Label htmlFor="force-bulk">Force promotion (ignore eligibility)</Label>
                        </div>
                      </div>

                      <Button 
                        onClick={handleBulkClassPromotion}
                        disabled={loading}
                        className="w-full"
                        size="lg"
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Promote All Eligible Students ({promotionPreview.summary.eligible_count})
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="selective" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center justify-between">
                        Select Students to Promote
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={selectAllEligible}>
                            Select All Eligible
                          </Button>
                          <Button variant="outline" size="sm" onClick={clearSelection}>
                            Clear Selection
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Destination Class</Label>
                          <Select value={customToClass} onValueChange={setCustomToClass}>
                            <SelectTrigger>
                              <SelectValue placeholder="Choose destination class" />
                            </SelectTrigger>
                            <SelectContent>
                              {classes.map((cls) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                  {cls.full_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="force-selective" 
                            checked={forcePromotion}
                            onCheckedChange={setForcePromotion}
                          />
                          <Label htmlFor="force-selective">Force promotion</Label>
                        </div>
                      </div>

                      <div>
                        <Label>Promotion Remarks (Optional)</Label>
                        <Textarea 
                          value={promotionRemarks}
                          onChange={(e) => setPromotionRemarks(e.target.value)}
                          placeholder="Enter remarks for this promotion..."
                          rows={3}
                        />
                      </div>

                      <Button 
                        onClick={handleSelectivePromotion}
                        disabled={loading || selectedStudents.length === 0 || !customToClass}
                        className="w-full"
                        size="lg"
                      >
                        <GraduationCap className="h-4 w-4 mr-2" />
                        Promote Selected Students ({selectedStudents.length})
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              {/* Student Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Eligible Students */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <CheckCircle className="h-5 w-5" />
                      Eligible Students ({promotionPreview.summary.eligible_count})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {promotionPreview.eligible_students.map((student) => (
                        <div 
                          key={student.id} 
                          className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-gray-50"
                        >
                          <Checkbox
                            checked={selectedStudents.includes(student.id)}
                            onCheckedChange={() => toggleStudentSelection(student.id)}
                          />
                          <div className="flex-1">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-foreground/70">ID: {student.student_id}</div>
                          </div>
                          <Badge variant="secondary">{student.current_class}</Badge>
                        </div>
                      ))}
                      {promotionPreview.eligible_students.length === 0 && (
                        <div className="text-center text-foreground/70 py-8">
                          No eligible students found
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Ineligible Students */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-5 w-5" />
                      Ineligible Students ({promotionPreview.summary.ineligible_count})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {promotionPreview.ineligible_students.map((student) => (
                        <div 
                          key={student.id} 
                          className="flex items-center space-x-3 p-3 border rounded-lg bg-red-50"
                        >
                          <div className="flex-1">
                            <div className="font-medium">{student.name}</div>
                            <div className="text-sm text-foreground/70">ID: {student.student_id}</div>
                            <div className="text-sm text-red-600 mt-1">{student.reason}</div>
                          </div>
                          <Badge variant="destructive">{student.current_class}</Badge>
                        </div>
                      ))}
                      {promotionPreview.ineligible_students.length === 0 && (
                        <div className="text-center text-foreground/70 py-8">
                          All students are eligible for promotion
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}