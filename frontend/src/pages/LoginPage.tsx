import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import LoginForm from "../components/forms/LoginForm";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar user={null} />
      <LoginForm
        onSwitchToRegister={() => navigate("/register")}
        onSuccess={() => navigate("/home")}
      />
      <Footer />
    </>
  );
}
