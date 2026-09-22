import { useCallback, useEffect, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { ArrowUpDown, ChevronDown, ChevronUp, ClipboardList, FileText, GripVertical, Image as ImageIcon, Link2, Pencil, PlusCircle, Save, Trash2, Video, X } from "lucide-react";
import courseService, { type Aula, type AulaInput, type AulaTipo, type PerguntaQuestionario } from "../services/courseService";
import { formatDigitalDuration, parseDigitalDuration } from "../utils/duration";

const QUIZ_PASS_PERCENTAGE = 70;
const QUIZ_MAX_ATTEMPTS = 3;

type ManagementMode = "editable" | "repair" | "readonly";
interface Props {
  courseId: string;
  mode?: ManagementMode;
  unavailableLessonIds?: string[];
  onVideoRepaired?: () => void | Promise<void>;
}
interface FormState {
  titulo: string; descricao: string; tipo: AulaTipo; url_video: string;
  duracao: string; nota_minima: string;
  max_tentativas: string; pontos_base: string; perguntas: PerguntaQuestionario[];
}

const newQuestion = (): PerguntaQuestionario => ({
  enunciado: "", pontos: 1,
  alternativas: [{ texto: "", correta: true }, { texto: "", correta: false }],
});
const emptyForm = (): FormState => ({
  titulo: "", descricao: "", tipo: "video", url_video: "", duracao: "",
  nota_minima: String(QUIZ_PASS_PERCENTAGE), max_tentativas: String(QUIZ_MAX_ATTEMPTS), pontos_base: "0", perguntas: [newQuestion()],
});
const fieldClass = "mt-2 w-full rounded-lg border-2 border-gray-200 bg-white px-4 py-3 text-slate-900 transition focus:border-blue-600 focus:outline-none";
const typeLabels: Record<AulaTipo, string> = { video: "Vídeo", pdf: "PDF", link: "Link", imagem: "Imagem", questionario: "Questionário" };

function toForm(lesson: Aula): FormState {
  return {
    titulo: lesson.titulo, descricao: lesson.descricao ?? "", tipo: lesson.tipo ?? "video",
    url_video: lesson.url_video ?? "", duracao: lesson.duracao_segundos ? formatDigitalDuration(lesson.duracao_segundos) : "",
    nota_minima: String(QUIZ_PASS_PERCENTAGE),
    max_tentativas: String(QUIZ_MAX_ATTEMPTS),
    pontos_base: String(lesson.questionario?.pontos_base ?? 0),
    perguntas: lesson.questionario?.perguntas.map((question) => ({ ...question, alternativas: question.alternativas.map((alternative) => ({ ...alternative })) })) ?? [newQuestion()],
  };
}

function toPayload(form: FormState): AulaInput {
  const payload: AulaInput = { titulo: form.titulo.trim(), descricao: form.descricao.trim(), tipo: form.tipo };
  if (form.tipo === "video") {
    const duration = parseDigitalDuration(form.duracao);
    if (duration === null) throw new Error("Informe uma duração válida no formato MM:SS.");
    payload.url_video = form.url_video.trim(); payload.duracao_segundos = duration;
  } else if (form.tipo === "questionario") {
    if (!form.perguntas.length) throw new Error("Adicione ao menos uma pergunta.");
    form.perguntas.forEach((question, index) => {
      if (!question.enunciado.trim()) throw new Error(`Informe o enunciado da pergunta ${index + 1}.`);
      if (question.alternativas.length < 2 || question.alternativas.some((item) => !item.texto.trim())) throw new Error(`A pergunta ${index + 1} precisa de duas alternativas preenchidas.`);
      if (question.alternativas.filter((item) => item.correta).length !== 1) throw new Error(`Selecione uma alternativa correta na pergunta ${index + 1}.`);
    });
    payload.questionario = {
      nota_minima: QUIZ_PASS_PERCENTAGE, max_tentativas: QUIZ_MAX_ATTEMPTS,
      pontos_base: Number(form.pontos_base || 0),
      perguntas: form.perguntas.map((question) => ({ enunciado: question.enunciado.trim(), pontos: Number(question.pontos), alternativas: question.alternativas.map((item) => ({ texto: item.texto.trim(), correta: item.correta })) })),
    };
  }
  return payload;
}

export default function CourseLessonsEditor({
  courseId,
  mode = "editable",
  unavailableLessonIds = [],
  onVideoRepaired,
}: Props) {
  const [lessons, setLessons] = useState<Aula[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState(""); const [status, setStatus] = useState("");
  const load = useCallback(async () => setLessons(await courseService.listLessons(courseId)), [courseId]);

  useEffect(() => {
    let cancelled = false; setLoading(true);
    courseService.listLessons(courseId).then((items) => { if (!cancelled) setLessons(items); })
      .catch((reason: unknown) => { if (!cancelled) setError(reason instanceof Error ? reason.message : "Não foi possível carregar as aulas."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [courseId]);

  const reset = () => { setEditingId(null); setForm(emptyForm()); };
  const change = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = event.target; setForm((current) => ({ ...current, [name]: value })); };
  const updateQuestion = (index: number, patch: Partial<PerguntaQuestionario>) => setForm((current) => ({ ...current, perguntas: current.perguntas.map((item, i) => i === index ? { ...item, ...patch } : item) }));
  const updateAlternative = (qi: number, ai: number, texto: string) => setForm((current) => ({ ...current, perguntas: current.perguntas.map((question, i) => i !== qi ? question : { ...question, alternativas: question.alternativas.map((alternative, j) => j === ai ? { ...alternative, texto } : alternative) }) }));
  const setCorrect = (qi: number, ai: number) => setForm((current) => ({ ...current, perguntas: current.perguntas.map((question, i) => i !== qi ? question : { ...question, alternativas: question.alternativas.map((alternative, j) => ({ ...alternative, correta: j === ai })) }) }));

  const saveOrder = async (reordered: Aula[], previous: Aula[]) => {
    const normalized = reordered.map((lesson, index) => ({ ...lesson, ordem: index + 1 }));
    setLessons(normalized);
    setDraggingId(null);
    setSavingOrder(true);
    setError("");
    setStatus("");
    try {
      const saved = await courseService.reorderLessons(courseId, normalized.map((lesson) => lesson.id));
      setLessons(saved);
      setStatus("Ordem das aulas atualizada.");
    } catch (reason) {
      setLessons(previous);
      setError(reason instanceof Error ? reason.message : "Não foi possível atualizar a ordem das aulas.");
    } finally {
      setSavingOrder(false);
    }
  };

  const dropLesson = async (targetId: string) => {
    if (!draggingId || draggingId === targetId || savingOrder) return;
    const previous = lessons;
    const sourceIndex = lessons.findIndex((lesson) => lesson.id === draggingId);
    const targetIndex = lessons.findIndex((lesson) => lesson.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const reordered = [...lessons];
    const [moved] = reordered.splice(sourceIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    await saveOrder(reordered, previous);
  };

  const moveLesson = async (lessonId: string, direction: -1 | 1) => {
    if (savingOrder) return;
    const sourceIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
    const targetIndex = sourceIndex + direction;
    if (sourceIndex < 0 || targetIndex < 0 || targetIndex >= lessons.length) return;
    const previous = lessons;
    const reordered = [...lessons];
    [reordered[sourceIndex], reordered[targetIndex]] = [reordered[targetIndex], reordered[sourceIndex]];
    await saveOrder(reordered, previous);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError(""); setStatus("");
    try {
      if (mode === "repair") {
        if (!editingId) throw new Error("Selecione o vídeo que precisa ser corrigido.");
        const url = form.url_video.trim();
        if (!url) throw new Error("Informe a nova URL do vídeo.");
        await courseService.repairLessonVideo(courseId, editingId, url);
        setStatus("Vídeo validado e atualizado com sucesso.");
        reset();
        await load();
        await onVideoRepaired?.();
      } else {
        const payload = toPayload(form);
        if (editingId) await courseService.updateLesson(courseId, editingId, payload);
        else await courseService.createLesson(courseId, payload);
        setStatus(editingId ? "Aula atualizada com sucesso." : "Aula adicionada com sucesso.");
        reset();
        await load();
      }
    }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível salvar a aula."); }
    finally { setSaving(false); }
  };
  const remove = async (lesson: Aula) => {
    if (!window.confirm(`Excluir a aula "${lesson.titulo}"?`)) return; setDeletingId(lesson.id);
    try { await courseService.deleteLesson(courseId, lesson.id); if (editingId === lesson.id) reset(); await load(); setStatus("Aula excluída com sucesso."); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Não foi possível excluir a aula."); }
    finally { setDeletingId(null); }
  };

  if (mode !== "editable") {
    const unavailable = new Set(unavailableLessonIds);
    return <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase text-blue-600">Conteúdo do curso</p>
        <h2 className="mt-1 text-2xl font-black text-[#25304a]">{mode === "repair" ? "Reparar vídeo indisponível" : "Curso publicado"}</h2>
        <p className="mt-3 text-sm leading-6 text-slate-600">{mode === "repair" ? "Por segurança, somente a URL dos vídeos marcados como indisponíveis pode ser alterada. A nova URL será validada antes de ser salva." : "Este curso está disponível para os alunos e não pode mais ser editado."}</p>
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-100 p-4 text-sm font-semibold text-red-700">{error}</p>}
        {status && <p role="status" className="mt-5 rounded-lg bg-emerald-100 p-4 text-sm font-semibold text-emerald-700">{status}</p>}
        {mode === "repair" && editingId && <form onSubmit={submit} className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="font-black text-amber-950">{form.titulo}</p>
          <label className="mt-4 block text-sm font-bold text-[#25304a]">Nova URL do vídeo no YouTube<input name="url_video" aria-label="Nova URL do vídeo no YouTube" type="url" value={form.url_video} onChange={change} className={fieldClass} required/></label>
          <p className="mt-3 text-xs text-slate-600">Título, descrição, duração, tipo e ordem permanecem inalterados.</p>
          <div className="mt-5 flex flex-wrap justify-end gap-3">
            <button type="button" onClick={reset} disabled={saving} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60">Cancelar</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"><Save size={17}/>{saving ? "Validando vídeo..." : "Validar e salvar URL"}</button>
          </div>
        </form>}
      </div>
      <aside className="h-fit rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black text-[#25304a]">Aulas cadastradas</h2>
        {loading ? <p className="mt-4 text-sm text-slate-500">Carregando aulas...</p> : <ol className="mt-4 space-y-3">{lessons.map((lesson) => {
          const canRepair = mode === "repair" && lesson.tipo === "video" && unavailable.has(lesson.id);
          return <li key={lesson.id} className={`rounded-lg border p-4 ${canRepair ? "border-amber-300 bg-amber-50" : "border-slate-200"}`}>
            <p className="text-xs font-bold uppercase text-blue-600">Aula {lesson.ordem} · {typeLabels[lesson.tipo ?? "video"]}</p>
            <p className="mt-1 font-black text-slate-800">{lesson.titulo}</p>
            {canRepair ? <button type="button" onClick={() => { setEditingId(lesson.id); setForm(toForm(lesson)); setError(""); setStatus(""); }} className="mt-3 inline-flex items-center gap-1 rounded-md border border-amber-300 bg-white px-2.5 py-1.5 text-xs font-bold text-amber-800"><Pencil size={14}/> Corrigir URL</button> : <p className="mt-2 text-xs font-semibold text-emerald-700">Bloqueada para edição</p>}
          </li>;
        })}</ol>}
      </aside>
    </section>;
  }

  return <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
    <form onSubmit={submit} className="rounded-lg border border-blue-100 bg-white p-6 shadow-sm sm:p-8">
      <div className="mb-6 flex items-start justify-between gap-4"><div><p className="text-sm font-bold uppercase text-blue-600">Conteúdo do curso</p><h2 className="mt-1 text-2xl font-black text-[#25304a]">{editingId ? "Editar aula" : "Adicionar aula"}</h2></div>{editingId && <button type="button" onClick={reset} className="inline-flex items-center gap-1 text-sm font-bold text-slate-500"><X size={16}/> Cancelar edição</button>}</div>
      <p className="mb-3 text-sm font-bold text-[#25304a]">Tipo de conteúdo</p>
      <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">{([
        ["video", "Vídeo", Video, false], ["pdf", "PDF", FileText, true], ["link", "Link", Link2, true], ["imagem", "Imagem", ImageIcon, true], ["questionario", "Questionário", ClipboardList, false],
      ] as const).map(([type, label, Icon, disabled]) => <button key={type} type="button" disabled={disabled} onClick={() => setForm((current) => ({ ...current, tipo: type }))} aria-pressed={form.tipo === type} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-bold ${form.tipo === type ? "border-2 border-blue-600 bg-blue-50 text-blue-700" : disabled ? "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400" : "border border-slate-200 text-slate-600"}`}><Icon size={21}/>{label}{disabled && <span className="text-[10px] uppercase">Em breve</span>}</button>)}</div>
      {error && <p role="alert" className="mb-5 rounded-lg bg-red-100 p-4 text-sm font-semibold text-red-700">{error}</p>}{status && <p role="status" className="mb-5 rounded-lg bg-emerald-100 p-4 text-sm font-semibold text-emerald-700">{status}</p>}
      <label className="mb-5 block text-sm font-bold text-[#25304a]">{form.tipo === "questionario" ? "Título do questionário" : "Título da aula"}<input name="titulo" aria-label="Título da aula" value={form.titulo} onChange={change} className={fieldClass} required/></label>
      <label className="mb-5 block text-sm font-bold text-[#25304a]">Descrição da aula<textarea name="descricao" aria-label="Descrição da aula" value={form.descricao} onChange={change} className={`${fieldClass} min-h-24 resize-y`}/></label>
      {form.tipo === "video" ? <div className="grid gap-5 sm:grid-cols-2">
        <label className="sm:col-span-2 text-sm font-bold text-[#25304a]">URL do vídeo no YouTube<input name="url_video" type="url" value={form.url_video} onChange={change} className={fieldClass} required/></label>
        <label className="text-sm font-bold text-[#25304a]">Duração do vídeo (MM:SS)<input name="duracao" aria-label="Duração do vídeo (MM:SS)" pattern="[0-9]+:[0-5][0-9]" value={form.duracao} onChange={change} className={fieldClass} required/></label>
      </div> : <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-3"><label className="text-sm font-bold text-[#25304a]">Nota mínima (%)<input aria-label="Nota mínima (%)" type="number" value={QUIZ_PASS_PERCENTAGE} readOnly className={`${fieldClass} bg-slate-100`}/></label><label className="text-sm font-bold text-[#25304a]">Máximo de tentativas<input aria-label="Máximo de tentativas" type="number" value={QUIZ_MAX_ATTEMPTS} readOnly className={`${fieldClass} bg-slate-100`}/></label><label className="text-sm font-bold text-[#25304a]">Pontos bônus<input name="pontos_base" type="number" min="0" value={form.pontos_base} onChange={change} className={fieldClass}/></label></div>
        {form.perguntas.map((question, qi) => <fieldset key={qi} className="rounded-2xl border border-slate-200 bg-slate-50 p-5"><div className="flex items-center justify-between"><legend className="font-black text-[#25304a]">Pergunta {qi + 1}</legend>{form.perguntas.length > 1 && <button type="button" onClick={() => setForm((current) => ({ ...current, perguntas: current.perguntas.filter((_, i) => i !== qi) }))} className="text-sm font-bold text-red-600">Remover pergunta</button>}</div>
          <label className="mt-4 block text-sm font-bold text-[#25304a]">Enunciado<textarea aria-label={`Enunciado da pergunta ${qi + 1}`} value={question.enunciado} onChange={(event) => updateQuestion(qi, { enunciado: event.target.value })} className={`${fieldClass} min-h-20`} required/></label>
          <label className="mt-4 block max-w-36 text-sm font-bold text-[#25304a]">Pontos<input type="number" min="1" value={question.pontos} onChange={(event) => updateQuestion(qi, { pontos: Number(event.target.value) })} className={fieldClass}/></label>
          <div className="mt-4 space-y-3">{question.alternativas.map((alternative, ai) => <div key={ai} className="flex items-center gap-3"><input type="radio" name={`correta-${qi}`} checked={alternative.correta} onChange={() => setCorrect(qi, ai)} aria-label={`Alternativa correta ${ai + 1} da pergunta ${qi + 1}`}/><input aria-label={`Alternativa ${ai + 1} da pergunta ${qi + 1}`} value={alternative.texto} onChange={(event) => updateAlternative(qi, ai, event.target.value)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2.5" required/>{question.alternativas.length > 2 && <button type="button" aria-label={`Remover alternativa ${ai + 1}`} onClick={() => updateQuestion(qi, { alternativas: question.alternativas.filter((_, i) => i !== ai) })} className="text-red-500"><Trash2 size={17}/></button>}</div>)}</div>
          <button type="button" onClick={() => updateQuestion(qi, { alternativas: [...question.alternativas, { texto: "", correta: false }] })} className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-blue-700"><PlusCircle size={16}/> Adicionar alternativa</button>
        </fieldset>)}
        <button type="button" onClick={() => setForm((current) => ({ ...current, perguntas: [...current.perguntas, newQuestion()] }))} className="inline-flex items-center gap-2 rounded-lg border border-blue-200 px-4 py-2.5 text-sm font-bold text-blue-700"><PlusCircle size={17}/> Adicionar pergunta</button>
      </div>}
      <div className="mt-7 flex justify-end"><button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60">{editingId ? <Save size={19}/> : <PlusCircle size={19}/>} {saving ? "Salvando aula..." : editingId ? "Salvar aula" : "Adicionar aula"}</button></div>
    </form>
    <aside className="h-fit rounded-lg border border-blue-100 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3"><h2 className="text-lg font-black text-[#25304a]">Aulas cadastradas</h2>{lessons.length > 1 && <button type="button" onClick={() => { setOrdering((current) => !current); setDraggingId(null); }} disabled={savingOrder} aria-pressed={ordering} className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-bold transition ${ordering ? "border-blue-600 bg-blue-600 text-white" : "border-blue-200 text-blue-700"}`}><ArrowUpDown size={15}/> {ordering ? "Concluir" : "Ordenar"}</button>}</div>
      {ordering && <p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs font-semibold text-blue-800">Clique e arraste uma aula para cima ou para baixo.</p>}
      {loading ? <p className="mt-4 text-sm text-slate-500">Carregando aulas...</p> : lessons.length === 0 ? <p className="mt-4 text-sm text-slate-500">Nenhuma aula cadastrada.</p> : <ol className="mt-4 space-y-3">{lessons.map((lesson) => <li key={lesson.id} draggable={ordering && !savingOrder} onDragStart={(event: DragEvent<HTMLLIElement>) => { event.dataTransfer.effectAllowed = "move"; setDraggingId(lesson.id); }} onDragOver={(event) => { if (ordering) { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } }} onDrop={(event) => { event.preventDefault(); void dropLesson(lesson.id); }} onDragEnd={() => setDraggingId(null)} className={`rounded-lg border p-4 transition ${ordering ? "cursor-grab select-none border-blue-200 bg-blue-50/40 active:cursor-grabbing" : "border-slate-200"} ${draggingId === lesson.id ? "opacity-50" : "opacity-100"}`}>
        <div className="flex items-start gap-3">{ordering && <div className="flex shrink-0 items-center gap-1"><GripVertical className="text-blue-500" size={19}/><div className="flex flex-col"><button type="button" aria-label={`Mover ${lesson.titulo} para cima`} disabled={lesson.ordem === 1 || savingOrder} onClick={() => void moveLesson(lesson.id, -1)} className="rounded text-blue-600 disabled:opacity-25"><ChevronUp size={16}/></button><button type="button" aria-label={`Mover ${lesson.titulo} para baixo`} disabled={lesson.ordem === lessons.length || savingOrder} onClick={() => void moveLesson(lesson.id, 1)} className="rounded text-blue-600 disabled:opacity-25"><ChevronDown size={16}/></button></div></div>}<div className="min-w-0 flex-1"><p className="text-xs font-bold uppercase text-blue-600">Aula {lesson.ordem} · {typeLabels[lesson.tipo ?? "video"]}</p><p className="mt-1 font-black text-slate-800">{lesson.titulo}</p><p className="mt-1 text-xs text-slate-500">{lesson.tipo === "video" ? formatDigitalDuration(lesson.duracao_segundos) : `${lesson.questionario?.perguntas.length ?? 0} perguntas`}</p>{!ordering && <div className="mt-3 flex gap-2"><button type="button" aria-label={`Editar ${lesson.titulo}`} onClick={() => { setEditingId(lesson.id); setForm(toForm(lesson)); setError(""); }} className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-2.5 py-1.5 text-xs font-bold text-blue-700"><Pencil size={14}/> Editar</button><button type="button" aria-label={`Excluir ${lesson.titulo}`} onClick={() => void remove(lesson)} disabled={deletingId === lesson.id} className="inline-flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-bold text-red-700"><Trash2 size={14}/> {deletingId === lesson.id ? "Excluindo..." : "Excluir"}</button></div>}</div></div>
      </li>)}</ol>}
      {savingOrder && <p className="mt-3 text-xs font-bold text-blue-700">Salvando nova ordem...</p>}
    </aside>
  </section>;
}
