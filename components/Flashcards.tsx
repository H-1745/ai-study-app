"use client"

import { useState } from "react"

// ─── Flashcards ────────────────────────────────────────────────────────────────
export default function Flashcards({ content, c }: { content: string; c: any }) {
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Parse cards
  const cards: { q: string; a: string }[] = []

  const blocks = content
    .split("---")
    .map(b => b.trim())
    .filter(Boolean)

  for (const block of blocks) {
    const qm = block.match(/Q:\s*([\s\S]+?)(?=\nA:|$)/)
    const am = block.match(/A:\s*([\s\S]+)/)

    if (qm && am) {
      cards.push({
        q: qm[1].trim(),
        a: am[1].trim(),
      })
    }
  }

  if (!cards.length) {
    return (
      <p style={{ color: c.textMuted, fontSize: 14, textAlign: "center", padding: 40 }}>
        No flashcards found in output.
      </p>
    )
  }

  const card = cards[current]

  return (
    <div>
      {/* Progress */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: c.textMuted }}>
            Card {current + 1} of {cards.length}
          </span>
          <span style={{ fontSize: 12, color: c.textMuted }}>
            {Math.round(((current + 1) / cards.length) * 100)}%
          </span>
        </div>

        <div style={{ height: 4, background: c.border, borderRadius: 4 }}>
          <div
            style={{
              height: 4,
              background: c.accent,
              borderRadius: 4,
              width: `${((current + 1) / cards.length) * 100}%`,
              transition: "width 0.3s",
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div
        onClick={() => setFlipped(f => !f)}
        style={{
          minHeight: 200,
          background: flipped ? c.accentBg : c.panelBg,
          border: `2px solid ${flipped ? c.accentBorder : c.border}`,
          borderRadius: 18,
          padding: "28px 24px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "all 0.2s ease",
          boxShadow: c.shadow,
        }}
      >
        <div>
          <span
            style={{
              display: "inline-block",
              fontSize: 11,
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: flipped ? c.accent : c.textMuted,
              background: flipped ? c.accentBg : c.tagBg,
              border: `1px solid ${flipped ? c.accentBorder : c.border}`,
              padding: "3px 10px",
              borderRadius: 6,
              marginBottom: 14,
            }}
          >
            {flipped ? "Answer" : "Question"}
          </span>

          <p
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: 1.65,
              color: c.text,
              fontWeight: flipped ? 400 : 600,
            }}
          >
            {flipped ? card.a : card.q}
          </p>
        </div>

        <p style={{ margin: "16px 0 0", fontSize: 12, color: c.textMuted, textAlign: "right" }}>
          {flipped ? "tap to see question" : "tap to reveal answer"}
        </p>
      </div>

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button
          onClick={() => {
            setCurrent(c => Math.max(0, c - 1))
            setFlipped(false)
          }}
          disabled={current === 0}
          style={{
            flex: 1,
            padding: "11px",
            borderRadius: 12,
            border: `1.5px solid ${c.border}`,
            background: c.panelBg,
            cursor: current === 0 ? "not-allowed" : "pointer",
            fontSize: 13,
            color: current === 0 ? c.textMuted : c.text,
            fontWeight: 600,
            opacity: current === 0 ? 0.4 : 1,
          }}
        >
          ← Prev
        </button>

        <button
          onClick={() => {
            setCurrent(c => Math.min(cards.length - 1, c + 1))
            setFlipped(false)
          }}
          disabled={current === cards.length - 1}
          style={{
            flex: 1,
            padding: "11px",
            borderRadius: 12,
            border: `1.5px solid ${c.border}`,
            background: c.panelBg,
            cursor: current === cards.length - 1 ? "not-allowed" : "pointer",
            fontSize: 13,
            color: current === cards.length - 1 ? c.textMuted : c.text,
            fontWeight: 600,
            opacity: current === cards.length - 1 ? 0.4 : 1,
          }}
        >
          Next →
        </button>
      </div>

      {/* Dots */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: 6,
          marginTop: 14,
          flexWrap: "wrap",
        }}
      >
        {cards.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrent(i)
              setFlipped(false)
            }}
            style={{
              width: i === current ? 20 : 8,
              height: 8,
              borderRadius: 4,
              border: "none",
              cursor: "pointer",
              background: i === current ? c.accent : c.border,
              transition: "all 0.2s",
            }}
          />
        ))}
      </div>
    </div>
  )
}