import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import ForgotPasswordForm from "../components/forms/ForgotPasswordForm";
import { useNavigate } from "react-router-dom";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <>
      <Navbar user={null} hideLoginLink />
      <ForgotPasswordForm
        onSuccess={(email) =>
          navigate(`/reset-password?email=${encodeURIComponent(email)}`, {
            replace: true,
          })
        }
      />
      <Footer />
    </>
  );
}
