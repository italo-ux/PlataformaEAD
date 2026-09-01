export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  cpf?: string;
  phone?: string;
  role: "aluno" | "professor" | "admin";
  createdAt?: string;
}

export interface LoginResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface RegisterResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface VerifyEmailResponse {
  user: AuthUser;
  tokens: AuthTokens;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  code: string;
  password: string;
  confirmPassword: string;
}

export interface VerifyEmailRequest {
  email: string;
  code: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface AuthMessageResponse {
  message: string;
}