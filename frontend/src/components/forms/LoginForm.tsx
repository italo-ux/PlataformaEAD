import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEnvelope,
  faLock,
  faEye,
  faEyeSlash,
} from "@fortawesome/free-solid-svg-icons";
import SmilingRobot from "../../assets/login/smilingRobot.png";
import { loginUser } from "../../services/userService";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await loginUser({ email, password });
      console.log("Login bem-sucedido:", response);
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center px-4 py-8">
      {/* Container centralizado */}
      <div className="w-full max-w-6xl">
        {/* Grid responsivo: 2 colunas em desktop, 1 em mobile */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* COLUNA ESQUERDA - FORMULÁRIO */}
          <div className="flex flex-col justify-center p-8 bg-white rounded-lg shadow-lg">
            {/* Título */}
            <h1 className="text-4xl lg:text-5xl font-bold text-[#333] mb-2">
              Acessar a plataforma
            </h1>
            <p className="text-gray-500 text-lg mb-12 font-light">
              Bem-vindo de volta à Inovação
            </p>

            {/* Mensagens de Erro */}
            {error && (
              <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Formulário */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campo de Email */}
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
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-gray-200 rounded-lg text-[#333] placeholder-gray-400 transition-all duration-300 focus:outline-none focus:border-[#4B6FFF] focus:shadow-lg hover:border-gray-300"
                  />
                </div>
              </div>

              {/* Campo de Senha */}
              <div className="relative">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-[#333] mb-3"
                >
                  Senha
                </label>
                <div className="relative flex items-center">
                  <FontAwesomeIcon
                    icon={faLock}
                    className="absolute left-4 text-gray-400 text-lg"
                  />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-12 pr-12 py-3 bg-white border-2 border-gray-200 rounded-lg text-[#333] placeholder-gray-400 transition-all duration-300 focus:outline-none focus:border-[#4B6FFF] focus:shadow-lg hover:border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-4 text-gray-400 hover:text-[#4B6FFF] transition-colors duration-200"
                    aria-label="Toggle password visibility"
                  >
                    <FontAwesomeIcon
                      icon={showPassword ? faEyeSlash : faEye}
                      className="text-lg"
                    />
                  </button>
                </div>
              </div>

              {/* Link Esqueci Senha */}
              <div className="flex justify-end">
                <a
                  href="#"
                  className="text-sm text-[#4B6FFF] hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  Esqueci minha senha
                </a>
              </div>

              {/* Botão Continuar */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#4B6FFF] text-white font-bold text-lg py-4 rounded-lg transition-all duration-300 hover:bg-blue-700 hover:shadow-xl transform hover:-translate-y-1 active:translate-y-0 cursor-pointer disabled:opacity-50"
              >
                {loading ? "Entrando..." : "Continuar"}
              </button>

              {/* Texto Cadastro */}
              <div className="text-center pt-6 border-t border-gray-200">
                <span className="text-gray-600 text-sm">
                  Não tem uma conta?{" "}
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
          </div>

          {/* COLUNA DIREITA - IMAGEM */}
          <div className="hidden lg:flex flex-col items-center justify-center">
            <div className="w-full max-w-md flex items-center justify-center">
              <img
                src={SmilingRobot}
                alt="Robô amigável"
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
