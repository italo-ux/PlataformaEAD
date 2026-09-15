import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { BookOpen, PlusCircle, Rocket, Save } from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import { canCreateCourses } from "../data/userMock";
import courseService, { type CursoInput } from "../services/courseService";
import { getAuthenticatedUser } from "../services/userService";
import CourseLessonsEditor from "../components/CourseLessonsEditor";

interface CourseFormState {
  nome: string;
  descricao: string;
  url_foto: string;
  carga_horaria: string;
  categoria: string;
  nivel: string;
  ambiente_teste: boolean;
}

const initialForm: CourseFormState = {
  nome: "",
  descricao: "",
  url_foto: "",
  carga_horaria: "",
  categoria: "",
  nivel: "",
  ambiente_teste: false,
};

const fieldClass =
  "w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:outline-none";

export default function ProfessorCourseCreatePage() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [searchParams] = useSearchParams();
  const user = getAuthenticatedUser();
  const isEditing = Boolean(courseId);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [status, setStatus] = useState("");
  const [courseStatus, setCourseStatus] = useState<"rascunho" | "publicado">("rascunho");
  const [publishing, setPublishing] = useState(false);
  const testCourseOptionEnabled =
    import.meta.env.MODE === "test" ||
    import.meta.env.VITE_ENABLE_TEST_COURSES === "true";

  useEffect(() => {
    if (searchParams.get("created") === "1") {
      setStatus("Curso criado com sucesso. Agora adicione as aulas.");
    }
  }, [searchParams]);

  useEffect(() => {
    if (!courseId) return;

    let cancelled = false;
    setLoading(true);
    setLoadFailed(false);
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
          ambiente_teste: course.ambiente_teste,
        });
        setCourseStatus(course.status);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setLoadFailed(true);
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
  if (!canCreateCourses(user)) return <Navigate to="/home" replace />;

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name } = event.target;
    const value =
      event.target instanceof HTMLInputElement &&
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setSaving(true);

    const payload: CursoInput = {
      nome: form.nome.trim(),
      ambiente_teste: form.ambiente_teste,
    };
    if (form.descricao.trim()) payload.descricao = form.descricao.trim();
    if (form.url_foto.trim()) payload.url_foto = form.url_foto.trim();
    if (form.categoria.trim()) payload.categoria = form.categoria.trim();
    if (form.nivel.trim()) payload.nivel = form.nivel.trim();
    if (form.carga_horaria.trim()) {
      payload.carga_horaria = Number(form.carga_horaria);
    }

    try {
      if (isEditing && courseId) {
        await courseService.updateCourse(courseId, payload);
        setStatus("Curso atualizado com sucesso.");
      } else {
        const course = await courseService.createCourse(payload);
        navigate(`/courses/${course.id}/editar?created=1`, { replace: true });
      }
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

  const handlePublish = async () => {
    if (!courseId) return;
    setPublishing(true);
    setError("");
    setStatus("");
    try {
      const course = await courseService.publishCourse(courseId);
      setCourseStatus(course.status);
      setStatus("Curso publicado e disponível para matrícula.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível publicar o curso.",
      );
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
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
        ) : loadFailed ? (
          <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
            <p className="font-semibold text-red-700">{error}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-lg bg-blue-600 px-5 py-3 font-bold text-white"
              >
                Tentar novamente
              </button>
              <button
                type="button"
                onClick={() => navigate("/courses")}
                className="rounded-lg border border-gray-200 px-5 py-3 font-bold text-slate-600"
              >
                Voltar aos cursos
              </button>
            </div>
          </div>
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
            {status && (
              <div role="status" className="mb-6 rounded-lg bg-emerald-100 p-4 text-sm font-semibold text-emerald-700">
                {status}
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

            {testCourseOptionEnabled && (
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <input
                  name="ambiente_teste"
                  type="checkbox"
                  checked={form.ambiente_teste}
                  onChange={handleChange}
                  className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600"
                />
                <span>
                  <span className="block font-black">Ambiente de teste</span>
                  <span className="mt-1 block leading-5 text-amber-800">
                    Ao iniciar este curso, o aluno conclui todas as aulas e recebe
                    o certificado imediatamente. Use somente com dados de teste.
                  </span>
                </span>
              </label>
            )}

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
        {isEditing && courseId && !loading && !loadFailed && (
          <>
            <CourseLessonsEditor courseId={courseId} />
            <section className="mt-6 rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#25304a]">Disponibilidade</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {courseStatus === "publicado"
                      ? "Este curso está publicado e aceita matrículas."
                      : "Publique após informar a carga horária e cadastrar pelo menos uma aula."}
                  </p>
                </div>
                {courseStatus === "rascunho" && (
                  <button
                    type="button"
                    onClick={handlePublish}
                    disabled={publishing}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 font-bold text-white disabled:opacity-60"
                  >
                    <Rocket size={18} />
                    {publishing ? "Publicando..." : "Publicar curso"}
                  </button>
                )}
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
