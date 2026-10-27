import { useState, type FormEvent } from "react";
import { Mail, Send } from "lucide-react";
import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";
import { useAuth } from "../context/auth-context";
import { api, getApiErrorMessage } from "../services/api";

const fieldClass = "mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

export default function FeedbackPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (sending) return;
    setError("");
    setSent(false);
    if (!subject.trim() || !message.trim()) {
      setError("Preencha o assunto e a mensagem.");
      return;
    }
    setSending(true);
    try {
      await api.post("/feedback", { subject: subject.trim(), message: message.trim() });
      setSent(true);
      setSubject("");
      setMessage("");
    } catch (reason) {
      setError(getApiErrorMessage(reason));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar user={user} />
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
        <form onSubmit={submit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <Mail className="text-blue-600" size={28} />
          <h1 className="mt-4 text-2xl font-bold text-gray-950">Fale com a instituição</h1>
          <p className="mt-2 text-sm text-gray-600">Envie sua dúvida, sugestão ou comentário por e-mail à nossa equipe.</p>
          <fieldset disabled={sending} className="mt-6 space-y-5">
            <div><label htmlFor="feedback-name" className="text-sm font-semibold text-gray-700">Nome</label>
              <input id="feedback-name" value={user?.name ?? ""} readOnly className={`${fieldClass} bg-gray-50`} /></div>
            <div><label htmlFor="feedback-email" className="text-sm font-semibold text-gray-700">E-mail para resposta</label>
              <input id="feedback-email" type="email" value={user?.email ?? ""} readOnly className={`${fieldClass} bg-gray-50`} /></div>
            <div><label htmlFor="feedback-subject" className="text-sm font-semibold text-gray-700">Assunto</label>
              <input id="feedback-subject" value={subject} maxLength={150} required onChange={(event) => { setSubject(event.target.value); setSent(false); }} className={fieldClass} /></div>
            <div><label htmlFor="feedback-message" className="text-sm font-semibold text-gray-700">Mensagem</label>
              <textarea id="feedback-message" rows={6} value={message} maxLength={5000} required onChange={(event) => { setMessage(event.target.value); setSent(false); }} className={`${fieldClass} resize-y`} /></div>
            <button type="submit" disabled={sending} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"><Send size={18} />{sending ? "Enviando..." : "Enviar mensagem"}</button>
          </fieldset>
          {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-4 text-sm text-red-700">{error}</p>}
          {sent && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">Mensagem enviada à instituição. A equipe poderá responder pelo e-mail da sua conta.</p>}
        </form>
      </main>
      <Footer />
    </div>
  );
}
