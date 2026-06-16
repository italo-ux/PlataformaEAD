import { useEffect, useState } from "react";
import { faEnvelope, faLock, faUser } from "@fortawesome/free-solid-svg-icons";
import FormInput from "./FormInput";
import SmilingRobot from "../../assets/login/smilingRobot.png";
import { createUser } from "../../services/userService";
import { useAuthForm } from "../../hooks/useAuthForm";
import MockCredentialsHint from "./MockCredentialsHint";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    values,
    handleChange,
    handleSubmit,
    loading,
    errors,
    error,
    success,
  } = useAuthForm({
    initialValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
    onSubmit: async (formValues) => {
      await createUser({
        name: formValues.name,
        email: formValues.email,
        password: formValues.password,
      });
    },
    validate: (formValues) => {
      const newErrors: Record<string, string> = {};

      if (!formValues.name.trim()) newErrors.name = "Nome é obrigatório";
      if (!formValues.email.trim()) newErrors.email = "Email é obrigatório";
      if (!formValues.password) newErrors.password = "Senha é obrigatória";
      if (!formValues.confirmPassword) {
        newErrors.confirmPassword = "Confirme sua senha";
      }

      if (formValues.password && formValues.password.length < 6) {
        newErrors.password = "A senha deve ter pelo menos 6 caracteres";
      }

      if (
        formValues.password &&
        formValues.confirmPassword &&
        formValues.password !== formValues.confirmPassword
      ) {
        newErrors.confirmPassword = "As senhas não conferem";
      }

      return newErrors;
    },
  });

  useEffect(() => {
    if (!success) {
      return;
    }

    const redirectTimer = window.setTimeout(onSwitchToLogin, 900);

    return () => {
      window.clearTimeout(redirectTimer);
    };
  }, [success, onSwitchToLogin]);

  const togglePasswordVisibility = () => {
    setShowPassword((current) => !current);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword((current) => !current);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="hidden lg:flex flex-col items-center justify-center order-last lg:order-first">
            <div className="w-full max-w-md flex items-center justify-center">
              <img
                src={SmilingRobot}
                alt="Robo amigável"
                className="w-auto h-auto drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>

          <div className="flex flex-col justify-center p-8 bg-white rounded-lg shadow-lg">
            <h1 className="text-4xl lg:text-5xl font-bold text-[#333] mb-2">
              Criar Conta
            </h1>
            <p className="text-gray-500 text-lg mb-12 font-light">
              Junte-se à nossa comunidade de inovação
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

            {success && (
              <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg text-sm">
                Conta criada no mock com sucesso. Indo para o login...
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                id="name"
                name="name"
                label="Nome Completo"
                type="text"
                placeholder="Seu nome completo"
                icon={faUser}
                value={values.name}
                onChange={handleChange}
                error={errors.name}
              />

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

              <FormInput
                id="confirmPassword"
                name="confirmPassword"
                label="Confirmar Senha"
                placeholder="********"
                icon={faLock}
                value={values.confirmPassword}
                onChange={handleChange}
                isPasswordField
                showPassword={showConfirmPassword}
                onTogglePassword={toggleConfirmPasswordVisibility}
                error={errors.confirmPassword}
              />

              <button
                type="submit"
                disabled={loading || success}
                className="w-full bg-[#4B6FFF] text-white font-bold text-lg py-4 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Criando conta..." : "Registrar"}
              </button>

              <div className="text-center pt-6 border-t border-gray-200">
                <span className="text-gray-600 text-sm">
                  Já tem uma conta?{" "}
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="text-[#4B6FFF] hover:text-blue-700 font-bold transition-colors duration-200 ml-1 bg-none border-none cursor-pointer"
                  >
                    Faça login
                  </button>
                </span>
              </div>
            </form>

            <MockCredentialsHint />
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterForm;
