import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterForm from "../components/forms/RegisterForm";
import VerifyEmailForm from "../components/forms/VerifyEmailForm";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ProfilePage from "../pages/ProfilePage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { api } from "../services/api";
import { loginUser, saveAuthenticatedUser } from "../services/userService";
import courseService from "../services/courseService";
import type { User, UserRole } from "../data/userMock";
import type { InternalAxiosRequestConfig } from "axios";

vi.mock("../components/Navbar/Navbar", () => ({ default: () => null }));
vi.mock("../components/Footer/Footer", () => ({ default: () => null }));
vi.mock("../components/AdminDashboard", () => ({ default: () => null }));

const account: User = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test User", email: "user@example.com", role: "aluno",
};
const originalAdapter = api.defaults.adapter;
const httpAdapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
  config, data: { message: "Operação concluída." }, status: 201, statusText: "Created", headers: {},
}));

function LocationMarker() {
  const location = useLocation();
  return <p>{location.pathname + location.search}</p>;
}

beforeEach(() => {
  // Node's experimental global storage can shadow jsdom's implementation.
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
  vi.stubGlobal("fetch", vi.fn());
  httpAdapter.mockClear();
  api.defaults.adapter = httpAdapter;
});
afterEach(() => {
  cleanup();
  api.defaults.adapter = originalAdapter;
  vi.unstubAllGlobals();
});

function respond(body: unknown) {
  vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify(body), {
    status: 200, headers: { "Content-Type": "application/json" },
  }));
}

