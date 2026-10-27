import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthContext } from "../context/auth-context";
import CertificateTemplatesPage from "../pages/CertificateTemplatesPage";
import certificateService, {
  type CertificateTemplate,
} from "../services/certificateService";

vi.mock("../components/Navbar/Navbar", () => ({ default: () => null }));
vi.mock("../components/Footer/Footer", () => ({ default: () => null }));

const admin = {
  id: "admin-1",
  name: "Administrador",
  email: "admin@example.com",
  role: "admin" as const,
};

const serverTemplate: CertificateTemplate = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Modelo persistido",
  eyebrow: "Instituição",
  title: "Certificado",
  body: "{aluno} concluiu {curso}.",
  signature: "Coordenação",
  primaryColor: "#112233",
  accentColor: "#445566",
  isDefault: true,
  logos: [],
  signatures: [],
};

beforeEach(() => {
  const entries = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    get length() {
      return entries.size;
    },
    clear: () => entries.clear(),
    getItem: (key: string) => entries.get(key) ?? null,
    key: (index: number) => [...entries.keys()][index] ?? null,
    removeItem: (key: string) => entries.delete(key),
    setItem: (key: string, value: string) => entries.set(key, String(value)),
  } satisfies Storage);
  vi.spyOn(certificateService, "syncLegacyTemplates").mockResolvedValue({
    imported: 1,
    skipped: 0,
  });
  vi.spyOn(certificateService, "listTemplates").mockResolvedValue([
    serverTemplate,
  ]);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function renderPage() {
  return render(
    <AuthContext.Provider
      value={{
        user: admin,
        loading: false,
        refresh: async () => admin,
        logout: () => undefined,
      }}
    >
      <MemoryRouter>
        <CertificateTemplatesPage />
      </MemoryRouter>
    </AuthContext.Provider>,
  );
}

describe("Certificate template persistence", () => {
  it("sincroniza o legado sem apagar o localStorage e passa a listar a API", async () => {
    const legacy = {
      id: "modelo-local",
      name: "Modelo local",
      eyebrow: "Instituição",
      title: "Certificado local",
      body: "{aluno} concluiu {curso}.",
      signature: "Coordenação",
      primaryColor: "#112233",
      accentColor: "#445566",
      isDefault: true,
    };
    localStorage.setItem("ead.certificate.templates", JSON.stringify([legacy]));

    renderPage();

    expect(await screen.findByText("Modelo persistido")).toBeTruthy();
    expect(certificateService.syncLegacyTemplates).toHaveBeenCalledWith([
      { ...legacy, logos: [], signatures: [] },
    ]);
    expect(localStorage.getItem("ead.certificate.templates")).toBe(
      JSON.stringify([legacy]),
    );
  });

  it("edita e salva o modelo pela API", async () => {
    vi.spyOn(certificateService, "updateTemplate").mockResolvedValue({
      ...serverTemplate,
      title: "Título atualizado",
    });
    renderPage();
    const user = userEvent.setup();

    await user.click(
      await screen.findByRole("button", {
        name: "Editar modelo Modelo persistido",
      }),
    );
    const title = screen.getByLabelText("Título");
    await user.clear(title);
    await user.type(title, "Título atualizado");
    await user.click(screen.getByRole("button", { name: "Salvar modelo" }));

    expect(certificateService.updateTemplate).toHaveBeenCalledWith(
      serverTemplate.id,
      expect.objectContaining({ title: "Título atualizado" }),
    );
    expect(await screen.findByText("Modelo atualizado com sucesso.")).toBeTruthy();
  });
});
