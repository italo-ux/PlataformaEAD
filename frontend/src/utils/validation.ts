import { z } from "zod";

export const emailSchema = z.string().email("E-mail inválido").min(1, "E-mail é obrigatório");

export const passwordSchema = z
  .string()
  .min(8, "Mínimo 8 caracteres")
  .regex(/[A-Z]/, "Pelo menos uma maiúscula")
  .regex(/[a-z]/, "Pelo menos uma minúscula")
  .regex(/[0-9]/, "Pelo menos um número")
  .regex(/[^A-Za-z0-9]/, "Pelo menos um caractere especial");

export const code6DigitsSchema = z
  .string()
  .length(6, "Código deve ter 6 dígitos")
  .regex(/^\d{6}$/, "Apenas números");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Senha é obrigatória"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

export const forgotPasswordSchema = z.object({ email: emailSchema });

export const resetPasswordSchema = z.object({
  email: emailSchema,
  code: code6DigitsSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Senhas não conferem",
  path: ["confirmPassword"],
});

export const verifyEmailSchema = z.object({
  email: emailSchema,
  code: code6DigitsSchema,
});

export const resendVerificationSchema = z.object({ email: emailSchema });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export function flattenZodError(
  result: z.ZodSafeParseResult<unknown>
): Record<string, string> {
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}