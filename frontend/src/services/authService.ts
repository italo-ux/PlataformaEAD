import { api } from "./api";
import type {
  AuthMessageResponse,
  ResetPasswordRequest,
  VerifyEmailRequest,
} from "../types/auth";

export const authService = {
  forgotPassword: (email: string) =>
    api.post<AuthMessageResponse>("/auth/forgot-password", { email }),

  resetPassword: (data: ResetPasswordRequest) =>
    api.post<AuthMessageResponse>("/auth/reset-password", data),

  verifyEmail: (data: VerifyEmailRequest) =>
    api.post<AuthMessageResponse>("/auth/verify", data),

  resendVerification: (email: string) =>
    api.post<AuthMessageResponse>("/auth/resend-verification", { email }),
};
