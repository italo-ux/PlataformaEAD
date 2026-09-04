import { useSearchParams } from "react-router-dom";
import { faLock, faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import FormInput from "./FormInput";
import CodeInput from "./CodeInput";
import { useResetPassword } from "../../hooks/useAuthFlow";

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export default function ResetPasswordForm({
  onSuccess,
}: ResetPasswordFormProps) {
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
  } = useResetPassword({ email, onSuccess });

  const handleCodeChange = (code: string) => {
    // We need to update the code field in the form
    // Since CodeInput uses hidden input, we handle it via onChange
    const event = {
      target: { name: "code", value: code },
    } as React.ChangeEvent<HTMLInputElement>;
    handleChange(event);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#333] mb-2">
              Redefinir senha
            </h1>
            <p className="text-gray-500 text-lg font-light">
              Digite o código recebido por e-mail e sua nova senha
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
              Senha alterada com sucesso! Redirecionando para login...
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

            <FormInput
              id="password"
              name="password"
              label="Nova senha"
              type="password"
              placeholder="********"
              icon={faLock}
              value={values.password}
              onChange={handleChange}
              isPasswordField
              error={errors.password}
              disabled={loading || success}
            />

            <FormInput
              id="confirmPassword"
              name="confirmPassword"
              label="Confirmar nova senha"
              type="password"
              placeholder="********"
              icon={faLock}
              value={values.confirmPassword}
              onChange={handleChange}
              isPasswordField
              error={errors.confirmPassword}
              disabled={loading || success}
            />

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#4B6FFF] text-white font-bold text-lg py-4 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Redefinindo..." : "Redefinir senha"}
            </button>

            <div className="text-center pt-6 border-t border-gray-200">
              <span className="text-gray-600 text-sm">
                Voltou atrás?{" "}
                <a
                  href="/login"
                  className="text-[#4B6FFF] hover:text-blue-700 font-bold transition-colors duration-200 ml-1"
                >
                  Faça login
                </a>
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