describe("Login and route permissions", () => {
  it.each([
    ["aluno", "/home"], ["professor", "/professor/cursos/novo"], ["admin", "/perfil"],
  ] as [UserRole, string][])("routes %s after a real API login", async (role, destination) => {
    respond({ access_token: "jwt-test-token", user: { ...account, role } });
    render(<MemoryRouter initialEntries={["/login"]}><Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<LocationMarker />} />
    </Routes></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-mail"), account.email);
    await user.type(screen.getByLabelText("Senha"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Continuar" }));
    expect(await screen.findByText(destination)).toBeTruthy();
    expect(localStorage.getItem("token")).toBe("jwt-test-token");
    expect(JSON.parse(localStorage.getItem("ead.auth.user")!)).toMatchObject({ id: account.id, role });
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toEqual({
      email: account.email, password: "Password1!",
    });
  });

  it("does not accept a login response missing its persisted role", async () => {
    respond({ access_token: "token", user: { id: account.id, email: account.email } });
    await expect(loginUser(account.email, "Password1!")).rejects.toThrow("Resposta de autenticacao invalida");
    expect(localStorage.getItem("token")).toBeNull();
  });

  it.each([
    [null, false, "/login"], ["professor", false, "/login"], ["aluno", true, "/home"],
    ["professor", true, "Protected content"], ["admin", true, "Protected content"],
  ] as [UserRole | null, boolean, string][])("guards role=%s token=%s", async (role, token, expected) => {
    if (role) saveAuthenticatedUser({ ...account, role });
    if (token) localStorage.setItem("token", "jwt-test-token");
    render(<MemoryRouter initialEntries={["/protected"]}><Routes>
      <Route element={<ProtectedRoute allowedRoles={["professor", "admin"]} />}>
        <Route path="/protected" element={<p>Protected content</p>} />
      </Route>
      <Route path="*" element={<LocationMarker />} />
    </Routes></MemoryRouter>);
    expect(await screen.findByText(expected)).toBeTruthy();
  });

  it("uses the same token for Axios and course requests with UUID paths", async () => {
    localStorage.setItem("token", "jwt-test-token");
    await api.post("/auth/resend-verification", { email: account.email });
    expect(httpAdapter.mock.calls[0][0].headers.Authorization).toBe("Bearer jwt-test-token");
    respond({ id: account.id });
    await courseService.updateCourse(String(account.id), { nome: "Updated course" });
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining("/cursos/" + account.id), expect.objectContaining({
      method: "PATCH", headers: expect.objectContaining({ Authorization: "Bearer jwt-test-token" }),
    }));
  });
});

describe("Registration and recovery navigation", () => {
  it("keeps institutional metadata local and navigates to verification without tokens", async () => {
    respond({ id: account.id, email: account.email });
    render(<MemoryRouter initialEntries={["/register"]}><Routes>
      <Route path="/register" element={<RegisterForm onSwitchToLogin={() => undefined} />} />
      <Route path="*" element={<LocationMarker />} />
    </Routes></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome Completo"), account.name);
    await user.type(screen.getByLabelText("E-mail"), account.email);
    await user.type(screen.getByLabelText("CPF"), "123.456.789-01");
    await user.click(screen.getByLabelText("Estagiário"));
    await user.type(screen.getByLabelText("Comprovação institucional"), "institution@example.com");
    await user.type(screen.getByLabelText("Senha"), "Password1!");
    await user.type(screen.getByLabelText("Confirmar Senha"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Registrar" }));
    expect(await screen.findByText("/verify-email?email=user%40example.com")).toBeTruthy();
    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string)).toEqual({
      name: account.name, email: account.email, password: "Password1!", cpf: "12345678901",
    });
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("ead.auth.user")).toBeNull();
    expect(JSON.parse(localStorage.getItem("ead.profile.metadata")!)[String(account.id)]).toBe("estagiario");
  });

  it("reads email from the URL, resends and verifies through /auth/verify", async () => {
    const { container } = render(<MemoryRouter initialEntries={["/verify-email?email=user%40example.com"]}><Routes>
      <Route path="/verify-email" element={<VerifyEmailForm />} />
      <Route path="*" element={<LocationMarker />} />
    </Routes></MemoryRouter>);
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).value).toBe(account.email);
    expect(container.querySelectorAll("form form").length).toBe(0);
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /Reenviar código/ }));
    await screen.findByRole("status");
    expect(httpAdapter.mock.calls[0][0].url).toBe("/auth/resend-verification");
    await user.click(screen.getByLabelText("Dígito 1 do código"));
    await user.paste("123456");
    await user.click(screen.getByRole("button", { name: "Verificar e-mail" }));
    expect(await screen.findByText("/login")).toBeTruthy();
    expect(httpAdapter.mock.calls.at(-1)![0].url).toBe("/auth/verify");
    expect(JSON.parse(httpAdapter.mock.calls.at(-1)![0].data)).toEqual({ email: account.email, code: "123456" });
  });

  it("passes email from forgot-password to reset-password", async () => {
    render(<MemoryRouter initialEntries={["/forgot-password"]}><Routes>
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="*" element={<LocationMarker />} />
    </Routes></MemoryRouter>);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-mail"), account.email);
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(await screen.findByText("/reset-password?email=user%40example.com")).toBeTruthy();
    expect(httpAdapter.mock.calls[0][0].url).toBe("/auth/forgot-password");
  });

  it("submits email, code and password then returns to login", async () => {
    render(<MemoryRouter initialEntries={["/reset-password?email=user%40example.com"]}><Routes>
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="*" element={<LocationMarker />} />
    </Routes></MemoryRouter>);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Dígito 1 do código"));
    await user.paste("123456");
    await user.type(screen.getByLabelText("Nova senha"), "NewPassword2!");
    await user.type(screen.getByLabelText("Confirmar nova senha"), "NewPassword2!");
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));
    expect(await screen.findByText("/login")).toBeTruthy();
    expect(JSON.parse(httpAdapter.mock.calls[0][0].data)).toEqual({
      email: account.email, code: "123456", password: "NewPassword2!",
    });
  });

  it("labels profile removal as browser-only and clears only the local session", async () => {
    saveAuthenticatedUser(account);
    localStorage.setItem("token", "jwt-test-token");
    render(<MemoryRouter initialEntries={["/perfil"]}><Routes>
      <Route path="/perfil" element={<ProfilePage />} />
      <Route path="*" element={<LocationMarker />} />
    </Routes></MemoryRouter>);
    expect(screen.getByText(/Sua conta continua no servidor/)).toBeTruthy();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Remover perfil local" }));
    await user.click(screen.getByRole("button", { name: "Sim, continuar" }));
    await user.click(screen.getByRole("button", { name: "Remover dados locais e sair" }));
    await waitFor(() => expect(localStorage.getItem("token")).toBeNull());
    expect(await screen.findByText("/login")).toBeTruthy();
    expect(fetch).not.toHaveBeenCalled();
  });
});
