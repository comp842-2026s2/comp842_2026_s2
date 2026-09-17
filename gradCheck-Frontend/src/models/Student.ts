export interface StudentRegistrationRequest {
  student_id: string;
  student_name: string;
  degree_id: number;
  wallet_address: string;
  conferral_date: string;
}

export interface StudentRegistrationResponse {
  registration_id: number;
  student_id: string;
  message?: string;
}

export interface StudentProfile {
  student_id: string;
  student_name: string;
  degree_id: number;
  degree_name?: string;
  wallet_address: string;
  conferral_date: string;
}
