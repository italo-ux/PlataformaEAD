import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import RegisterForm from "../components/forms/RegisterForm";
import VerifyEmailForm from "../components/forms/VerifyEmailForm";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ProfilePage from "../pages/ProfilePage";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { api, apiFetch } from "../services/api";
import { loginUser, saveAuthenticatedUser } from "../services/userService";
import courseService from "../services/courseService";
import type { User, UserRole } from "../data/userMock";
import type { InternalAxiosRequestConfig } from "axios";
import App from "../App";
import { AuthProvider } from "../context/AuthContext";

vi.mock("../components/Navbar/Navbar", () => ({ default: () => null }));
vi.mock("../components/Footer/Footer", () => ({ default: () => null }));
vi.mock("../components/AdminTrailManagement", () => ({ default: () => null }));

const account: User = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Test User",
  email: "user@example.com",
  role: "aluno",
};
const originalAdapter = api.defaults.adapter;
const httpAdapter = vi.fn(async (config: InternalAxiosRequestConfig) => ({
  config,
  data: { message: "Operação concluída." },
  status: 201,
  statusText: "Created",
  headers: {},
}));

function LocationMarker() {
  const location = useLocation();
  return <p>{location.pathname + location.search}</p>;
}

beforeEach(() => {
  // Node's experimental global storage can shadow jsdom's implementation.
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
  vi.mocked(fetch).mockImplementation(
    async () => new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

function respondSequence(...bodies: unknown[]) {
  for (const body of bodies) {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
  }
}

describe("Login and route permissions", () => {
  it.each([
    "/home",
    "/dashboard",
    "/perfil",
    "/courses",
    "/courses/11111111-1111-4111-8111-111111111111",
    "/trilhas/tecnologia",
    "/course/11111111-1111-4111-8111-111111111111",
    "/feedback",
    "/admin/estatisticas",
  ])("redirects unauthenticated access to %s", async (path) => {
    window.history.pushState({}, "", path);
    render(<App />);

    expect(
      await screen.findByRole("heading", { name: "Acessar a plataforma" }),
    ).toBeTruthy();
    expect(window.location.pathname).toBe("/login");
  });

  it.each([
    ["aluno", "/home"],
    ["professor", "/professor/cursos/novo"],
    ["admin", "/perfil"],
  ] as [UserRole, string][])(
    "routes %s after a real API login",
    async (role, destination) => {
      respond({ access_token: "jwt-test-token", user: { ...account, role } });
      render(
        <MemoryRouter initialEntries={["/login"]}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<LocationMarker />} />
          </Routes>
        </MemoryRouter>,
      );
      const user = userEvent.setup();
      await user.type(screen.getByLabelText("E-mail"), account.email);
      await user.type(screen.getByLabelText("Senha"), "Password1!");
      await user.click(screen.getByRole("button", { name: "Continuar" }));
      expect(await screen.findByText(destination)).toBeTruthy();
      expect(localStorage.getItem("token")).toBe("jwt-test-token");
      expect(JSON.parse(localStorage.getItem("ead.auth.user")!)).toMatchObject({
        id: account.id,
        role,
      });
      expect(
        JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string),
      ).toEqual({
        email: account.email,
        password: "Password1!",
      });
    },
  );

  it("alerts and opens the profile when initial credentials must be changed", async () => {
    const alert = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    respond({
      access_token: "jwt-test-token",
      user: {
        ...account,
        role: "admin",
        mustChangeEmail: true,
        mustChangePassword: true,
      },
    });
    render(
      <MemoryRouter initialEntries={["/login"]}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<LocationMarker />} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-mail"), account.email);
    await user.type(screen.getByLabelText("Senha"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Continuar" }));

    expect(await screen.findByText("/perfil")).toBeTruthy();
    expect(alert).toHaveBeenCalledWith(
      "Este é um acesso inicial. Troque o e-mail e a senha no seu perfil.",
    );
  });

  it("does not accept a login response missing its persisted role", async () => {
    respond({
      access_token: "token",
      user: { id: account.id, email: account.email },
    });
    await expect(loginUser(account.email, "Password1!")).rejects.toThrow(
      "Resposta de autenticacao invalida",
    );
    expect(localStorage.getItem("token")).toBeNull();
  });

  it.each([
    [null, false, "/login"],
    ["professor", false, "/login"],
    ["aluno", true, "/home"],
    ["professor", true, "Protected content"],
    ["admin", true, "Protected content"],
  ] as [UserRole | null, boolean, string][])(
    "guards role=%s token=%s",
    async (role, token, expected) => {
      if (role) saveAuthenticatedUser({ ...account, role });
      if (token) localStorage.setItem("token", "jwt-test-token");
      if (token && role) respond({ ...account, role });
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/protected"]}>
            <Routes>
              <Route
                element={<ProtectedRoute allowedRoles={["professor", "admin"]} />}
              >
                <Route path="/protected" element={<p>Protected content</p>} />
              </Route>
              <Route path="*" element={<LocationMarker />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>,
      );
      expect(await screen.findByText(expected)).toBeTruthy();
    },
  );

  it("uses the same token for Axios and course requests with UUID paths", async () => {
    localStorage.setItem("token", "jwt-test-token");
    await api.post("/auth/resend-verification", { email: account.email });
    expect(httpAdapter.mock.calls[0][0].headers.Authorization).toBe(
      "Bearer jwt-test-token",
    );

    respond([]);
    await courseService.listCourses();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/cursos"),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-test-token",
        }),
      }),
    );

    respond({ id: account.id });
    await courseService.updateCourse(String(account.id), {
      nome: "Updated course",
    });
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining("/cursos/" + account.id),
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-test-token",
        }),
      }),
    );
  });

  it("clears the local session when the API rejects an expired token", async () => {
    saveAuthenticatedUser(account);
    localStorage.setItem("token", "expired-token");
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await apiFetch("/cursos");

    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("ead.auth.user")).toBeNull();
  });

  it.each([
    ["aluno", "/home"],
    ["professor", "/home"],
    ["admin", "Painel do adm"],
  ] as [UserRole, string][])(
    "protects the statistics page from %s",
    async (role, expected) => {
      saveAuthenticatedUser({ ...account, role });
      localStorage.setItem("token", "jwt-test-token");
      respond({ ...account, role });
      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/admin/estatisticas"]}>
            <Routes>
              <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
                <Route
                  path="/admin/estatisticas"
                  element={<p>Painel do adm</p>}
                />
              </Route>
              <Route path="*" element={<LocationMarker />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>,
      );
      expect(await screen.findByText(expected)).toBeTruthy();
    },
  );
});

