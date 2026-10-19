import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AdminTrailManagement from "../components/AdminTrailManagement";
import TrailPage from "../pages/TrailPage";
import courseService, { type Curso } from "../services/courseService";
import trailService, { type Trilha } from "../services/trailService";

vi.mock("../components/Navbar/Navbar", () => ({ default: () => null }));
vi.mock("../components/Footer/Footer", () => ({ default: () => null }));

const course: Curso = {
  id: "11111111-1111-4111-8111-111111111111",
  nome: "Curso real",
  descricao: "Descrição do curso",
  url_foto: null,
  carga_horaria: 10,
  categoria: "Tecnologia",
  nivel: "Iniciante",
  id_instrutor: "22222222-2222-4222-8222-222222222222",
  status: "publicado",
};

const trail: Trilha = {
  id: "33333333-3333-4333-8333-333333333333",
  nome: "Trilha real",
  descricao: "Descrição da trilha",
  capa: null,
  nivel: "Iniciante",
  cursos: [course],
};

function LocationMarker() {
  const location = useLocation();
  return <p>{location.pathname}</p>;
}

beforeEach(() => {
  const entries = new Map<string, string>();
  const storage: Storage = {
    get length() { return entries.size; },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => { entries.delete(key); },
    setItem: (key, value) => { entries.set(key, String(value)); },
  };
  vi.stubGlobal("localStorage", storage);
  localStorage.setItem("token", "jwt-test-token");
  localStorage.setItem(
    "ead.auth.user",
    JSON.stringify({
      id: "admin-1",
      name: "Administrador",
      email: "admin@example.com",
      role: "admin",
    }),
  );
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Real trail flows", () => {
  it("lets an administrator create a trail and link real courses", async () => {
    vi.spyOn(trailService, "listTrails").mockResolvedValue([]);
    vi.spyOn(courseService, "listCourses").mockResolvedValue([course]);
    const create = vi.spyOn(trailService, "createTrail").mockResolvedValue(trail);
    render(<AdminTrailManagement />);

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome da trilha"), trail.nome);
    await user.type(screen.getByLabelText("Descrição"), trail.descricao!);
    await user.click(await screen.findByLabelText(course.nome));
    await user.click(screen.getByRole("button", { name: "Criar trilha" }));

    await waitFor(() =>
      expect(create).toHaveBeenCalledWith({
        nome: trail.nome,
        descricao: trail.descricao,
        capa: undefined,
        nivel: undefined,
        courseIds: [course.id],
      }),
    );
    expect(await screen.findByText(`Trilha ${trail.nome} criada com sucesso.`)).toBeTruthy();
  });

  it("loads a trail from the API and opens its real course UUID", async () => {
    vi.spyOn(trailService, "getTrail").mockResolvedValue(trail);
    render(
      <MemoryRouter initialEntries={[`/trilhas/${trail.id}`]}>
        <Routes>
          <Route path="/trilhas/:trailId" element={<TrailPage />} />
          <Route path="*" element={<LocationMarker />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: trail.nome })).toBeTruthy();
    const user = userEvent.setup();
    await user.click(screen.getByRole("heading", { name: course.nome }));
    expect(await screen.findByText(`/courses/${course.id}`)).toBeTruthy();
  });
});
