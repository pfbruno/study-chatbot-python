"use client"

export function CorrectionButton({ onSubmit, disabled }: { onSubmit: () => void; disabled?: boolean }) {
  return (
    <button onClick={onSubmit} disabled={disabled} className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black disabled:opacity-50">
      Corrigir prova
    </button>
  )
}
