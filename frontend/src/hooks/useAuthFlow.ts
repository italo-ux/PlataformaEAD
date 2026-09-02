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
import type { AuthMessageResponse } from "../types/auth";

interface UseForgotPasswordOptions {
  onSuccess?: (email: string) => void;
}

export function useForgotPassword({
  onSuccess,
}: UseForgotPasswordOptions = {}) {
  return useAuthForm<string>({
    initialValues: { email: "" },
    validate: (values) =>
      flattenZodError(forgotPasswordSchema.safeParse(values)),
    onSubmit: async (values) => {
      await authService.forgotPassword(values.email);
      return values.email;
    },
    onSuccess,
  });
}

interface UseResetPasswordOptions {
  email: string;
  onSuccess?: () => void;
}

export function useResetPassword({
  email,
  onSuccess,
}: UseResetPasswordOptions) {
  return useAuthForm({
    initialValues: { email, code: "", password: "", confirmPassword: "" },
    validate: (values) =>
      flattenZodError(resetPasswordSchema.safeParse(values)),
    onSubmit: async (values) => {
      const resetData = values as ResetPasswordInput;
      await authService.resetPassword({
        email: resetData.email,
        code: resetData.code,
        password: resetData.password,
      });
    },
    onSuccess,
  });
}

interface UseVerifyEmailOptions {
  email: string;
  onSuccess?: () => void;
}

export function useVerifyEmail({ email, onSuccess }: UseVerifyEmailOptions) {
  return useAuthForm<AuthMessageResponse>({
    initialValues: { email, code: "" },
    validate: (values) => flattenZodError(verifyEmailSchema.safeParse(values)),
    onSubmit: async (values) => {
      const response = await authService.verifyEmail(
        values as VerifyEmailInput,
      );
      return response.data;
    },
    onSuccess,
  });
}

interface UseResendVerificationOptions {
  email: string;
  onSuccess?: () => void;
}

export function useResendVerification({
  email,
  onSuccess,
}: UseResendVerificationOptions) {
  return useAuthForm({
    initialValues: { email },
    validate: (values) =>
      flattenZodError(resendVerificationSchema.safeParse(values)),
    onSubmit: async (values) => {
      await authService.resendVerification(values.email);
    },
    onSuccess,
  });
}
