import { useSearchParams, useNavigate } from "react-router-dom";
import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import CodeInput from "./CodeInput";
import { useVerifyEmail, useResendVerification } from "../../hooks/useAuthFlow";

interface VerifyEmailFormProps {
  onSuccess?: () => void;
}

export default function VerifyEmailForm({ onSuccess }: VerifyEmailFormProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";

  const {
    values,
    handleChange,
    handleSubmit,
    loading,
    errors,
    error,
    success,
  } = useVerifyEmail({
    email,
    onSuccess: () => {
      onSuccess?.();
      navigate("/login", { replace: true });
    },
  });

  const {
    handleSubmit: handleResendSubmit,
    loading: resendLoading,
    success: resendSuccess,
    error: resendError,
    errors: resendErrors,
  } =
    useResendVerification({
      email,
    });

  const handleCodeChange = (code: string) => {
    const event = {
      target: { name: "code", value: code },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(event);
  };

  const handleResendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleResendSubmit(e);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#333] mb-2">
              Verificar e-mail
            </h1>
            <p className="text-gray-500 text-lg font-light">
              Digite o código de 6 dígitos enviado para seu e-mail
            </p>
          </div>

          {(error || Object.keys(errors).length > 0) && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
              <ul>
                {error && <li>{error}</li>}
                {Object.entries(errors).map(([key, fieldError]) => (
                  <li key={key}>{fieldError}</li>
                ))}
              </ul>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg text-sm">
              E-mail verificado com sucesso! Redirecionando...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-[#333] mb-3"
              >
                E-mail
              </label>
              <div className="relative flex items-center">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="absolute left-4 text-gray-400 text-lg"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  readOnly
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-lg text-[#333] cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#333] mb-3">
                Código de verificação (6 dígitos)
              </label>
              <CodeInput
                name="code"
                value={values.code}
                onChange={handleCodeChange}
                error={errors.code}
                disabled={loading || success}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#4B6FFF] text-white font-bold text-lg py-4 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Verificar e-mail"}
            </button>
          </form>

          <form onSubmit={handleResendCode} className="mt-4">
            {resendSuccess && (
              <p role="status" className="mb-3 text-sm text-green-700">
                Se a conta estiver pendente, um novo código será enviado.
              </p>
            )}
            {(resendError || Object.keys(resendErrors).length > 0) && (
              <p role="alert" className="mb-3 text-sm text-red-700">
                {resendError || Object.values(resendErrors).join(" ")}
              </p>
            )}
            <button
              type="submit"
              disabled={resendLoading || success}
              className="w-full text-[#4B6FFF] hover:text-blue-700 font-bold text-sm transition-colors duration-200 bg-none border-none cursor-pointer disabled:opacity-50"
            >
              {resendLoading ? "Reenviando..." : "Não recebeu? Reenviar código"}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-200 pt-6">
            <span className="text-gray-600 text-sm">
              Já tem conta?{" "}
              <a
                href="/login"
                className="text-[#4B6FFF] hover:text-blue-700 font-bold transition-colors duration-200 ml-1"
              >
                Faça login
              </a>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
