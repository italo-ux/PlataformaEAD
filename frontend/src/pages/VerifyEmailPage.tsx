import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import VerifyEmailForm from "../components/forms/VerifyEmailForm";

export default function VerifyEmailPage() {
  return (
    <>
      <Navbar user={null} hideLoginLink />
      <VerifyEmailForm />
      <Footer />
    </>
  );
}