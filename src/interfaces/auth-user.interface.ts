export interface AuthUser {
  id: number;
  username: string;
  status: string;
  employeeId: number;
  roleId: number;
  provinceId: number | null;
  districtId: number | null;
  employee: {
    id: number;
    first_name: string;
    last_name: string;
    emp_code: string;
    gender: string;
    posId: number;
    departmentId: number;
    divisionId: number;
    officeId: number;
    unitId: number;
    division: {
      id: number;
      branch_id: number | null;
    } | null;
  };
}
