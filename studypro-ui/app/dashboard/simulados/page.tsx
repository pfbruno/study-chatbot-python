"use client"

import { useEffect, useState } from "react"
import { Loader2, Play } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getExamTypes } from "@/lib/api"

const API_URL = process.env.NEXT_PUBLIC_API_URL

export default function SimuladosPage() {
  const [examTypes, setExamTypes] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState("")
  const [selectedYear, setSelectedYear] = useState("")
  const [questionCount, setQuestionCount] = useState(10)
  const [mode, setMode] = useState("balanced")
  const [subjects, setSubjects] = useState<string[]>([])

  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [simulation, setSimulation] = useState<any>(null)

  // carregar provas
  useEffect(() => {
    async function load() {
      const data = await getExamTypes()
      setExamTypes(data.exam_types || [])
      setLoading(false)
    }
    load()
  }, [])

  // carregar disciplinas
  async function loadSubjects(exam: string, year: string) {
    const res = await fetch(`${API_URL}/simulados/config/${exam}/${year}`)
    const data = await res.json()

    const subjectNames = data.subjects.map((s: any) => s.name)
    setSubjects(subjectNames)
  }

  // gerar simulado
  async function generateSimulation() {
    setGenerating(true)

    const res = await fetch(`${API_URL}/simulados/random`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        exam_type: selectedExam,
        year: Number(selectedYear),
        question_count: questionCount,
        subjects: subjects,
        mode: mode,
      }),
    })

    const data = await res.json()
    setSimulation(data)
    setGenerating(false)
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    )
  }

  const selectedExamData = examTypes.find((e) => e.key === selectedExam)

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Simulados</h1>

      {/* CONFIG */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar simulado</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* prova */}
          <select
            className="w-full p-2 bg-black border rounded"
            onChange={(e) => {
              setSelectedExam(e.target.value)
              setSelectedYear("")
            }}
          >
            <option value="">Escolha a prova</option>
            {examTypes.map((exam) => (
              <option key={exam.key} value={exam.key}>
                {exam.label}
              </option>
            ))}
          </select>

          {/* ano */}
          {selectedExamData && (
            <select
              className="w-full p-2 bg-black border rounded"
              onChange={(e) => {
                setSelectedYear(e.target.value)
                loadSubjects(selectedExam, e.target.value)
              }}
            >
              <option value="">Escolha o ano</option>
              {selectedExamData.years.map((year: any) => (
                <option key={year.year} value={year.year}>
                  {year.year}
                </option>
              ))}
            </select>
          )}

          {/* quantidade */}
          <input
            type="number"
            value={questionCount}
            onChange={(e) => setQuestionCount(Number(e.target.value))}
            className="w-full p-2 bg-black border rounded"
          />

          {/* modo */}
          <select
            className="w-full p-2 bg-black border rounded"
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="balanced">Equilibrado por matéria</option>
            <option value="random">Aleatório</option>
          </select>

          {/* disciplinas */}
          {subjects.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {subjects.map((subj) => (
                <button
                  key={subj}
                  onClick={() =>
                    setSubjects((prev) =>
                      prev.includes(subj)
                        ? prev.filter((s) => s !== subj)
                        : [...prev, subj]
                    )
                  }
                  className="px-3 py-1 border rounded text-sm"
                >
                  {subj}
                </button>
              ))}
            </div>
          )}

          {/* botão */}
          <button
            onClick={generateSimulation}
            disabled={!selectedExam || !selectedYear || generating}
            className="w-full bg-blue-600 p-3 rounded flex items-center justify-center gap-2"
          >
            {generating ? <Loader2 className="animate-spin" /> : <Play />}
            Gerar simulado
          </button>
        </CardContent>
      </Card>

      {/* RESULTADO */}
      {simulation && (
        <Card>
          <CardHeader>
            <CardTitle>Simulado gerado</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {simulation.questions.map((q: any, index: number) => (
              <div key={index} className="border p-3 rounded">
                <p className="font-bold">
                  {q.number} - {q.subject}
                </p>
                <p className="text-sm">{q.statement}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}