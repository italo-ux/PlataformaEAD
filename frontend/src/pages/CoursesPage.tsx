import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Clock3, PlusCircle, Search } from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import { canCreateCourses } from "../data/userMock";
import courseService, { type Curso } from "../services/courseService";
import { getAuthenticatedUser } from "../services/userService";

function includesSearch(curso: Curso, search: string) {
  return `${curso.nome} ${curso.descricao ?? ""} ${curso.categoria ?? ""} ${curso.nivel ?? ""}`
    .toLocaleLowerCase("pt-BR")
    .includes(search.toLocaleLowerCase("pt-BR"));
}

export default function CoursesPage() {
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const [courses, setCourses] = useState<Curso[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    courseService.listCourses()
      .then(setCourses)
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Não foi possível carregar os cursos."))
      .finally(() => setLoading(false));
  }, []);

  const filteredCourses = useMemo(
    () => courses.filter((course) => includesSearch(course, search.trim())),
    [courses, search],
  );

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-950">
      <Navbar user={user} />
      <main>
        <section className="bg-blue-600 text-white"><div className="mx-auto flex max-w-7xl items-center gap-5 px-4 py-7 sm:px-6 lg:px-8"><BookOpen size={34} /><h1 className="text-2xl font-black sm:text-3xl">Cursos</h1></div></section>
        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <button type="button" onClick={() => navigate("/home")} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-blue-600"><ArrowLeft size={16} />Voltar para home</button>
            {canCreateCourses(user) && <button type="button" onClick={() => navigate("/professor/cursos/novo")} className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"><PlusCircle size={18} />Novo curso</button>}
          </div>
          <label className="mb-6 flex max-w-xl items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2"><Search size={18} className="text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, categoria ou nível" className="w-full outline-none" /></label>
          {loading && <p className="text-slate-600">Carregando cursos...</p>}
          {error && <div className="rounded-md bg-red-100 p-4 font-semibold text-red-700">{error}</div>}
          {!loading && !error && <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{filteredCourses.map((course) => <article key={course.id} onClick={() => navigate(`/courses/${course.id}`)} className="cursor-pointer overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"><div className="h-40 bg-slate-200">{course.url_foto ? <img src={course.url_foto} alt={course.nome} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-blue-600"><BookOpen size={40} /></div>}</div><div className="p-4"><p className="text-xs font-bold uppercase text-blue-600">{course.categoria ?? "Curso"}</p><h2 className="mt-1 text-lg font-black text-[#25304a]">{course.nome}</h2><p className="mt-2 line-clamp-2 text-sm text-slate-500">{course.descricao ?? "Sem descrição disponível."}</p><p className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-slate-500"><Clock3 size={14} />{course.carga_horaria === null ? "Carga horária não informada" : `${course.carga_horaria} horas`}</p></div></article>)}</div>}
          {!loading && !error && filteredCourses.length === 0 && <div className="rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center"><p className="font-bold text-[#25304a]">Nenhum curso encontrado</p><p className="mt-2 text-sm text-slate-500">{courses.length === 0 ? "Ainda não há cursos cadastrados." : "Ajuste sua busca para encontrar outros cursos."}</p></div>}
        </section>
      </main>
      <Footer />
    </div>
  );
}
