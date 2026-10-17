import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import type { User } from "../data/userMock";

const admin: User = {
  id: "admin-1",
  name: "Administrador",
  email: "admin@example.com",
  role: "admin",
};

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
      <MemoryRouter><Navbar user={admin} /></MemoryRouter>,
    );
    const items = [...container.querySelectorAll(".nav-links a")].map(
      (link) => link.textContent,
    );
    expect(items).toEqual(["HOME", "CURSOS", "FEEDBACKS", "QUEM SOMOS"]);
    expect(screen.getByRole("link", { name: "Estatísticas" }).getAttribute("href"))
      .toBe("/admin/estatisticas");
    expect(screen.queryByText("Adicionar curso")).toBeNull();
    expect(screen.queryByText("Dashboard Admin")).toBeNull();
  });
});