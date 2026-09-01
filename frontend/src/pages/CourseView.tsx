import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock3, Pencil, Play, Trash2 } from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import courseService, { type Curso } from "../services/courseService";
import { isCourseStarted, markCourseAsStarted } from "../services/courseProgressService";
import { getAuthenticatedUser } from "../services/userService";

export default function CourseView() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const user = getAuthenticatedUser();
  const userId = user?.id;
  const [course, setCourse] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!courseId) return;
    courseService
      .getCourse(courseId)
      .then((data) => {
        setCourse(data);
        setStarted(userId ? isCourseStarted(userId, data.id) : false);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Não foi possível carregar o curso."),
      )
      .finally(() => setLoading(false));
  }, [courseId, userId]);

  const handleStart = () => {
    if (!course || !userId) return;
    markCourseAsStarted(userId, course.id);
    setStarted(true);
  };

  const handleDelete = async () => {
    if (!course || !window.confirm(`Excluir o curso "${course.nome}"?`)) return;
    setDeleting(true);
    try {
      await courseService.deleteCourse(course.id);
      navigate("/courses");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível excluir o curso.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#f7f7f7]">
      <Navbar user={user} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <button type="button" onClick={() => navigate("/courses")} className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600">
          <ArrowLeft size={16} />Voltar para cursos
        </button>
        {loading && <p>Carregando curso...</p>}
        {error && <div className="rounded-md bg-red-100 p-4 font-semibold text-red-700">{error}</div>}
        {course && (
          <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="h-64 bg-slate-200">
              {course.url_foto ? <img src={course.url_foto} alt={course.nome} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-blue-600"><BookOpen size={72} /></div>}
            </div>
            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div><p className="text-sm font-bold uppercase tracking-wide text-blue-600">{course.categoria ?? "Curso"}</p><h1 className="mt-2 text-3xl font-black text-[#25304a]">{course.nome}</h1></div>
                {user && <div className="flex flex-wrap gap-2"><button onClick={handleStart} disabled={started} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-bold text-white hover:bg-blue-700 disabled:cursor-default disabled:bg-emerald-600"><Play size={16} className="fill-current" />{started ? "Curso iniciado" : "Iniciar curso"}</button><button onClick={() => navigate(`/courses/${course.id}/editar`)} className="inline-flex items-center gap-2 rounded-md border border-blue-200 px-3 py-2 text-sm font-bold text-blue-700 hover:bg-blue-50"><Pencil size={16} />Editar</button><button onClick={handleDelete} disabled={deleting} className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-2 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-60"><Trash2 size={16} />{deleting ? "Excluindo..." : "Excluir"}</button></div>}
              </div>
              <p className="mt-6 whitespace-pre-wrap leading-7 text-slate-600">{course.descricao ?? "Sem descrição disponível."}</p>
              <dl className="mt-8 grid gap-4 border-t border-slate-200 pt-6 sm:grid-cols-3"><div><dt className="text-xs font-bold uppercase text-slate-500">Carga horária</dt><dd className="mt-1 inline-flex items-center gap-1 font-bold text-slate-800"><Clock3 size={16} />{course.carga_horaria === null ? "Não informada" : `${course.carga_horaria} horas`}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Categoria</dt><dd className="mt-1 font-bold text-slate-800">{course.categoria ?? "Não informada"}</dd></div><div><dt className="text-xs font-bold uppercase text-slate-500">Nível</dt><dd className="mt-1 font-bold text-slate-800">{course.nivel ?? "Não informado"}</dd></div></dl>
            </div>
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
