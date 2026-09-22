import { useEffect, useState, type FormEvent } from "react";
import { BookOpen, Plus, Trash2 } from "lucide-react";
import courseService, { type Curso } from "../services/courseService";
import trailService, { type Trilha } from "../services/trailService";

const emptyForm = {
  nome: "",
  descricao: "",
  capa: "",
  nivel: "",
  cor_fundo: "#3f5fd8",
  courseIds: [] as string[],
};

export default function AdminTrailManagement({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const [trails, setTrails] = useState<Trilha[]>([]);
  const [courses, setCourses] = useState<Curso[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([trailService.listTrails(), courseService.listCourses()])
      .then(([trailData, courseData]) => {
        setTrails(trailData);
        setCourses(courseData);
      })
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar as trilhas.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const toggleCourse = (courseId: string) => {
    setForm((current) => ({
      ...current,
      courseIds: current.courseIds.includes(courseId)
        ? current.courseIds.filter((id) => id !== courseId)
        : [...current.courseIds, courseId],
    }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const created = await trailService.createTrail({
        nome: form.nome.trim(),
        descricao: form.descricao.trim() || undefined,
        capa: form.capa.trim() || undefined,
        nivel: form.nivel.trim() || undefined,
        cor_fundo: form.cor_fundo,
        courseIds: form.courseIds,
      });
      setTrails((current) =>
        [...current, created].sort((a, b) =>
          a.nome.localeCompare(b.nome, "pt-BR"),
        ),
      );
      setForm(emptyForm);
      setMessage(`Trilha ${created.nome} criada com sucesso.`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível criar a trilha.",
      );
    } finally {
      setSaving(false);
    }
  };

  const remove = async (trail: Trilha) => {
    if (!window.confirm(`Excluir a trilha "${trail.nome}"?`)) return;
    setError("");
    setMessage("");
    try {
      await trailService.deleteTrail(trail.id);
      setTrails((current) => current.filter(({ id }) => id !== trail.id));
      setMessage("Trilha excluída com sucesso.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir a trilha.",
      );
    }
  };

  return (
    <section
      className={embedded ? "" : "mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8"}
    >
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-6 shadow-sm">
        {!embedded && (
          <div className="flex items-center gap-3">
            <BookOpen className="text-indigo-600" />
            <div>
              <h2 className="text-xl font-black text-[#25304a]">
                Gerenciar trilhas
              </h2>
              <p className="text-sm text-slate-600">
                Crie trilhas reais e escolha os cursos que farão parte delas.
              </p>
            </div>
          </div>
        )}

        {(error || message) && (
          <div
            role={error ? "alert" : "status"}
            className={`mt-5 rounded-md px-4 py-3 text-sm font-semibold ${error ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}
          >
            {error || message}
          </div>
        )}

        <form onSubmit={submit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Nome da trilha
            <input
              required
              maxLength={255}
              value={form.nome}
              onChange={(event) =>
                setForm((current) => ({ ...current, nome: event.target.value }))
              }
              className="h-11 rounded-md border border-slate-200 px-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Nível
            <input
              maxLength={100}
              value={form.nivel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  nivel: event.target.value,
                }))
              }
              className="h-11 rounded-md border border-slate-200 px-3"
              placeholder="Iniciante, intermediário..."
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700">
            Cor do fundo
            <span className="flex h-11 items-center gap-3 rounded-md border border-slate-200 bg-white px-3">
              <input
                type="color"
                value={form.cor_fundo}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    cor_fundo: event.target.value,
                  }))
                }
                className="h-8 w-12 cursor-pointer rounded border-0 bg-transparent p-0"
                aria-label="Escolher cor do fundo da trilha"
              />
              <span className="font-mono text-sm font-semibold uppercase text-slate-600">
                {form.cor_fundo}
              </span>
            </span>
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">
            Descrição
            <textarea
              value={form.descricao}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  descricao: event.target.value,
                }))
              }
              className="min-h-24 rounded-md border border-slate-200 p-3"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-slate-700 md:col-span-2">
            URL da capa
            <input
              type="url"
              maxLength={255}
              value={form.capa}
              onChange={(event) =>
                setForm((current) => ({ ...current, capa: event.target.value }))
              }
              className="h-11 rounded-md border border-slate-200 px-3"
              placeholder="https://..."
            />
          </label>

          <fieldset className="md:col-span-2">
            <legend className="text-sm font-bold text-slate-700">
              Cursos da trilha
            </legend>
            <div className="mt-2 grid max-h-52 gap-2 overflow-y-auto rounded-md border border-slate-200 bg-white p-3 md:grid-cols-2">
              {courses.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Nenhum curso cadastrado.
                </p>
              ) : (
                courses.map((course) => (
                  <label
                    key={course.id}
                    className="flex items-center gap-2 text-sm text-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={form.courseIds.includes(course.id)}
                      onChange={() => toggleCourse(course.id)}
                    />
                    {course.nome}
                  </label>
                ))
              )}
            </div>
          </fieldset>

          <div className="md:col-span-2 md:text-right">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-3 font-bold text-white disabled:opacity-60"
            >
              <Plus size={18} />
              {saving ? "Criando..." : "Criar trilha"}
            </button>
          </div>
        </form>

        <div className="mt-8 border-t border-indigo-100 pt-6">
          <h3 className="font-black text-[#25304a]">Trilhas cadastradas</h3>
          {loading ? (
            <p className="mt-3 text-sm text-slate-500">Carregando...</p>
          ) : trails.length === 0 ? (
            <p className="mt-3 text-sm text-slate-500">
              Nenhuma trilha cadastrada no banco.
            </p>
          ) : (
            <div className="mt-3 grid gap-2">
              {trails.map((trail) => (
                <div
                  key={trail.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-4 py-3"
                >
                  <div>
                    <p className="font-bold text-slate-800">{trail.nome}</p>
                    <p className="text-xs text-slate-500">
                      {trail.cursos.length}{" "}
                      {trail.cursos.length === 1 ? "curso" : "cursos"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => remove(trail)}
                    aria-label={`Excluir ${trail.nome}`}
                    className="rounded-md p-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
