import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CourseView from "./pages/CourseView";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import UserHome from "./pages/userHome";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<UserHome />} />
        <Route path="/courses" element={<UserHome />} />
        <Route path="/courses/:courseId" element={<CourseView />} />
        <Route path="/course" element={<Navigate to="/courses/1" replace />} />
        <Route path="/course/:courseId" element={<CourseView />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
