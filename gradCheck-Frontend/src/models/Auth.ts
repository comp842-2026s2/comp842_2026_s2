export interface StudentLoginRequest {
  login_id: string;
  login_password: string;
}

export interface AuthenticatedStudent {
  id: number;
  login_id: string;
  login_type: number;
}

export interface StudentLoginResponse extends AuthenticatedStudent {
  access_token?: string;
  token_type?: string;
}
