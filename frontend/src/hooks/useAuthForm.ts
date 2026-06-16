import { useCallback, useState } from "react";

interface UseAuthFormOptions {
  initialValues: Record<string, string>;
  onSubmit: (values: Record<string, string>) => Promise<void>;
  validate?: (values: Record<string, string>) => Record<string, string>;
}

interface UseAuthFormReturn {
  values: Record<string, string>;
  errors: Record<string, string>;
  loading: boolean;
  success: boolean;
  error: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  setError: (error: string) => void;
  setSuccess: (success: boolean) => void;
  resetForm: () => void;
}

export function useAuthForm({
  initialValues,
  onSubmit,
  validate,
}: UseAuthFormOptions): UseAuthFormReturn {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [generalError, setGeneralError] = useState("");

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    setGeneralError("");
    setErrors((prev) => {
      if (!(name in prev)) {
        return prev;
      }

      const nextErrors = { ...prev };
      delete nextErrors[name];
      return nextErrors;
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setGeneralError("");
      setSuccess(false);

      if (validate) {
        const validationErrors = validate(values);
        if (Object.keys(validationErrors).length > 0) {
          setErrors(validationErrors);
          return;
        }
      }

      setErrors({});
      setLoading(true);
      try {
        await onSubmit(values);
        setSuccess(true);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Erro ao processar formulário";
        setGeneralError(errorMessage);
      } finally {
        setLoading(false);
      }
    },
    [values, validate, onSubmit],
  );

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setGeneralError("");
    setSuccess(false);
  }, [initialValues]);

  return {
    values,
    errors,
    loading,
    success,
    error: generalError,
    handleChange,
    handleSubmit,
    setError: setGeneralError,
    setSuccess,
    resetForm,
  };
}
