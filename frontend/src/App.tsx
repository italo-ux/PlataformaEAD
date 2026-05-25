import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar/navbar.tsx";
import LoginForm from "./components/forms/LoginForm.tsx";
import RegisterForm from "./components/forms/RegisterForm.tsx";
import Footer from "./components/Footer/Footer.tsx";
import CourseView from "./pages/CourseView.tsx";
import FeedbackPage from "./pages/FeedbackPage.tsx";
import UserHome from "./pages/userHome";
import AboutPage from "./pages/AboutPage.tsx";
import { mockUser } from "./data/userMock.ts";

function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <>
      <Navbar user={null} />
      {isLogin ? (
        <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
      ) : (
        <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
      )}
      <Footer />
    </>
  );
}

function App() {
  void mockUser;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<AuthPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/" element={<AuthPage />} />
        <Route path="/home" element={<UserHome />} />
        <Route path="/quem-somos" element={<AboutPage />} />
        <Route path="/course" element={<CourseView />} />
        <Route path="/courses" element={<UserHome />} />
        <Route path="/feedback" element={<FeedbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
