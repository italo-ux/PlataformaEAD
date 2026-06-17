import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AboutPage from "./pages/AboutPage";
import CourseView from "./pages/CourseView";
import FeedbackPage from "./pages/FeedbackPage";
import DashboardAluno from "./pages/DashboardAluno";
import LoginPage from "./pages/LoginPage";
import ProfilePage from "./pages/ProfilePage";
import ProfessorCourseCreatePage from "./pages/ProfessorCourseCreatePage";
import RegisterPage from "./pages/RegisterPage";
import TrailPage from "./pages/TrailPage";
import UserHome from "./pages/userHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/home" element={<UserHome />} />
        <Route path="/dashboard" element={<DashboardAluno />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/courses" element={<UserHome />} />
        <Route path="/courses/:courseId" element={<CourseView />} />
        <Route path="/trilhas/:trailSlug" element={<TrailPage />} />
        <Route
          path="/professor/cursos/novo"
          element={<ProfessorCourseCreatePage />}
        />
        <Route path="/course" element={<Navigate to="/courses/1" replace />} />
        <Route path="/course/:courseId" element={<CourseView />} />
        <Route path="/quem-somos" element={<AboutPage />} />
        <Route path="/feedback" element={<FeedbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
