import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AboutPage from "./pages/AboutPage";
import CoursesPage from "./pages/CoursesPage";
import CourseView from "./pages/CourseView";
import FeedbackPage from "./pages/FeedbackPage";
import DashboardAluno from "./pages/DashboardAluno";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ProfessorCourseCreatePage from "./pages/ProfessorCourseCreatePage";
import RegisterPage from "./pages/RegisterPage";
import TrailPage from "./pages/TrailPage";
import UserHome from "./pages/userHome";
import { ProtectedRoute } from "./components/ProtectedRoute";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import AdminStatsPage from "./pages/AdminStatsPage";
import { AuthProvider } from "./context/AuthContext";
import CertificateValidationPage from "./pages/CertificateValidationPage";
import CertificateTemplatesPage from "./pages/CertificateTemplatesPage";

function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/quem-somos" element={<AboutPage />} />
        <Route
          path="/certificados/validar/:codigo"
          element={<CertificateValidationPage />}
        />
        <Route
          element={
            <ProtectedRoute allowedRoles={["aluno", "professor", "admin"]} />
          }
        >
          <Route path="/home" element={<UserHome />} />
          <Route path="/dashboard" element={<DashboardAluno />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CourseView />} />
          <Route path="/trilhas/:trailId" element={<TrailPage />} />
          <Route path="/course" element={<Navigate to="/courses" replace />} />
          <Route path="/course/:courseId" element={<CourseView />} />
          <Route path="/feedback" element={<FeedbackPage />} />
        </Route>
        <Route
          element={<ProtectedRoute allowedRoles={["professor", "admin"]} />}
        >
          <Route
            path="/professor/cursos/novo"
            element={<ProfessorCourseCreatePage />}
          />
          <Route
            path="/courses/:courseId/editar"
            element={<ProfessorCourseCreatePage />}
          />
        </Route>
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="/admin/estatisticas" element={<AdminStatsPage />} />
          <Route path="/certificados" element={<CertificateTemplatesPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
