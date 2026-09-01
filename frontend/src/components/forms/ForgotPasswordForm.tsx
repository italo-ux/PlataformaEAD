import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useForgotPassword } from "../../hooks/useAuthFlow";

interface ForgotPasswordFormProps {
  onSuccess?: () => void;
}

export default function ForgotPasswordForm({ onSuccess }: ForgotPasswordFormProps) {
  const {
    values,
    handleChange,
    handleSubmit,
    loading,
    errors,
    error,
    success,
  } = useForgotPassword({ onSuccess });

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#333] mb-2">Recuperar senha</h1>
            <p className="text-gray-500 text-lg font-light">
              Digite seu e-mail para receber o código de recuperação
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
              Código enviado! Verifique sua caixa de entrada.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative">
              <label htmlFor="email" className="block text-sm font-semibold text-[#333] mb-3">
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
                  placeholder="seu@email.com"
                  value={values.email}
                  onChange={handleChange}
                  required
                  className={`w-full pl-12 pr-4 py-3 bg-white border-2 rounded-lg text-[#333] placeholder-gray-400 transition-all duration-300 focus:outline-none focus:shadow-lg hover:border-gray-300 ${
                    errors.email
                      ? "border-red-500 focus:border-red-500"
                      : "border-gray-200 focus:border-[#4B6FFF]"
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="w-full bg-[#4B6FFF] text-white font-bold text-lg py-4 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 cursor-pointer disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>

            <div className="text-center pt-6 border-t border-gray-200">
              <span className="text-gray-600 text-sm">
                Lembrou a senha?{" "}
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