import { useEffect, useState } from "react";
import { faEnvelope, faLock } from "@fortawesome/free-solid-svg-icons";
import FormInput from "./FormInput";
import SmilingRobot from "../../assets/login/smilingRobot.png";
import { loginUser, saveAuthenticatedUser } from "../../services/userService";
import { useAuthForm } from "../../hooks/useAuthForm";
import MockCredentialsHint from "./MockCredentialsHint";

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSuccess?: () => void;
}

function LoginForm({ onSwitchToRegister, onSuccess }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    values,
    handleChange,
    handleSubmit,
    loading,
    errors,
    error,
    success,
  } = useAuthForm({
    initialValues: { email: "", password: "" },
    onSubmit: async (formValues) => {
      const user = await loginUser(formValues.email, formValues.password);
      saveAuthenticatedUser(user);
    },
    validate: (formValues) => {
      const newErrors: Record<string, string> = {};
      if (!formValues.email) newErrors.email = "Email e obrigatorio";
      if (!formValues.password) newErrors.password = "Senha e obrigatoria";
      return newErrors;
    },
  });

  useEffect(() => {
    if (success) {
      onSuccess?.();
    }
  }, [success, onSuccess]);

  const togglePasswordVisibility = () => {
    setShowPassword((current) => !current);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="flex flex-col justify-center p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#333] mb-2">
              Acessar a plataforma
            </h1>
            <p className="text-gray-500 text-lg mb-12 font-light">
              Bem-vindo de volta a Inovacao
            </p>

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

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                id="email"
                name="email"
                label="E-mail"
                type="email"
                placeholder="seu@email.com"
                icon={faEnvelope}
                value={values.email}
                onChange={handleChange}
                error={errors.email}
              />

              <FormInput
                id="password"
                name="password"
                label="Senha"
                placeholder="********"
                icon={faLock}
                value={values.password}
                onChange={handleChange}
                isPasswordField
                showPassword={showPassword}
                onTogglePassword={togglePasswordVisibility}
                error={errors.password}
              />

              <p className="text-right text-sm text-gray-500">
                Recuperacao de senha sera ligada ao backend real.
              </p>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4B6FFF] text-white font-bold text-lg py-4 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Continuar"}
              </button>

              <div className="text-center pt-6 border-t border-gray-200">
                <span className="text-gray-600 text-sm">
                  Nao tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToRegister}
                    className="text-[#4B6FFF] hover:text-blue-700 font-bold transition-colors duration-200 ml-1 bg-none border-none cursor-pointer"
                  >
                    Cadastre-se
                  </button>
                </span>
              </div>
            </form>

            <MockCredentialsHint />
          </div>

          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="w-full max-w-md flex items-center justify-center">
              <img
                src={SmilingRobot}
                alt="Robo amigavel"
                className="w-100 h-auto drop-shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginForm;
