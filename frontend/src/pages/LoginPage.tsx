import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import LoginForm from "../components/forms/LoginForm";
import type { UserRole } from "../data/userMock";

function getPostLoginPath(role: UserRole) {
  if (role === "admin") return "/perfil";
  if (role === "professor") return "/professor/cursos/novo";
  return "/home";
}

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar user={null} hideLoginLink />
      <LoginForm
        onSwitchToRegister={() => navigate("/register")}
        onSuccess={(user) => navigate(getPostLoginPath(user.role))}
      />
      <Footer />
    </>
  );
}