describe("Persistent profile and administrative users", () => {
  const completeAccount: User = {
    ...account,
    cpf: "12345678901",
    phone: "11999999999",
  };

  it("never persists CPF or phone in the browser session", () => {
    saveAuthenticatedUser(completeAccount);
    const persisted = JSON.parse(localStorage.getItem("ead.auth.user")!);
    expect(persisted).not.toHaveProperty("cpf");
    expect(persisted).not.toHaveProperty("phone");
  });

  it("persists profile edits through the authenticated API", async () => {
    saveAuthenticatedUser(completeAccount);
    localStorage.setItem("token", "jwt-test-token");
    respondSequence(
      completeAccount,
      {
        ...completeAccount,
        name: "Updated User",
        email: "updated@example.com",
        mustChangeEmail: false,
      },
    );
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/perfil"]}>
          <Routes>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["aluno", "professor", "admin"]}
                />
              }
            >
              <Route path="/perfil" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<LocationMarker />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Editar perfil" }),
    );
    await user.clear(screen.getByLabelText("Nome"));
    await user.type(screen.getByLabelText("Nome"), "Updated");
    await user.clear(screen.getByLabelText("E-mail"));
    await user.type(screen.getByLabelText("E-mail"), "updated@example.com");
    await user.click(screen.getByRole("button", { name: "Salvar edições" }));

    expect(
      await screen.findByText("Perfil atualizado com sucesso."),
    ).toBeTruthy();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/usuarios/me"),
      expect.objectContaining({
        method: "PATCH",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-test-token",
        }),
      }),
    );
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string),
    ).toMatchObject({
      name: "Updated User",
      email: "updated@example.com",
      cpf: completeAccount.cpf,
      phone: completeAccount.phone,
    });
    expect(JSON.parse(localStorage.getItem("ead.auth.user")!)).toMatchObject({
      name: "Updated User",
      email: "updated@example.com",
      mustChangeEmail: false,
    });
  });

  it("persists a secure password change", async () => {
    saveAuthenticatedUser({ ...completeAccount, mustChangePassword: true });
    localStorage.setItem("token", "jwt-test-token");
    respondSequence(
      { ...completeAccount, mustChangePassword: true },
      { ...completeAccount, mustChangePassword: false },
    );
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/perfil"]}>
          <Routes>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["aluno", "professor", "admin"]}
                />
              }
            >
              <Route path="/perfil" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<LocationMarker />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole("button", { name: "Alterar senha" }),
    );
    await user.type(screen.getByLabelText("Senha atual"), "Password1!");
    await user.type(screen.getByLabelText("Nova senha"), "NewPassword2!");
    await user.type(
      screen.getByLabelText("Confirmar nova senha"),
      "NewPassword2!",
    );
    await user.click(screen.getByRole("button", { name: "Salvar senha" }));

    expect(await screen.findByText("Senha alterada com sucesso.")).toBeTruthy();
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string),
    ).toEqual({
      currentPassword: "Password1!",
      newPassword: "NewPassword2!",
    });
    expect(JSON.parse(localStorage.getItem("ead.auth.user")!)).toMatchObject({
      mustChangePassword: false,
    });
  });

  it("lets an administrator register professors with a temporary password", async () => {
    saveAuthenticatedUser({ ...completeAccount, role: "admin" });
    localStorage.setItem("token", "jwt-test-token");
    respondSequence(
      { ...completeAccount, role: "admin" },
      {
        id: "managed-user",
        name: "Professor Novo",
        email: "professor@example.com",
        role: "professor",
        is_verified: true,
      },
    );
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/perfil"]}>
          <Routes>
            <Route
              element={
                <ProtectedRoute
                  allowedRoles={["aluno", "professor", "admin"]}
                />
              }
            >
              <Route path="/perfil" element={<ProfilePage />} />
            </Route>
            <Route path="*" element={<LocationMarker />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );
    const user = userEvent.setup();
    expect(screen.queryByLabelText("Nome completo")).toBeNull();
    await user.click(
      await screen.findByRole("button", { name: /Cadastrar equipe/ }),
    );
    await user.type(
      await screen.findByLabelText("Nome completo"),
      "Professor Novo",
    );
    await user.type(screen.getByLabelText("E-mail"), "professor@example.com");
    await user.type(screen.getByLabelText("CPF"), "123.456.789-01");
    await user.type(screen.getByLabelText(/^Senha temporária/), "Temporary3!");
    await user.click(screen.getByRole("button", { name: "Cadastrar usuário" }));

    expect(
      await screen.findByText(
        "Professor professor@example.com criado com sucesso.",
      ),
    ).toBeTruthy();
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[1][1]!.body as string),
    ).toEqual({
      name: "Professor Novo",
      email: "professor@example.com",
      cpf: "12345678901",
      password: "Temporary3!",
      role: "professor",
    });
  });
});

