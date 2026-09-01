import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import ResetPasswordForm from "../components/forms/ResetPasswordForm";
import { useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar user={null} hideLoginLink />
      <ResetPasswordForm onSuccess={() => navigate("/login", { replace: true })} />
      <Footer />
    </>
  );
}