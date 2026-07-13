import { Request } from 'express';

export interface UserRequest extends Request {
  user: {
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
      department: {
        id: number;
        department_name: string;
      } | null;
      division: {
        id: number;
        division_name: string;
        branch_id: number | null;
      } | null;
      office: {
        id: number;
        office_name: string;
        unitId: number | null;
      } | null;
      unit: {
        id: number;
        unit_name: string;
        divisionId: number | null;
      } | null;
      position: {
        id: number;
        pos_name: string;
      } | null;
    };
  };
}
