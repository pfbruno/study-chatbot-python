"use client"

const OPTIONS = ["A", "B", "C", "D", "E"]

export function AnswerSheet({ answers, onChange }: { answers: Array<string | null>; onChange: (index: number, value: string) => void }) {
  const answered = answers.filter(Boolean).length
  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-semibold text-white">Folha de respostas</h2>
      <p className="mt-2 text-sm text-white/60">Respondidas {answered} · Em branco {answers.length - answered} · Total {answers.length}</p>
      <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
        {answers.map((value, index) => (
          <div key={index} className="rounded-xl border border-white/10 p-3">
            <p className="text-xs text-white/60">Questão {index + 1}</p>
            <div className="mt-2 flex gap-1">
              {OPTIONS.map((opt) => (
                <button key={opt} onClick={() => onChange(index, opt)} className={`h-8 w-8 rounded-full text-xs ${value === opt ? "bg-primary text-white" : "border border-white/20 text-white/70"}`}>
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
