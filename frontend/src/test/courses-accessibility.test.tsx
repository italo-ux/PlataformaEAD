import { afterEach, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import CoursesPage from "../pages/CoursesPage";
import courseService from "../services/courseService";

vi.mock("../components/Navbar/Navbar", () => ({ default: () => null }));
vi.mock("../components/Footer/Footer", () => ({ default: () => null }));
vi.mock("../services/userService", () => ({
  getAuthenticatedUser: () => ({ id: "student", role: "aluno" }),
}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("permite abrir um curso pelo teclado e identifica a busca", async () => {
  vi.spyOn(courseService, "listCourses").mockResolvedValue([{
    id: "course-id", nome: "Curso acessível", descricao: null, url_foto: null,
    carga_horaria: 1, categoria: null, nivel: null, ambiente_teste: false,
    id_instrutor: "professor", status: "publicado",
  }]);
  render(<MemoryRouter initialEntries={["/courses"]}><Routes>
    <Route path="/courses" element={<CoursesPage />} />
    <Route path="/courses/:id" element={<p>Curso aberto</p>} />
  </Routes></MemoryRouter>);

  expect(screen.getByRole("textbox", { name: "Buscar cursos" })).toBeTruthy();
  const link = await screen.findByRole("link", { name: /Curso acessível/ });
  link.focus();
  await userEvent.setup().keyboard("{Enter}");
  expect(await screen.findByText("Curso aberto")).toBeTruthy();
});
