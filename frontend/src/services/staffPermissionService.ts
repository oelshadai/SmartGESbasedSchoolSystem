import secureApiClient from '../lib/secureApiClient';

export interface StaffPermission {
  id: number;
  teacher: number;
  teacher_name: string;
  teacher_email: string;
  can_collect_fees: boolean;
  fee_collection_enabled: boolean;
  collect_fee_type_ids: number[];
  can_cover_attendance: boolean;
  cover_class_ids: number[];
  created_at: string;
  updated_at: string;
}

/** Returned by GET /staff-permissions/my-permissions/ */
export interface MyStaffPermission extends StaffPermission {
  school_fee_collection_enabled: boolean;
  cover_class_names: { id: number; name: string }[];
}

export interface TeacherListItem {
  id: number;
  name: string;
  email: string;
}

const BASE = '/schools/staff-permissions';

export const staffPermissionService = {
  /** Admin: list all staff permissions for this school */
  list(): Promise<StaffPermission[]> {
    return secureApiClient.get(`${BASE}/`);
  },

  /** Admin: create a new staff permission record */
  create(data: Partial<StaffPermission>): Promise<StaffPermission> {
    return secureApiClient.post(`${BASE}/`, data);
  },

  /** Admin: update (PATCH) a staff permission record */
  update(id: number, data: Partial<StaffPermission>): Promise<StaffPermission> {
    return secureApiClient.patch(`${BASE}/${id}/`, data);
  },

  /** Admin: delete a staff permission record */
  remove(id: number): Promise<void> {
    return secureApiClient.delete(`${BASE}/${id}/`);
  },

  /** Admin: flip the individual teacher's fee_collection_enabled sub-toggle */
  toggleTeacher(id: number, enabled: boolean): Promise<{ fee_collection_enabled: boolean }> {
    return secureApiClient.patch(`${BASE}/${id}/toggle/`, { fee_collection_enabled: enabled });
  },

  /** Admin: flip school-wide master switch */
  toggleSchoolMaster(enabled: boolean): Promise<{ special_fee_collection_enabled: boolean }> {
    return secureApiClient.patch(`${BASE}/toggle-school-master/`, { enabled });
  },

  /** Admin: list all teachers in the school (for the assignment dropdown) */
  getTeachersList(): Promise<TeacherListItem[]> {
    return secureApiClient.get(`${BASE}/teachers-list/`);
  },

  /** Teacher: get own permissions (returns null if no record exists) */
  async getMyPermissions(): Promise<MyStaffPermission | null> {
    try {
      return await secureApiClient.get<MyStaffPermission>(`${BASE}/my-permissions/`);
    } catch (e: any) {
      if (e?.status === 404 || e?.message?.includes('404') || e?.message?.includes('No staff permission')) {
        return null;
      }
      throw e;
    }
  },
};
