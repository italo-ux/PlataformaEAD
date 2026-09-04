import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { Pencil, PlusCircle, Save, Trash2, X } from "lucide-react";
import courseService, {
  type Aula,
  type AulaInput,
} from "../services/courseService";

interface CourseLessonsEditorProps {
  courseId: string;
}

interface LessonFormState {
  titulo: string;
  descricao: string;
  url_video: string;
  duracao_minutos: string;
  ordem: string;
}

const emptyLessonForm: LessonFormState = {
  titulo: "",
  descricao: "",
  url_video: "",
  duracao_minutos: "",
  ordem: "",
};

const fieldClass =
  "mt-2 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:outline-none";

function toForm(lesson: Aula): LessonFormState {
  return {
    titulo: lesson.titulo,
    descricao: lesson.descricao ?? "",
    url_video: lesson.url_video,
    duracao_minutos: lesson.duracao_minutos?.toString() ?? "",
    ordem: lesson.ordem.toString(),
  };
}

function toPayload(form: LessonFormState, editing: boolean): AulaInput {
  const payload: AulaInput = {
    titulo: form.titulo.trim(),
    url_video: form.url_video.trim(),
  };
  if (editing || form.descricao.trim()) {
    payload.descricao = form.descricao.trim();
  }
  if (form.duracao_minutos) {
    payload.duracao_minutos = Number(form.duracao_minutos);
  }
  if (form.ordem) payload.ordem = Number(form.ordem);
  return payload;
}

export default function CourseLessonsEditor({
  courseId,
}: CourseLessonsEditorProps) {
  const [lessons, setLessons] = useState<Aula[]>([]);
  const [form, setForm] = useState<LessonFormState>(emptyLessonForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  const loadLessons = useCallback(async () => {
    const result = await courseService.listLessons(courseId);
    setLessons(result);
  }, [courseId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    courseService
      .listLessons(courseId)
      .then((result) => {
        if (!cancelled) setLessons(result);
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar as aulas.",
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

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyLessonForm);
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setStatus("");
    try {
      const payload = toPayload(form, Boolean(editingId));
      if (editingId) {
        await courseService.updateLesson(courseId, editingId, payload);
        setStatus("Aula atualizada com sucesso.");
      } else {
        await courseService.createLesson(courseId, payload);
        setStatus("Aula adicionada com sucesso.");
      }
      resetForm();
      await loadLessons();
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar a aula.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (lesson: Aula) => {
    setEditingId(lesson.id);
    setForm(toForm(lesson));
    setError("");
    setStatus("");
  };

  const handleDelete = async (lesson: Aula) => {
    if (!window.confirm(`Excluir a aula "${lesson.titulo}"?`)) return;
    setDeletingId(lesson.id);
    setError("");
    setStatus("");
    try {
      await courseService.deleteLesson(courseId, lesson.id);
      if (editingId === lesson.id) resetForm();
      await loadLessons();
      setStatus("Aula excluída com sucesso.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível excluir a aula.",
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase text-blue-600">
              Conteúdo do curso
            </p>
            <h2 className="mt-1 text-2xl font-black text-[#25304a]">
              {editingId ? "Editar aula" : "Adicionar aula"}
            </h2>
          </div>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-slate-800"
            >
              <X size={16} /> Cancelar edição
            </button>
          )}
        </div>

        {error && (
          <p role="alert" className="mb-5 rounded-lg bg-red-100 p-4 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
        {status && (
          <p role="status" className="mb-5 rounded-lg bg-emerald-100 p-4 text-sm font-semibold text-emerald-700">
            {status}
          </p>
        )}

        <label className="mb-5 block text-sm font-bold text-[#25304a]">
          Título da aula
          <input
            name="titulo"
            value={form.titulo}
            onChange={handleChange}
            className={fieldClass}
            required
          />
        </label>
        <label className="mb-5 block text-sm font-bold text-[#25304a]">
          URL do vídeo no YouTube
          <input
            name="url_video"
            type="url"
            value={form.url_video}
            onChange={handleChange}
            className={fieldClass}
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
        </label>
        <label className="mb-5 block text-sm font-bold text-[#25304a]">
          Descrição da aula
          <textarea
            name="descricao"
            value={form.descricao}
            onChange={handleChange}
            className={`${fieldClass} min-h-24 resize-y`}
          />
        </label>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-bold text-[#25304a]">
            Duração (minutos)
            <input
              name="duracao_minutos"
              type="number"
              min="0"
              step="1"
              value={form.duracao_minutos}
              onChange={handleChange}
              className={fieldClass}
            />
          </label>
          <label className="text-sm font-bold text-[#25304a]">
            Ordem
            <input
              name="ordem"
              type="number"
              min="1"
              step="1"
              value={form.ordem}
              onChange={handleChange}
              className={fieldClass}
            />
          </label>
        </div>
        <div className="mt-7 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {editingId ? <Save size={19} /> : <PlusCircle size={19} />}
            {saving
              ? "Salvando aula..."
              : editingId
                ? "Salvar aula"
                : "Adicionar aula"}
          </button>
        </div>
      </form>

      <aside className="h-fit rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-[#25304a]">Aulas cadastradas</h2>
        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Carregando aulas...</p>
        ) : lessons.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-slate-500">
            Nenhuma aula cadastrada. A ordem será calculada automaticamente se
            ficar em branco.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {lessons.map((lesson) => (
              <li key={lesson.id} className="rounded-lg border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase text-blue-600">
                  Aula {lesson.ordem}
                </p>
                <p className="mt-1 font-black text-slate-800">{lesson.titulo}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {lesson.duracao_minutos === null
                    ? "Duração não informada"
                    : `${lesson.duracao_minutos} min`}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(lesson)}
                    className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700"
                    aria-label={`Editar ${lesson.titulo}`}
                  >
                    <Pencil size={14} /> Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(lesson)}
                    disabled={deletingId === lesson.id}
                    className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700 disabled:opacity-60"
                    aria-label={`Excluir ${lesson.titulo}`}
                  >
                    <Trash2 size={14} />
                    {deletingId === lesson.id ? "Excluindo..." : "Excluir"}
                  </button>
                </div>
              </li>
            ))}
          </ol>
        )}
      </aside>
    </section>
  );
}
