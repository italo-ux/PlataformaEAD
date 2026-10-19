import { useState, type FormEvent } from "react";
import { ShieldPlus, UserPlus } from "lucide-react";
import { createManagedUser } from "../services/userService";

const initialForm = {
  name: "",
  email: "",
  cpf: "",
  password: "",
  role: "professor" as "professor" | "admin",
};

export default function AdminUserManagement({ embedded = false }: { embedded?: boolean }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const created = await createManagedUser(form);
      setStatus(
        `${created.role === "admin" ? "Administrador" : "Professor"} ${created.email} criado com sucesso.`,
      );
      setForm(initialForm);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar o usuário.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className={embedded ? "" : "mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8"}>
      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
        {!embedded && <div className="flex items-center gap-3">
          <ShieldPlus className="text-blue-600" />
          <div>
            <h2 className="text-xl font-black text-[#25304a]">
              Cadastrar equipe
            </h2>
            <p className="text-sm text-slate-600">
              Crie professores ou outros administradores com senha temporária.
            </p>
          </div>
        </div>}

        {(error || status) && (
          <div
            role={error ? "alert" : "status"}
            className={`mt-5 rounded-md px-4 py-3 text-sm font-semibold ${
              error ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {error || status}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Nome completo
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className="h-11 rounded-md border border-slate-200 px-3"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            E-mail
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              className="h-11 rounded-md border border-slate-200 px-3"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            CPF
            <input
              value={form.cpf}
              onChange={(event) =>
                setForm((current) => ({ ...current, cpf: event.target.value }))
              }
              className="h-11 rounded-md border border-slate-200 px-3"
              inputMode="numeric"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Papel
            <select
              value={form.role}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  role: event.target.value as "professor" | "admin",
                }))
              }
              className="h-11 rounded-md border border-slate-200 bg-white px-3"
            >
              <option value="professor">Professor</option>
              <option value="admin">Administrador</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">
            Senha temporária
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              className="h-11 rounded-md border border-slate-200 px-3"
              minLength={8}
              required
            />
            <span className="text-xs font-normal text-slate-500">
              Use maiúscula, minúscula, número e caractere especial.
            </span>
          </label>
          <div className="md:col-span-2 md:text-right">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              <UserPlus size={18} />
              {saving ? "Cadastrando..." : "Cadastrar usuário"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
