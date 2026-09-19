export interface StudentRegistrationRequest {
  student_id: string;
  student_name: string;
  degree_id: number;
  wallet_address: string;
  conferral_date: string;
  student_password: string;
}

export interface StudentRegistrationResponse {
  registration_id: number;
  status: "registered" | string;
  login_created: boolean;
}
