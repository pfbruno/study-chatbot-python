"use client"

export function ExamViewer({
  days,
  selectedDayId,
  selectedBookletId,
  onSelectDay,
  onSelectBooklet,
}: {
  days: Array<{ id: number; label: string; day_order: number; booklets: Array<{ id: number; color: string; pdf_url: string | null; official_page_url: string | null }> }>
  selectedDayId: number | null
  selectedBookletId: number | null
  onSelectDay: (dayId: number) => void
  onSelectBooklet: (bookletId: number) => void
}) {
  const selectedDay = days.find((day) => day.id === selectedDayId) ?? days[0]
  const selectedBooklet = selectedDay?.booklets.find((booklet) => booklet.id === selectedBookletId) ?? selectedDay?.booklets[0]

  return (
    <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-xl font-semibold text-white">Visualizador da prova</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {days.map((day) => (
          <button key={day.id} onClick={() => onSelectDay(day.id)} className={`rounded-xl px-4 py-2 text-sm ${selectedDay?.id === day.id ? "bg-primary text-white" : "border border-white/15 text-white/70"}`}>
            {day.label}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(selectedDay?.booklets ?? []).map((booklet) => (
          <button key={booklet.id} onClick={() => onSelectBooklet(booklet.id)} className={`rounded-xl px-4 py-2 text-sm ${selectedBooklet?.id === booklet.id ? "bg-emerald-500 text-black" : "border border-white/15 text-white/70"}`}>
            Caderno {booklet.color}
          </button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {selectedBooklet?.pdf_url ? <a target="_blank" rel="noreferrer" href={selectedBooklet.pdf_url} className="rounded-xl bg-white/10 px-4 py-2 text-sm text-white">Abrir PDF</a> : null}
        {selectedBooklet?.official_page_url ? <a target="_blank" rel="noreferrer" href={selectedBooklet.official_page_url} className="rounded-xl border border-white/20 px-4 py-2 text-sm text-white/80">Página oficial</a> : null}
      </div>
    </section>
  )
}
