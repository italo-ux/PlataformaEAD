import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import RegisterForm from "../components/forms/RegisterForm";

export default function RegisterPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar user={null} />
      <RegisterForm onSwitchToLogin={() => navigate("/login")} />
      <Footer />
    </>
  );
}
