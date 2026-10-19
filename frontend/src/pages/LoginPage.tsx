import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import LoginForm from "../components/forms/LoginForm";
import type { User, UserRole } from "../data/userMock";

function getPostLoginPath(role: UserRole) {
  if (role === "admin") return "/perfil";
  if (role === "professor") return "/professor/cursos/novo";
  return "/home";
}

export default function LoginPage() {
  const navigate = useNavigate();

  const handleSuccess = (user: User) => {
    if (user.mustChangeEmail || user.mustChangePassword) {
      const credentials = [
        user.mustChangeEmail ? "o e-mail" : "",
        user.mustChangePassword ? "a senha" : "",
      ].filter(Boolean);
      window.alert(
        `Este é um acesso inicial. Troque ${credentials.join(" e ")} no seu perfil.`,
      );
      navigate("/perfil");
      return;
    }

    navigate(getPostLoginPath(user.role));
  };

  return (
    <>
      <Navbar user={null} hideLoginLink />
      <LoginForm
        onSwitchToRegister={() => navigate("/register")}
        onSuccess={handleSuccess}
      />
      <Footer />
    </>
  );
}
