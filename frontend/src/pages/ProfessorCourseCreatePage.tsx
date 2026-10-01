import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  Navigate,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  AlertTriangle,
  Award,
  BookOpen,
  ListVideo,
  PlusCircle,
  Plus,
  X,
  Rocket,
  Save,
  UsersRound,
} from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import { canCreateCourses } from "../data/userMock";
import courseService, { type Curso, type CursoInput } from "../services/courseService";
import { getAuthenticatedUser } from "../services/userService";
import CourseLessonsEditor from "../components/CourseLessonsEditor";

interface CourseFormState {
  nome: string;
  descricao: string;
  url_foto: string;
  carga_horaria: string;
  categoria: string;
  ambiente_teste: boolean;
}

const initialForm: CourseFormState = {
  nome: "",
  descricao: "",
  url_foto: "",
  carga_horaria: "",
  categoria: "",
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
  const [addingCategory, setAddingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState("");
  const [categoryError, setCategoryError] = useState("");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [status, setStatus] = useState("");
  const [courseStatus, setCourseStatus] = useState<"rascunho" | "publicado">(
    "rascunho",
  );
  const [publishing, setPublishing] = useState(false);
  const [unavailableVideos, setUnavailableVideos] = useState<Array<{ id: string; titulo: string }>>([]);
  const [validationPending, setValidationPending] = useState(false);
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
          ambiente_teste: course.ambiente_teste,
        });
        setCourseStatus(course.status);
        setUnavailableVideos(course.videos_indisponiveis ?? []);
        setValidationPending(Boolean(course.validacao_pendente));
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
  const courseLocked = isEditing && courseStatus === "publicado";
  const lessonManagementMode = courseStatus === "rascunho"
    ? "editable"
    : unavailableVideos.length > 0
      ? "repair"
      : "readonly";

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

  const categories = form.categoria.split(",").map((item) => item.trim()).filter(Boolean);
  const addCategory = () => {
    const value = categoryDraft.trim();
    if (!value) {
      setCategoryError("Digite o nome da categoria.");
      return;
    }
    if (value.includes(",")) {
      setCategoryError("Adicione uma categoria por vez, sem vírgulas.");
      return;
    }
    if (categories.some((item) => item.toLocaleLowerCase("pt-BR") === value.toLocaleLowerCase("pt-BR"))) {
      setCategoryError("Esta categoria já foi adicionada.");
      return;
    }
    const next = [...categories, value].join(", ");
    if (next.length > 255) {
      setCategoryError("As categorias atingiram o limite de 255 caracteres.");
      return;
    }
    setForm((current) => ({ ...current, categoria: next }));
    setCategoryDraft("");
    setCategoryError("");
    setAddingCategory(false);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (categoryDraft.trim()) {
      setCategoryError("Adicione ou cancele a categoria antes de salvar o curso.");
      return;
    }
    setError("");
    setStatus("");
    setSaving(true);

    const payload: CursoInput = {
      nome: form.nome.trim(),
      ambiente_teste: form.ambiente_teste,
    };
    if (form.descricao.trim()) payload.descricao = form.descricao.trim();
    if (form.url_foto.trim()) payload.url_foto = form.url_foto.trim();
    if (isEditing || categories.length > 0) payload.categoria = categories.join(", ");
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
      setUnavailableVideos([]);
      setValidationPending(false);
      window.dispatchEvent(new Event("ead.sidebar.refresh"));
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

  const refreshAvailabilityAfterRepair = async () => {
    if (!courseId) return;
    const course: Curso = await courseService.getCourse(courseId);
    setCourseStatus(course.status);
    setUnavailableVideos(course.videos_indisponiveis ?? []);
    setValidationPending(Boolean(course.validacao_pendente));
    window.dispatchEvent(new Event("ead.sidebar.refresh"));
    if (!course.conteudo_indisponivel) {
      setStatus("Vídeos validados. O curso voltou a ficar disponível para os alunos e está bloqueado para edição.");
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

        {(unavailableVideos.length > 0 || validationPending) && (
          <div className="mb-6 flex gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950" role="alert">
            <AlertTriangle className="mt-0.5 shrink-0" size={22} />
            <div>
              <p className="font-black">Curso indisponível para alunos</p>
              <p className="mt-1 text-sm">
                {validationPending
                  ? "A validação de um ou mais vídeos está pendente."
                  : "Corrija ou substitua os vídeos indisponíveis abaixo."}
              </p>
              {unavailableVideos.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-sm font-semibold">
                  {unavailableVideos.map((video) => (
                    <li key={video.id}>{video.titulo}</li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

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
              <div
                role="status"
                className="mb-6 rounded-lg bg-emerald-100 p-4 text-sm font-semibold text-emerald-700"
              >
                {status}
              </div>
            )}

            {courseLocked && (
              <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-semibold text-blue-900">
                {unavailableVideos.length > 0
                  ? "Curso publicado em modo de reparo: os dados do curso estão bloqueados e somente as URLs dos vídeos indisponíveis podem ser alteradas."
                  : "Curso publicado e disponível para os alunos. A edição está bloqueada."}
              </div>
            )}

            <fieldset disabled={courseLocked} className={courseLocked ? "opacity-70" : ""}>
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
              <div className="sm:col-span-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#25304a]">Categoria</span>
                  <button type="button" aria-label="Adicionar categoria" aria-expanded={addingCategory}
                    onClick={() => { setAddingCategory(true); setCategoryError(""); }}
                    className="flex h-9 w-9 items-center justify-center rounded-full text-blue-600 hover:bg-blue-50 focus-visible:outline-2 focus-visible:outline-blue-600">
                    <Plus size={20} />
                  </button>
                </div>
                {categories.length > 0 && (
                  <ul aria-label="Categorias adicionadas" className="mt-2 flex flex-wrap gap-2">
                    {categories.map((category, index) => (
                      <li key={`${category}-${index}`} className="inline-flex items-center gap-1 rounded-full bg-blue-50 py-1 pl-3 pr-1 text-sm font-semibold text-blue-800">
                        {category}
                        <button type="button" aria-label={`Remover categoria ${category}`}
                          onClick={() => setForm((current) => ({ ...current, categoria: categories.filter((_, i) => i !== index).join(", ") }))}
                          className="rounded-full p-1.5 hover:bg-blue-100">
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {addingCategory && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input aria-label="Nome da categoria" autoFocus value={categoryDraft} maxLength={255}
                      aria-invalid={Boolean(categoryError)} aria-describedby={categoryError ? "category-error" : undefined}
                      placeholder="Nome da categoria"
                      onChange={(event) => { setCategoryDraft(event.target.value); setCategoryError(""); }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") { event.preventDefault(); addCategory(); }
                        if (event.key === "Escape") { event.preventDefault(); setAddingCategory(false); setCategoryDraft(""); setCategoryError(""); }
                      }}
                      className={`${fieldClass} flex-1 basis-48`} />
                    <button type="button" onClick={addCategory} className="rounded-lg bg-blue-600 px-4 py-3 text-sm font-bold text-white">Adicionar</button>
                    <button type="button" aria-label="Cancelar categoria" onClick={() => { setAddingCategory(false); setCategoryDraft(""); setCategoryError(""); }} className="rounded-lg p-3 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
                  </div>
                )}
                {categoryError && <p id="category-error" role="alert" className="mt-2 text-sm text-red-700">{categoryError}</p>}
              </div>
            </div>
            </fieldset>

            {testCourseOptionEnabled && (
              <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
                <input
                  name="ambiente_teste"
                  type="checkbox"
                  checked={form.ambiente_teste}
                  onChange={handleChange}
                  disabled={courseLocked}
                  className="mt-1 h-4 w-4 rounded border-amber-400 text-amber-600 disabled:cursor-not-allowed"
                />
                <span>
                  <span className="block font-black">Ambiente de teste</span>
                  <span className="mt-1 block leading-5 text-amber-800">
                    Ao iniciar este curso, o aluno conclui todas as aulas e
                    recebe o certificado imediatamente. Use somente com dados de
                    teste.
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
              {!courseLocked && (
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
              )}
            </div>
          </form>
        )}
        {isEditing && courseId && !loading && !loadFailed && (
          <>
            <section
              aria-label="Etapas de configuração do curso"
              className="mt-8 rounded-xl border border-blue-100 bg-white p-5 shadow-sm sm:p-6"
            >
              <ol className="grid gap-8 md:grid-cols-3 md:gap-10">
                <li className="relative rounded-xl border-2 border-blue-600 bg-blue-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">
                      1
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <ListVideo size={18} className="text-blue-700" />
                        <p className="font-black text-blue-950">
                          Adicionar aulas
                        </p>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-blue-800">
                        Cadastre e organize o conteúdo do curso.
                      </p>
                    </div>
                  </div>
                  <span aria-hidden="true">
                    <ArrowRight
                      className="absolute -right-7 top-1/2 hidden -translate-y-1/2 text-blue-400 md:block"
                      size={20}
                    />
                    <ArrowDown
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-blue-400 md:hidden"
                      size={20}
                    />
                  </span>
                </li>
                <li className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-black text-slate-600">
                      2
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <Award size={18} className="text-slate-500" />
                        <p className="font-black text-slate-800">Certificado</p>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Escolha um modelo ou crie um certificado.
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                        Em breve
                      </span>
                    </div>
                  </div>
                  <span aria-hidden="true">
                    <ArrowRight
                      className="absolute -right-7 top-1/2 hidden -translate-y-1/2 text-blue-400 md:block"
                      size={20}
                    />
                    <ArrowDown
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-blue-400 md:hidden"
                      size={20}
                    />
                  </span>
                </li>
                <li className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-200 text-sm font-black text-slate-600">
                      3
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <UsersRound size={18} className="text-slate-500" />
                        <p className="font-black text-slate-800">
                          Definir público
                        </p>
                      </div>
                      <p className="mt-1 text-xs leading-5 text-slate-500">
                        Todos os usuários, professores ou estagiários.
                      </p>
                      <span className="mt-2 inline-flex rounded-full bg-amber-100 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-amber-700">
                        Em breve
                      </span>
                    </div>
                  </div>
                </li>
              </ol>
            </section>
            <CourseLessonsEditor
              courseId={courseId}
              mode={lessonManagementMode}
              unavailableLessonIds={unavailableVideos.map((video) => video.id)}
              onVideoRepaired={refreshAvailabilityAfterRepair}
            />
            <section className="mt-6 rounded-xl border border-blue-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-black text-[#25304a]">
                    Disponibilidade
                  </h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {courseStatus === "publicado" && unavailableVideos.length > 0
                      ? "Curso temporariamente indisponível. Corrija somente as URLs indicadas acima."
                      : courseStatus === "publicado"
                        ? "Este curso está publicado, disponível para os alunos e bloqueado para edição."
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
