export interface RegistrationRequest {
  student_id: string;
  student_name: string;
  degree_id: number;
  wallet_address: string;
  conferral_date: string;
}

export interface RegistrationResponse {
  registration_id: number;
  status: string;
}