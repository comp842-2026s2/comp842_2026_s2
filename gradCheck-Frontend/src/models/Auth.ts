export const LOGIN_TYPE_STUDENT = 1 as const;
export const LOGIN_TYPE_STAFF = 2 as const;

export type LoginType =
  | typeof LOGIN_TYPE_STUDENT
  | typeof LOGIN_TYPE_STAFF;

export interface LoginRequest {
  login_id: string;
  login_password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  login_type: LoginType;
  login_id: string;
}
