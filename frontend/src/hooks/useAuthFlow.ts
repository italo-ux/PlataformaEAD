import { useAuthForm } from "./useAuthForm";
import { authService } from "../services/authService";
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  flattenZodError,
  type ResetPasswordInput,
  type VerifyEmailInput,
} from "../utils/validation";
import type { AuthTokens, VerifyEmailResponse } from "../types/auth";

interface UseForgotPasswordOptions {
  onSuccess?: () => void;
}

export function useForgotPassword({ onSuccess }: UseForgotPasswordOptions = {}) {
  return useAuthForm({
    initialValues: { email: "" },
    validate: (values) => flattenZodError(forgotPasswordSchema.safeParse(values)),
    onSubmit: async (values) => {
      await authService.forgotPassword(values.email);
    },
    onSuccess,
  });
}

interface UseResetPasswordOptions {
  email: string;
  onSuccess?: () => void;
}

export function useResetPassword({ email, onSuccess }: UseResetPasswordOptions) {
  return useAuthForm({
    initialValues: { email, code: "", password: "", confirmPassword: "" },
    validate: (values) => flattenZodError(resetPasswordSchema.safeParse(values)),
    onSubmit: async (values) => {
      await authService.resetPassword(values as ResetPasswordInput);
    },
    onSuccess,
  });
}

interface UseVerifyEmailOptions {
  onSuccess?: (tokens: AuthTokens) => void;
}

export function useVerifyEmail({ onSuccess }: UseVerifyEmailOptions = {}) {
  return useAuthForm<VerifyEmailResponse>({
    initialValues: { email: "", code: "" },
    validate: (values) => flattenZodError(verifyEmailSchema.safeParse(values)),
    onSubmit: async (values) => {
      const response = await authService.verifyEmail(values as VerifyEmailInput);
      return response.data;
    },
    onSuccess: (data) => onSuccess?.(data.tokens),
  });
}

interface UseResendVerificationOptions {
  email: string;
  onSuccess?: () => void;
}

export function useResendVerification({ email, onSuccess }: UseResendVerificationOptions) {
  return useAuthForm({
    initialValues: { email },
    validate: (values) => flattenZodError(resendVerificationSchema.safeParse(values)),
    onSubmit: async (values) => {
      await authService.resendVerification(values.email);
    },
    onSuccess,
  });
}