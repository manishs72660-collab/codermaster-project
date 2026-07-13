import { useState } from "react";
import { PenLine } from "lucide-react";
import axiosClient from "../utils/axiosClient";

function AnswerForm({ doubtId, onPosted }) {
  const [content, setContent] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await axiosClient.post(`/doubt/${doubtId}/answer`, {
        content,
        codeSnippet: showCode ? codeSnippet : "",
      });
      setContent("");
      setCodeSnippet("");
      setShowCode(false);
      onPosted();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-5"
    >
      <label className="flex items-center gap-2 text-sm text-white/70 font-semibold mb-3">
        <PenLine className="w-3.5 h-3.5 text-orange-400" />
        Write an answer
      </label>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Explain your approach clearly…"
        className="w-full bg-black/30 border border-white/[0.08] rounded-xl p-3 text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:bg-black/40 transition-all"
      />

      {showCode && (
        <textarea
          value={codeSnippet}
          onChange={(e) => setCodeSnippet(e.target.value)}
          rows={5}
          placeholder="// optional code"
          className="w-full mt-2 bg-black/30 border border-white/[0.08] rounded-xl p-3 text-sm font-mono text-white/80 placeholder:text-white/20 focus:outline-none focus:border-orange-500/40 focus:bg-black/40 transition-all"
        />
      )}

      <div className="flex items-center justify-between mt-4">
        <button
          type="button"
          onClick={() => setShowCode((v) => !v)}
          className="text-xs font-bold text-white/30 hover:text-white/60 transition-colors"
        >
          {showCode ? "− remove code block" : "+ add code block"}
        </button>

        <button
          type="submit"
          disabled={submitting || !content.trim()}
          className="text-sm font-bold px-5 py-2.5 rounded-xl bg-orange-500 text-black hover:bg-orange-400 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none transition-all"
        >
          {submitting ? "Posting…" : "Post answer"}
        </button>
      </div>
    </form>
  );
}

export default AnswerForm;