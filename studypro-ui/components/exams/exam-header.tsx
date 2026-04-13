export function ExamHeader({ title, source, year, totalQuestions }: { title: string; source: string; year: number; totalQuestions: number }) {
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h1 className="text-3xl font-bold text-white">{title}</h1>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-white/70">
        <span className="rounded-full border border-white/15 px-3 py-1">{source.toUpperCase()}</span>
        <span className="rounded-full border border-white/15 px-3 py-1">{year}</span>
        <span className="rounded-full border border-white/15 px-3 py-1">{totalQuestions} questões</span>
      </div>
    </section>
  )
}
