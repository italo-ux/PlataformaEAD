import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import AdminStatsPage from "../pages/AdminStatsPage";
import type { User } from "../data/userMock";
import { AuthProvider } from "../context/AuthContext";
import journeyService from "../services/journeyService";
import courseService from "../services/courseService";

const admin: User = {
  id: "admin-1",
  name: "Administrador",
  email: "admin@example.com",
  role: "admin",
};

const professor: User = {
  id: "professor-1",
  name: "Professor",
  email: "professor@example.com",
  role: "professor",
};

beforeEach(() => {
  const entries = new Map<string, string>();
  const storage: Storage = {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key) => entries.get(key) ?? null,
    key: (index) => [...entries.keys()][index] ?? null,
    removeItem: (key) => {
      entries.delete(key);
    },
    setItem: (key, value) => {
      entries.set(key, String(value));
    },
  };
  vi.stubGlobal("localStorage", storage);
  localStorage.setItem("ead.auth.user", JSON.stringify(admin));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("Administrator navigation", () => {
  it("orders the navigation and shows Estatísticas beside the admin profile", () => {
    const { container } = render(
      <MemoryRouter>
        <Navbar user={admin} />
      </MemoryRouter>,
    );
    const items = [...container.querySelectorAll(".nav-links a")].map(
      (link) => link.textContent,
    );
    expect(items).toEqual([
      "HOME",
      "CURSOS",
      "Adicionar curso",
      "FEEDBACKS",
      "QUEM SOMOS",
    ]);
    expect(
      screen.getByRole("link", { name: "Estatísticas" }).getAttribute("href"),
    ).toBe("/admin/estatisticas");
    expect(screen.getByText("Adicionar curso")).toBeTruthy();
  });

  it("shows real journey metrics on the statistics page", async () => {
    vi.spyOn(journeyService, "metrics").mockResolvedValue({
      matriculas_iniciadas: 12,
      aulas_concluidas: 40,
      cursos_concluidos: 5,
      certificados_emitidos: 5,
    });
    render(
      <AuthProvider>
        <MemoryRouter>
          <AdminStatsPage />
        </MemoryRouter>
      </AuthProvider>,
    );
    expect(
      screen.getByRole("heading", { name: "Jornada do aluno" }),
    ).toBeTruthy();
    expect(await screen.findByText("12")).toBeTruthy();
    expect(screen.getByText("Certificados emitidos")).toBeTruthy();
  });

  it("shows the Rascunhos submenu only to professors", async () => {
    vi.spyOn(courseService, "listCourses").mockResolvedValue([]);
    const { rerender } = render(
      <MemoryRouter>
        <Navbar user={professor} />
      </MemoryRouter>,
    );
    expect(screen.getByRole("link", { name: "Rascunhos" }).getAttribute("href")).toBe(
      "/courses?filtro=rascunhos",
    );

    rerender(
      <MemoryRouter>
        <Navbar user={admin} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("link", { name: "Rascunhos" })).toBeNull();
  });
});
