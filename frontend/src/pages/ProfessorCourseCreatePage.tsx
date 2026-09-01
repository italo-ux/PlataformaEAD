import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { BookOpen, PlusCircle, Save } from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import courseService, { type CursoInput } from "../services/courseService";
import { getAuthenticatedUser } from "../services/userService";

const initialForm: Record<keyof CursoInput, string> = {
  nome: "",
  descricao: "",
  url_foto: "",
  carga_horaria: "",
  categoria: "",
  nivel: "",
};

const fieldClass =
  "w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:outline-none";

export default function ProfessorCourseCreatePage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const user = getAuthenticatedUser();
  const isEditing = Boolean(courseId);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;
    courseService
      .getCourse(courseId)
      .then((course) => {
        if (cancelled) return;
        setForm({
          nome: course.nome,
          descricao: course.descricao ?? "",
          url_foto: course.url_foto ?? "",
          carga_horaria: course.carga_horaria?.toString() ?? "",
          categoria: course.categoria ?? "",
          nivel: course.nivel ?? "",
        });
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar o curso.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  if (!user) return <Navigate to="/login" replace />;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    const payload: CursoInput = { nome: form.nome.trim() };
    if (form.descricao.trim()) payload.descricao = form.descricao.trim();
    if (form.url_foto.trim()) payload.url_foto = form.url_foto.trim();
    if (form.categoria.trim()) payload.categoria = form.categoria.trim();
    if (form.nivel.trim()) payload.nivel = form.nivel.trim();
    if (form.carga_horaria.trim()) {
      payload.carga_horaria = Number(form.carga_horaria);
    }

    try {
      const course =
        isEditing && courseId
          ? await courseService.updateCourse(courseId, payload)
          : await courseService.createCourse(payload);
      navigate(`/courses/${course.id}`);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar o curso.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-blue-600">
              Gestão de cursos
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#25304a]">
              {isEditing ? "Editar curso" : "Adicionar novo curso"}
            </h1>
          </div>
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="inline-flex items-center gap-2 font-bold text-blue-700"
          >
            <BookOpen size={18} />
            Ver cursos
          </button>
        </div>

        {loading ? (
          <p>Carregando curso...</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm sm:p-8"
          >
            {error && (
              <div className="mb-6 rounded-lg bg-red-100 p-4 text-sm font-semibold text-red-700">
                {error}
              </div>
            )}

            <label className="mb-5 block text-sm font-bold text-[#25304a]">
              Nome do curso
              <input
                name="nome"
                value={form.nome}
                onChange={handleChange}
                className={`${fieldClass} mt-2`}
                required
              />
            </label>

            <label className="mb-5 block text-sm font-bold text-[#25304a]">
              Descrição
              <textarea
                name="descricao"
                value={form.descricao}
                onChange={handleChange}
                className={`${fieldClass} mt-2 min-h-28 resize-y`}
              />
            </label>

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#25304a]">
                URL da imagem
                <input
                  name="url_foto"
                  type="url"
                  value={form.url_foto}
                  onChange={handleChange}
                  className={`${fieldClass} mt-2`}
                />
              </label>
              <label className="text-sm font-bold text-[#25304a]">
                Carga horária (horas)
                <input
                  name="carga_horaria"
                  type="number"
                  min="0"
                  step="1"
                  value={form.carga_horaria}
                  onChange={handleChange}
                  className={`${fieldClass} mt-2`}
                />
              </label>
              <label className="text-sm font-bold text-[#25304a]">
                Categoria
                <input
                  name="categoria"
                  value={form.categoria}
                  onChange={handleChange}
                  className={`${fieldClass} mt-2`}
                />
              </label>
              <label className="text-sm font-bold text-[#25304a]">
                Nível
                <input
                  name="nivel"
                  value={form.nivel}
                  onChange={handleChange}
                  className={`${fieldClass} mt-2`}
                />
              </label>
            </div>

            <div className="mt-8 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate("/courses")}
                disabled={saving}
                className="rounded-lg border border-gray-200 px-5 py-3 font-bold text-slate-600 disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60"
              >
                {isEditing ? <Save size={20} /> : <PlusCircle size={20} />}
                {saving
                  ? "Salvando..."
                  : isEditing
                    ? "Salvar alterações"
                    : "Salvar curso"}
              </button>
            </div>
          </form>
        )}
      </main>
      <Footer />
    </div>
  );
}
