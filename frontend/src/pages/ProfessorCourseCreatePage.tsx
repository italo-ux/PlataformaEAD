import { useState, type ChangeEvent, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  BookOpen,
  CheckCircle2,
  FileText,
  Image,
  ListChecks,
  PlusCircle,
  UserRound,
  Users,
} from "lucide-react";
import Footer from "../components/Footer/Footer";
import Navbar from "../components/Navbar/Navbar";
import { canCreateCourses, type User } from "../data/userMock";
import type { Instructor } from "../data/courseData";
import courseService from "../services/courseService";
import {
  getAuthenticatedUser,
  getRegisteredTeachers,
} from "../services/userService";

const initialFormState = {
  title: "",
  description: "",
  image: "",
  about: "",
  lessons: "",
};

const fieldClass =
  "w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-slate-900 placeholder-gray-400 transition focus:border-blue-600 focus:outline-none focus:shadow-lg";

const labelClass = "mb-2 block text-sm font-bold text-[#25304a]";

function mapTeacherToInstructor(teacher: User): Instructor {
  return {
    id: teacher.id,
    name: teacher.name,
    email: teacher.email,
    image: teacher.avatar,
    bio: "Professor da Plataforma EAD Inovacao. Bio temporaria ate o backend enviar o perfil completo.",
  };
}

export default function ProfessorCourseCreatePage() {
  const navigate = useNavigate();
  const user = getAuthenticatedUser();
  const registeredTeachers = getRegisteredTeachers();
  const [formValues, setFormValues] = useState(initialFormState);
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>(() =>
    user?.role === "professor" ? [user.id] : [],
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!user || !canCreateCourses(user)) {
    return <Navigate to={user ? "/home" : "/login"} replace />;
  }

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setFormValues((currentValues) => ({
      ...currentValues,
      [name]: value,
    }));
    setError("");
  };

  const handleToggleTeacher = (teacherId: number) => {
    setSelectedTeacherIds((currentIds) =>
      currentIds.includes(teacherId)
        ? currentIds.filter((currentId) => currentId !== teacherId)
        : [...currentIds, teacherId],
    );
    setError("");
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setSaving(true);

    const lessonTitles = formValues.lessons
      .split(/\r?\n/)
      .map((lessonTitle) => lessonTitle.trim())
      .filter(Boolean);
    const selectedTeachers =
      user.role === "admin"
        ? registeredTeachers.filter((teacher) =>
            selectedTeacherIds.includes(teacher.id),
          )
        : [user];

    if (selectedTeachers.length === 0) {
      setError("Selecione pelo menos um professor para o curso.");
      setSaving(false);
      return;
    }

    try {
      // Este payload simula o contrato do backend: dados do curso, instrutor
      // autenticado e aulas iniciais enviadas pelo professor/admin.
      const createdCourse = await courseService.createCourse({
        title: formValues.title,
        description: formValues.description,
        image: formValues.image,
        about: formValues.about,
        instructors: selectedTeachers.map(mapTeacherToInstructor),
        lessonTitles,
      });

      navigate(`/courses/${createdCourse.id}`);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro ao criar curso mockado";
      setError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f9ff] text-slate-950">
      <Navbar user={user} />

      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
              Area do professor
            </p>
            <h1 className="mt-2 text-3xl font-black text-[#25304a]">
              Adicionar novo curso
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-slate-600">
              Crie um curso mockado para validar o fluxo do professor antes da
              integracao com o backend.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/home#cursos")}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-white px-4 py-3 font-bold text-blue-700 transition hover:border-blue-300 hover:bg-blue-50"
          >
            <BookOpen size={18} />
            Ver cursos
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm sm:p-8"
        >
          {error && (
            <div className="mb-6 rounded-lg bg-red-100 p-4 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label htmlFor="title" className={labelClass}>
                Titulo do curso
              </label>
              <div className="relative">
                <FileText
                  className="pointer-events-none absolute left-4 top-3.5 text-gray-400"
                  size={20}
                />
                <input
                  id="title"
                  name="title"
                  value={formValues.title}
                  onChange={handleChange}
                  placeholder="Ex: Logica de programacao"
                  className={`${fieldClass} pl-12`}
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="image" className={labelClass}>
                URL da imagem
              </label>
              <div className="relative">
                <Image
                  className="pointer-events-none absolute left-4 top-3.5 text-gray-400"
                  size={20}
                />
                <input
                  id="image"
                  name="image"
                  type="url"
                  value={formValues.image}
                  onChange={handleChange}
                  placeholder="Opcional"
                  className={`${fieldClass} pl-12`}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <label htmlFor="description" className={labelClass}>
              Descricao curta
            </label>
            <textarea
              id="description"
              name="description"
              value={formValues.description}
              onChange={handleChange}
              placeholder="Resumo que aparece no card do curso"
              className={`${fieldClass} min-h-28 resize-y`}
              required
            />
          </div>

          <div className="mt-6">
            <label htmlFor="about" className={labelClass}>
              Sobre o curso
            </label>
            <textarea
              id="about"
              name="about"
              value={formValues.about}
              onChange={handleChange}
              placeholder="Explique objetivos, conteudos e resultado esperado"
              className={`${fieldClass} min-h-32 resize-y`}
              required
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-bold text-[#25304a]">
                Professores responsaveis
              </span>
            </div>

            {user.role === "admin" ? (
              <div className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 sm:grid-cols-2">
                {registeredTeachers.length > 0 ? (
                  registeredTeachers.map((teacher) => {
                    const isSelected = selectedTeacherIds.includes(teacher.id);

                    return (
                      <label
                        key={teacher.id}
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-white p-3 transition ${
                          isSelected
                            ? "border-blue-400 shadow-sm"
                            : "border-slate-200 hover:border-blue-200"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleTeacher(teacher.id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-600 text-sm font-bold text-white">
                          {teacher.avatar ? (
                            <img
                              src={teacher.avatar}
                              alt={`${teacher.name} avatar`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserRound className="h-5 w-5" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-bold text-[#25304a]">
                            {teacher.name}
                          </span>
                          <span className="block truncate text-xs text-slate-500">
                            {teacher.email}
                          </span>
                        </span>
                      </label>
                    );
                  })
                ) : (
                  <p className="text-sm font-semibold text-slate-600">
                    Nenhum professor cadastrado no mock atual.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#25304a]">
                    {user.name}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    {user.email}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6">
            <label htmlFor="lessons" className={labelClass}>
              Aulas
            </label>
            <div className="relative">
              <ListChecks
                className="pointer-events-none absolute left-4 top-3.5 text-gray-400"
                size={20}
              />
              <textarea
                id="lessons"
                name="lessons"
                value={formValues.lessons}
                onChange={handleChange}
                placeholder={"Introducao ao curso\nPrimeiro projeto\nRevisao final"}
                className={`${fieldClass} min-h-40 resize-y pl-12`}
                required
              />
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Escreva uma aula por linha. O backend futuro podera trocar este
              campo por um editor completo de modulos e aulas.
            </p>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => navigate("/home#cursos")}
              className="rounded-lg border border-gray-200 bg-white px-5 py-3 font-bold text-slate-600 transition hover:border-gray-300 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <PlusCircle size={20} />
              {saving ? "Salvando..." : "Salvar curso"}
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
}
