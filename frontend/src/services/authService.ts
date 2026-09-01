import { api } from "./api";
import type {
  LoginResponse,
  RegisterResponse,
  VerifyEmailResponse,
  AuthMessageResponse,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "../types/auth";

export const authService = {
  login: (email: string, password: string) =>
    api.post<LoginResponse>("/auth/login", { email, password }),

  register: (data: { name: string; email: string; password: string }) =>
    api.post<RegisterResponse>("/auth/register", data),

  forgotPassword: (email: string) =>
    api.post<AuthMessageResponse>("/auth/forgot-password", { email }),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<AuthMessageResponse>("/auth/reset-password", data),

  verifyEmail: (data: VerifyEmailRequest) =>
    api.post<VerifyEmailResponse>("/auth/verify-email", data),

  resendVerification: (email: string) =>
    api.post<AuthMessageResponse>("/auth/resend-verification", { email }),
};