describe("Registration and recovery navigation", () => {
  it("keeps institutional metadata local and navigates to verification without tokens", async () => {
    respond({ id: account.id, email: account.email });
    render(
      <MemoryRouter initialEntries={["/register"]}>
        <Routes>
          <Route
            path="/register"
            element={<RegisterForm onSwitchToLogin={() => undefined} />}
          />
          <Route path="*" element={<LocationMarker />} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Nome Completo"), account.name);
    await user.type(screen.getByLabelText("E-mail"), account.email);
    await user.type(screen.getByLabelText("CPF"), "123.456.789-01");
    await user.type(screen.getByLabelText("CEP"), "01001-000");
    await user.click(screen.getByLabelText("Estagiário"));
    await user.type(
      screen.getByLabelText("Comprovação institucional"),
      "institution@example.com",
    );
    await user.type(screen.getByLabelText("Senha"), "Password1!");
    await user.type(screen.getByLabelText("Confirmar Senha"), "Password1!");
    await user.click(screen.getByRole("button", { name: "Registrar" }));
    expect(
      await screen.findByText("/verify-email?email=user%40example.com"),
    ).toBeTruthy();
    expect(
      JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string),
    ).toEqual({
      name: account.name,
      email: account.email,
      password: "Password1!",
      cpf: "12345678901",
      cep: "01001000",
    });
    expect(localStorage.getItem("token")).toBeNull();
    expect(localStorage.getItem("ead.auth.user")).toBeNull();
    expect(
      JSON.parse(localStorage.getItem("ead.profile.metadata")!)[
        String(account.id)
      ],
    ).toBe("estagiario");
  });

  it("reads email from the URL, resends and verifies through /auth/verify", async () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/verify-email?email=user%40example.com"]}>
        <Routes>
          <Route path="/verify-email" element={<VerifyEmailForm />} />
          <Route path="*" element={<LocationMarker />} />
        </Routes>
      </MemoryRouter>,
    );
    expect((screen.getByLabelText("E-mail") as HTMLInputElement).value).toBe(
      account.email,
    );
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
    expect(JSON.parse(httpAdapter.mock.calls.at(-1)![0].data)).toEqual({
      email: account.email,
      code: "123456",
    });
  });

  it("passes email from forgot-password to reset-password", async () => {
    render(
      <MemoryRouter initialEntries={["/forgot-password"]}>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="*" element={<LocationMarker />} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.type(screen.getByLabelText("E-mail"), account.email);
    await user.click(screen.getByRole("button", { name: "Enviar código" }));
    expect(
      await screen.findByText("/reset-password?email=user%40example.com"),
    ).toBeTruthy();
    expect(httpAdapter.mock.calls[0][0].url).toBe("/auth/forgot-password");
  });

  it("submits email, code and password then returns to login", async () => {
    render(
      <MemoryRouter
        initialEntries={["/reset-password?email=user%40example.com"]}
      >
        <Routes>
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="*" element={<LocationMarker />} />
        </Routes>
      </MemoryRouter>,
    );
    const user = userEvent.setup();
    await user.click(screen.getByLabelText("Dígito 1 do código"));
    await user.paste("123456");
    await user.type(screen.getByLabelText("Nova senha"), "NewPassword2!");
    await user.type(
      screen.getByLabelText("Confirmar nova senha"),
      "NewPassword2!",
    );
    await user.click(screen.getByRole("button", { name: "Redefinir senha" }));
    expect(await screen.findByText("/login")).toBeTruthy();
    expect(JSON.parse(httpAdapter.mock.calls[0][0].data)).toEqual({
      email: account.email,
      code: "123456",
      password: "NewPassword2!",
    });
  });

});
