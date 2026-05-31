"use client"

import { useState } from "react"

type QuizQuestion = {
  question: string
  options: string[]
  answer: string
  explanation: string
}

export default function Quiz({ questions, c }: { questions: QuizQuestion[]; c: any }) {
  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  if (!questions?.length) {
    return (
      <p style={{ color: c.textMuted, fontSize: 14, textAlign: "center", padding: 40 }}>
        No quiz questions available.
      </p>
    )
  }

  const question = questions[current]
  const isCorrect = selected === question.answer

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 18 }}>
        <div>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: c.text }}>Question {current + 1} of {questions.length}</p>
          <p style={{ margin: "6px 0 0", fontSize: 12, color: c.textMuted }}>{Math.round(((current + 1) / questions.length) * 100)}% complete</p>
        </div>
        <div style={{ minWidth: 96, padding: "8px 12px", borderRadius: 999, background: c.tagBg, color: c.text, fontSize: 12, fontWeight: 700, textAlign: "center" }}>
          {selected ? (isCorrect ? "Correct" : "Incorrect") : "Select an answer"}
        </div>
      </div>

      <div style={{ padding: 24, borderRadius: 20, border: `1px solid ${c.border}`, background: c.quizCard, boxShadow: c.shadow, marginBottom: 22 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: c.textMuted, textTransform: "uppercase", letterSpacing: "0.08em" }}>Prompt</p>
        <p style={{ margin: "10px 0 0", fontSize: 18, lineHeight: 1.7, color: c.text }}>{question.question}</p>
      </div>

      <div style={{ display: "grid", gap: 12, marginBottom: 22 }}>
        {question.options.map(option => {
          const isSelected = selected === option
          const isCorrectAnswer = selected && option === question.answer
          const isWrongSelection = selected === option && !isCorrect

          return (
            <button
              key={option}
              onClick={() => selected || setSelected(option)}
              disabled={Boolean(selected)}
              style={{
                width: "100%",
                textAlign: "left",
                padding: "16px 18px",
                borderRadius: 16,
                border: `1.5px solid ${isSelected ? c.accent : c.border}`,
                background: isSelected ? c.selectedBg : c.optionBg,
                color: c.optionText,
                fontSize: 14,
                fontWeight: 600,
                cursor: selected ? "not-allowed" : "pointer",
                boxShadow: isSelected ? `0 0 0 1px ${c.selectedBorder}` : "none",
                opacity: selected && !isSelected ? 0.8 : 1,
              }}
            >
              {option}
            </button>
          )
        })}
      </div>

      {selected && (
        <div style={{ padding: 18, borderRadius: 18, background: c.selectedBg, border: `1px solid ${isCorrect ? c.successBorder : c.errorBorder}`, marginBottom: 22 }}>
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: isCorrect ? c.successText : c.errorText }}>
            {isCorrect ? "Good job!" : "Not quite."}
          </p>
          <p style={{ margin: "8px 0 0", fontSize: 14, color: c.text, lineHeight: 1.7 }}>
            The correct answer is <strong>{question.answer}</strong>.
          </p>
          <p style={{ margin: "12px 0 0", fontSize: 13, color: c.textMuted, lineHeight: 1.7 }}>
            {question.explanation}
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => {
            setCurrent(i => Math.max(0, i - 1))
            setSelected(null)
          }}
          disabled={current === 0}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 14,
            border: `1.5px solid ${c.border}`,
            background: c.panelBg,
            color: current === 0 ? c.textMuted : c.text,
            cursor: current === 0 ? "not-allowed" : "pointer",
            fontWeight: 700,
            opacity: current === 0 ? 0.5 : 1,
          }}
        >
          ← Previous
        </button>

        <button
          onClick={() => {
            setCurrent(i => Math.min(questions.length - 1, i + 1))
            setSelected(null)
          }}
          disabled={current === questions.length - 1}
          style={{
            flex: 1,
            padding: "12px 16px",
            borderRadius: 14,
            border: "none",
            background: current === questions.length - 1 ? c.border : c.accent,
            color: current === questions.length - 1 ? c.textMuted : "#fff",
            cursor: current === questions.length - 1 ? "not-allowed" : "pointer",
            fontWeight: 700,
            opacity: current === questions.length - 1 ? 0.5 : 1,
          }}
        >
          Next →
        </button>
      </div>
    </div>
  )
}
