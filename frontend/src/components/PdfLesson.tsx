import { useEffect, useState } from "react";
import journeyService from "../services/journeyService";

interface Props {
  courseId: string;
  lessonId: string;
  filename: string;
  canComplete: boolean;
  onCompleted: () => void | Promise<void>;
}

export default function PdfLesson({ courseId, lessonId, filename, canComplete, onCompleted }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setUrl(null);
    setLoading(true);
    setError("");
    journeyService.getLessonPdf(courseId, lessonId)
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch((reason: unknown) => {
        if (!cancelled) setError(reason instanceof Error ? reason.message : "Não foi possível carregar o PDF.");
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [courseId, lessonId]);

  const complete = async () => {
    setSaving(true);
    setError("");
    try {
      await journeyService.completePdfLesson(courseId, lessonId);
      await onCompleted();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Não foi possível concluir a aula.");
    } finally {
      setSaving(false);
    }
  };

  return <div className="bg-white p-4 sm:p-6">
    {loading && <p role="status" className="py-16 text-center text-slate-600">Carregando PDF...</p>}
    {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">{error}</p>}
    {url && <>
      <iframe title={`PDF da aula: ${filename}`} src={url} className="h-[70vh] min-h-96 w-full rounded-lg border border-slate-200" />
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <a href={url} download={filename} className="font-bold text-blue-700 underline">Baixar PDF</a>
        {canComplete && <button type="button" onClick={() => void complete()} disabled={saving} className="rounded-lg bg-blue-600 px-5 py-3 font-bold text-white disabled:opacity-60">{saving ? "Concluindo..." : "Li o PDF — concluir aula"}</button>}
      </div>
    </>}
  </div>;
}
