import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, Send } from "lucide-react";
import journeyService, { type JourneyLesson, type QuizResult } from "../services/journeyService";

export default function QuizLesson({
  courseId,
  lesson,
  canSubmit,
  onCompleted,
}: {
  courseId: string;
  lesson: JourneyLesson;
  canSubmit: boolean;
  onCompleted: () => void;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const quiz = lesson.questionario;

  useEffect(() => {
    setAnswers({});
    setResult(null);
    setError("");
  }, [lesson.id]);

  if (!quiz) return <div className="p-8 text-center text-slate-500">Questionário indisponível.</div>;

  const submit = async () => {
    if (Object.keys(answers).length !== quiz.perguntas.length) {
      setError("Responda todas as perguntas antes de finalizar.");
      return;
    }
    setSending(true); setError("");
    try {
      const response = await journeyService.submitQuiz(
        courseId,
        lesson.id,
        quiz.perguntas.map((question) => ({ pergunta_id: question.id, alternativa_id: answers[question.id] })),
      );
      setResult(response);
      if (response.aprovado) onCompleted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível enviar o questionário.");
    } finally { setSending(false); }
  };

  return <div className="space-y-5 bg-slate-50 p-5 sm:p-7">
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-900">
      <strong>Critério de aprovação:</strong> {quiz.nota_minima}%
      {quiz.max_tentativas ? ` · Até ${quiz.max_tentativas} tentativas` : " · Tentativas ilimitadas"}
    </div>
    {quiz.perguntas.map((question, questionIndex) => {
      const graded = result?.respostas.find((item) => item.pergunta_id === question.id);
      return <fieldset key={question.id} className="rounded-2xl border border-slate-200 bg-white p-5">
        <legend className="px-2 font-black text-[#25304a]">{questionIndex + 1}. {question.enunciado}</legend>
        <div className="mt-4 space-y-2">{question.alternativas.map((alternative) => {
          const selected = answers[question.id] === alternative.id;
          const answerKeyMatch = graded?.alternativa_correta_id === alternative.id;
          const correctSelected = Boolean(result && selected && graded?.correta);
          const wrongSelected = Boolean(result && selected && graded?.correta === false);
          return <label key={alternative.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm font-semibold ${answerKeyMatch || correctSelected ? "border-emerald-300 bg-emerald-50 text-emerald-800" : wrongSelected ? "border-red-300 bg-red-50 text-red-700" : selected ? "border-blue-400 bg-blue-50 text-blue-800" : "border-slate-200 bg-white text-slate-700"}`}>
            <input type="radio" name={`question-${question.id}`} checked={selected} disabled={!canSubmit || Boolean(result)} onChange={() => setAnswers((current) => ({ ...current, [question.id]: alternative.id }))}/>
            {alternative.texto}
          </label>;
        })}</div>
      </fieldset>;
    })}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p>}
    {result && <div className={`rounded-2xl border p-5 ${result.aprovado ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-amber-200 bg-amber-50 text-amber-900"}`}>
      <div className="flex items-center gap-2 font-black"><CheckCircle2 size={20}/>{result.aprovado ? "Aprovado" : "Tente novamente"}</div>
      <p className="mt-2 text-sm">{result.acertos} de {result.total_perguntas} respostas corretas · {result.percentual}% · {result.pontos_obtidos} pontos</p>
      {!result.aprovado && result.tentativas_restantes > 0 && <p className="mt-2 text-sm font-bold">Você ainda possui {result.tentativas_restantes} {result.tentativas_restantes === 1 ? "tentativa" : "tentativas"}. O gabarito permanece oculto.</p>}
      {!result.aprovado && result.gabarito_disponivel && <p className="mt-2 text-sm font-bold">As 3 tentativas foram utilizadas. O gabarito foi liberado.</p>}
    </div>}
    {canSubmit && (!result || (!result.aprovado && result.tentativas_restantes > 0)) && <button type="button" onClick={result ? () => { setResult(null); setAnswers({}); } : () => void submit()} disabled={sending} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60">{result ? <RotateCcw size={18}/> : <Send size={18}/>} {result ? "Nova tentativa" : sending ? "Enviando..." : "Finalizar questionário"}</button>}
  </div>;
}
