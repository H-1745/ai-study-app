"use client"
// app/page.tsx
import Flashcards from "@/components/Flashcards"
import Quiz from "@/components/Quiz"
import ReactMarkdown from "react-markdown"
import { useState, useRef, useEffect } from "react"


type Mode = "notes" | "flashcards" | "quiz"
type Theme = "light" | "dark"

interface QuizQuestion {
  question: string
  options: string[]
  answer: string
  explanation: string
}

interface StudyResult {
  mode: Mode
  content?: string
  questions?: QuizQuestion[]
  raw?: string
  filename?: string
  extractedText?: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
}

// ─── Theme tokens ──────────────────────────────────────────────────────────────
const T = {
  light: {
    bg: "#f6f8fc",
    panelBg: "#ffffff",
    border: "#e8edf3",
    text: "#0f172a",
    textSub: "#475569",
    textMuted: "#94a3b8",
    accent: "#2563eb",
    accentBg: "#eff6ff",
    accentBorder: "#bfdbfe",
    inputBg: "#f8fafc",
    userBubble: "#2563eb",
    userText: "#ffffff",
    aiBubble: "#f1f5f9",
    aiText: "#1e293b",
    tagBg: "#f1f5f9",
    h1Color: "#0f172a",
    h2Color: "#1e40af",
    h2Important: "#92400e",
    h2Summary: "#0c4a6e",
    h2Terms: "#3b0764",
    bullet1: "#3b82f6",
    bullet2: "#94a3b8",
    bullet3: "#64748b",
    boldColor: "#0f172a",
    successBg: "#f0fdf4",
    successBorder: "#86efac",
    successText: "#15803d",
    errorBg: "#fef2f2",
    errorBorder: "#fca5a5",
    errorText: "#dc2626",
    quizCard: "#ffffff",
    quizCardBorder: "#e8edf3",
    selectedBg: "#eff6ff",
    selectedBorder: "#93c5fd",
    selectedText: "#1d4ed8",
    optionBg: "#f8fafc",
    optionBorder: "#e8edf3",
    optionText: "#334155",
    tabActive: "#2563eb",
    tabInactive: "#94a3b8",
    tabBorder: "#e8edf3",
    shadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)",
    switchBg: "#e2e8f0",
    switchThumb: "#fff",
    drawerBg: "#ffffff",
  },
  dark: {
    bg: "#0e1117",
    panelBg: "#161b26",
    border: "#252d3d",
    text: "#f1f5f9",
    textSub: "#fcfcfc",
    textMuted: "#ffffff",
    accent: "#111a28",
    accentBg: "#1e2d4a",
    accentBorder: "#2d4a7a",
    inputBg: "#1e2535",
    userBubble: "#2563eb",
    userText: "#ffffff",
    aiBubble: "#1e2535",
    aiText: "#ffffff",
    tagBg: "#1e2535",
    h1Color: "#f1f5f9",
    h2Color: "#93c5fd",
    h2Important: "#fcd34d",
    h2Summary: "#67e8f9",
    h2Terms: "#c4b5fd",
    bullet1: "#60a5fa",
    bullet2: "#475569",
    bullet3: "#64748b",
    boldColor: "#e2e8f0",
    successBg: "#052e16",
    successBorder: "#166534",
    successText: "#4ade80",
    errorBg: "#1f0000",
    errorBorder: "#991b1b",
    errorText: "#f87171",
    quizCard: "#1a2035",
    quizCardBorder: "#252d3d",
    selectedBg: "#1e2d4a",
    selectedBorder: "#3b82f6",
    selectedText: "#93c5fd",
    optionBg: "#1a2035",
    optionBorder: "#252d3d",
    optionText: "#cbd5e1",
    tabActive: "#3b82f6",
    tabInactive: "#475569",
    tabBorder: "#252d3d",
    shadow: "0 1px 3px rgba(0,0,0,0.3), 0 4px 16px rgba(0,0,0,0.2)",
    switchBg: "#3b82f6",
    switchThumb: "#fff",
    drawerBg: "#161b26",
  },
}

// ─── Rich Notes Renderer ───────────────────────────────────────────────────────
function NotesRenderer({ content, c }: { content: string; c: typeof T.light }) {
  return (
  <div
 className="
prose prose-invert max-w-none
prose-p:mb-4
prose-headings:mt-6
prose-headings:mb-3
prose-ul:pl-6
prose-li:mb-1
"
  style={{
    color: c.text,
    fontSize: 14,
    lineHeight: 1.7,
  }}
>
  <ReactMarkdown>{content}</ReactMarkdown>
</div>
  )
}



// ─── Chat ──────────────────────────────────────────────────────────────────────
function ChatPanel({ documentContext, filename, c }: { documentContext?: string; filename?: string; c: typeof T.light }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{
    role: "assistant",
    content: documentContext
      ? `Hi! I've read "${filename || "your document"}". Ask me anything — I can explain concepts, clarify sections, or test you on what you've read.`
      : "Hi! I'm your study assistant. Upload a document first, or just ask me any study question!"
  }])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: "user", content: input.trim() }
    setMessages(m => [...m, userMsg])
    setInput("")
    setLoading(true)
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMsg], documentContext }),
      })
      const data = await res.json()
      setMessages(m => [...m, { role: "assistant", content: data.message || data.error || "Something went wrong." }])
    } catch {
      setMessages(m => [...m, { role: "assistant", content: "Connection error. Please try again." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 10, paddingBottom: 8 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.accentBg, border: `1px solid ${c.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, marginRight: 8, marginTop: 2 }}>🤖</div>
            )}
            <div style={{
              maxWidth: "82%",
              padding: "10px 14px",
              borderRadius:
                msg.role === "user"
                  ? "18px 18px 4px 18px"
                  : "18px 18px 18px 4px",
              background: msg.role === "user" ? c.userBubble : c.aiBubble,
              color: msg.role === "user" ? c.userText : c.aiText,
              fontSize: 13.5,
              lineHeight: 1.6,
            }}>
              <div style={{ color: c.text, fontSize: 13.5, lineHeight: 1.8 }}>
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: c.accentBg, border: `1px solid ${c.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🤖</div>
            <div style={{ padding: "10px 16px", borderRadius: "18px 18px 18px 4px", background: c.aiBubble, fontSize: 13, color: c.textMuted }}>
              <span style={{ display: "inline-flex", gap: 4 }}>
                <span style={{ animation: "bounce 1s infinite" }}>●</span>
                <span style={{ animation: "bounce 1s infinite 0.2s" }}>●</span>
                <span style={{ animation: "bounce 1s infinite 0.4s" }}>●</span>
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: `1px solid ${c.border}`, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && send()}
          placeholder={documentContext ? "Ask about the document..." : "Ask any study question..."}
          style={{ flex: 1, padding: "11px 14px", borderRadius: 12, border: `1.5px solid ${c.border}`, fontSize: 13.5, outline: "none", color: c.text, background: c.inputBg, fontFamily: "inherit" }}
        />
        <button onClick={send} disabled={loading || !input.trim()}
          style={{ padding: "11px 18px", borderRadius: 12, border: "none", background: loading || !input.trim() ? c.border : c.accent, color: loading || !input.trim() ? c.textMuted : "#fff", fontSize: 13, fontWeight: 700, cursor: loading || !input.trim() ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
          Send
        </button>
      </div>
    </div>
  )
}

// ─── Main App ──────────────────────────────────────────────────────────────────
export default function StudyAI() {
  const [theme, setTheme] = useState<Theme>("light")
  const [file, setFile] = useState<File | null>(null)
  const [mode, setMode] = useState<Mode>("notes")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<StudyResult | null>(null)
  const [error, setError] = useState("")
  const [dragOver, setDragOver] = useState(false)
  const [sidebarTab, setSidebarTab] = useState<"result" | "chat">("result")
  const [drawerOpen, setDrawerOpen] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const c = T[theme]

  const handleFile = (f: File) => {
    const name = f.name.toLowerCase()
    if (!name.endsWith(".pdf") && !name.endsWith(".ppt") && !name.endsWith(".pptx")) {
      setError("Only PDF and PPT/PPTX files are supported."); return
    }
    setFile(f); setError(""); setResult(null)
  }

  const handleSubmit = async () => {
    if (!file) { setError("Please upload a file first."); return }
    setLoading(true); setError(""); setResult(null)
    const form = new FormData()
    form.append("file", file)
    form.append("mode", mode)
    try {
      const res = await fetch("/api/study", { method: "POST", body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Something went wrong")
      setResult(data)
      setSidebarTab("result")
      setDrawerOpen(true)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const modes: { id: Mode; icon: string; label: string; desc: string }[] = [
    { id: "notes", icon: "📄", label: "Structured Notes", desc: "Detailed notes with real headings" },
    { id: "flashcards", icon: "🃏", label: "Flashcards", desc: "10 tap-to-flip study cards" },
    { id: "quiz", icon: "❓", label: "Quiz", desc: "6 multiple-choice questions" },
  ]

  const ResultContent = () => {
    if (!result) return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 16, color: c.textMuted, padding: 40 }}>
        <span style={{ fontSize: 48 }}>📚</span>
        <p style={{ fontSize: 14, margin: 0, textAlign: "center", lineHeight: 1.6, color: c.textMuted }}>Generate study material to see your notes, flashcards, or quiz here</p>
      </div>
    )
    if (result.mode === "notes" && result.content) return <NotesRenderer content={result.content} c={c} />
    if (result.mode === "flashcards" && result.content) return <Flashcards content={result.content} c={c} />
    if (result.mode === "quiz") {
      if (result.questions?.length) return <Quiz questions={result.questions} c={c} />
      return <p style={{ color: c.errorText, fontSize: 13 }}>Could not parse quiz. Raw: {result.raw?.slice(0, 200)}</p>
    }
    return null
  }

  const SidebarPanel = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${c.tabBorder}`, marginBottom: 18, flexShrink: 0 }}>
        {(["result", "chat"] as const).map(tab => {
          const labels = {
            result: result ? (result.mode === "notes" ? "📄 Notes" : result.mode === "flashcards" ? "🃏 Flashcards" : "❓ Quiz") : "📚 Results",
            chat: "💬 Chat"
          }
          return (
            <button key={tab} onClick={() => setSidebarTab(tab)}
              style={{
                flex: 1, padding: "12px 8px", border: "none", background: "transparent",
                borderBottom: sidebarTab === tab ? `2.5px solid ${c.tabActive}` : `2.5px solid transparent`,
                fontSize: 13, fontWeight: sidebarTab === tab ? 700 : 500,
                color: sidebarTab === tab ? c.tabActive : c.tabInactive,
                cursor: "pointer", transition: "all 0.15s",
              }}>
              {labels[tab]}
            </button>
          )
        })}
      </div>
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {sidebarTab === "result" ? <ResultContent /> : <ChatPanel documentContext={result?.extractedText} filename={result?.filename} c={c} />}
      </div>
    </div>
  )

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; }
        body { font-family: 'DM Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${c.border}; border-radius: 6px; }
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-5px)} }

        .app-root { display:flex; height:100dvh; background:${c.bg}; overflow:hidden; }
        .left-col { width:380px; min-width:300px; flex-shrink:0; display:flex; flex-direction:column; background:${c.panelBg}; border-right:1px solid ${c.border}; overflow-y:auto; padding:24px 20px 32px; }
        .right-col { flex:1; display:flex; flex-direction:column; padding:20px; overflow:hidden; min-width:0; }
        .right-inner { flex:1; display:flex; flex-direction:column; background:${c.panelBg}; border-radius:20px; border:1px solid ${c.border}; padding:24px; overflow:hidden; box-shadow:${c.shadow}; }
        .mobile-fab { display:none; }
        .drawer-overlay { display:none; }
        .drawer { display:none; }

        @media (max-width:768px) {
          .app-root { flex-direction:column; }
          .left-col { width:100%; flex-shrink:0; overflow-y:visible; height:auto; max-height:70dvh; overflow-y:auto; border-right:none; border-bottom:1px solid ${c.border}; padding:20px 16px 24px; }
          .right-col { display:none; }
          .mobile-fab { display:flex; position:fixed; bottom:16px; left:50%; transform:translateX(-50%); z-index:60; gap:10px; }
          .drawer { display:block; position:fixed; bottom:0; left:0; right:0; z-index:100; background:${c.drawerBg}; border-radius:24px 24px 0 0; box-shadow:0 -8px 40px rgba(0,0,0,0.18); height:88dvh; padding:20px 16px 24px; transform:translateY(100%); transition:transform 0.32s cubic-bezier(0.32,0.72,0,1); }
          .drawer.open { transform:translateY(0); }
          .drawer-overlay { display:block; position:fixed; inset:0; z-index:90; background:rgba(0,0,0,0.45); opacity:0; pointer-events:none; transition:opacity 0.2s; }
          .drawer-overlay.open { opacity:1; pointer-events:auto; }
        }
      `}</style>

      <div className="app-root">
        {/* ── Left column ── */}
        <div className="left-col">
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h1 style={{ fontFamily: "'DM Serif Display', Georgia, serif", fontSize: 20, color: c.text, letterSpacing: "-0.02em" }}>StudyAI</h1>
              <p style={{ fontSize: 12, color: c.textMuted, marginTop: 2 }}>Turn documents into study tools</p>
            </div>
            {/* Dark mode toggle */}
            <button onClick={() => setTheme(t => t === "light" ? "dark" : "light")}
              title={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
              style={{
                width: 52, height: 28, borderRadius: 14, border: "none", cursor: "pointer",
                background: theme === "dark" ? c.accent : c.switchBg,
                position: "relative", transition: "background 0.2s", flexShrink: 0,
              }}>
              <div style={{
                width: 22, height: 22, borderRadius: "50%", background: c.switchThumb,
                position: "absolute", top: 3, transition: "left 0.2s",
                left: theme === "dark" ? 27 : 3,
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
              }}>
                {theme === "dark" ? "🌙" : "☀️"}
              </div>
            </button>
          </div>

          {/* Upload zone */}
          <div
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? c.accent : c.border}`,
              borderRadius: 16, padding: "20px 16px", textAlign: "center", cursor: "pointer",
              marginBottom: 22, background: dragOver ? c.accentBg : c.inputBg,
              transition: "all 0.15s",
            }}>
            <input ref={fileRef} type="file" accept=".pdf,.ppt,.pptx" style={{ display: "none" }} onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {file ? (
              <div>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: c.accentBg, border: `1px solid ${c.accentBorder}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 22 }}>
                  {file.name.endsWith(".pdf") ? "📄" : "📊"}
                </div>
                <p style={{ fontWeight: 700, fontSize: 13.5, color: c.text, margin: "0 0 3px" }}>{file.name}</p>
                <p style={{ fontSize: 12, color: c.textMuted }}>{(file.size / 1024).toFixed(0)} KB · tap to change</p>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 30, marginBottom: 8 }}>☁️</div>
                <p style={{ fontWeight: 700, fontSize: 13.5, color: c.text, margin: "0 0 3px" }}>Drop your PDF or PPT</p>
                <p style={{ fontSize: 12, color: c.textMuted }}>or click to browse · PDF, PPT, PPTX</p>
              </div>
            )}
          </div>

          {/* Mode picker */}
          <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: c.textMuted, marginBottom: 10 }}>What do you need?</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 22 }}>
            {modes.map(m => (
              <button key={m.id} onClick={() => setMode(m.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 14,
                  border: mode === m.id ? `2px solid ${c.accent}` : `1.5px solid ${c.border}`,
                  background: mode === m.id ? c.accentBg : c.panelBg,
                  cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{m.icon}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13.5, fontWeight: 700, color: mode === m.id ? c.accent : c.text, margin: 0 }}>{m.label}</p>
                  <p style={{ fontSize: 12, color: c.textMuted, margin: "2px 0 0" }}>{m.desc}</p>
                </div>
                {mode === m.id && <span style={{ color: c.accent, fontSize: 16, fontWeight: 700 }}>✓</span>}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div style={{ padding: "10px 12px", background: c.errorBg, border: `1px solid ${c.errorBorder}`, borderRadius: 10, marginBottom: 14, fontSize: 13, color: c.errorText }}>
              ⚠ {error}
            </div>
          )}

          {/* Generate button */}
          <button onClick={handleSubmit} disabled={loading || !file}
            style={{
              width: "100%", padding: "14px", borderRadius: 14, border: "none",
              background: loading || !file ? c.border : c.accent,
              color: loading || !file ? c.textMuted : "#fff",
              fontSize: 14, fontWeight: 800, cursor: loading || !file ? "not-allowed" : "pointer",
              transition: "all 0.15s", letterSpacing: "-0.01em",
            }}>
            {loading ? "⏳  Analyzing document..." : `✨  Generate ${modes.find(m => m.id === mode)?.label}`}
          </button>
        </div>

        {/* ── Right column (desktop) ── */}
        <div className="right-col">
          <div className="right-inner">
            <SidebarPanel />
          </div>
        </div>

        {/* ── Mobile FAB buttons ── */}
        <div className="mobile-fab">
          {result && (
            <button onClick={() => { setSidebarTab("result"); setDrawerOpen(true) }}
              style={{ padding: "13px 22px", borderRadius: 50, border: "none", background: c.accent, color: "#fff", fontSize: 14, fontWeight: 800, cursor: "pointer", boxShadow: "0 4px 20px rgba(37,99,235,0.4)" }}>
              View {result.mode === "notes" ? "Notes" : result.mode === "flashcards" ? "Cards" : "Quiz"}
            </button>
          )}
          <button onClick={() => { setSidebarTab("chat"); setDrawerOpen(true) }}
            style={{ padding: "13px 20px", borderRadius: 50, border: `2px solid ${c.border}`, background: c.panelBg, fontSize: 14, cursor: "pointer", color: c.text, fontWeight: 700, boxShadow: c.shadow }}>
            💬 Chat
          </button>
        </div>

        {/* ── Mobile drawer ── */}
        <div className={`drawer-overlay ${drawerOpen ? "open" : ""}`} onClick={() => setDrawerOpen(false)} />
        <div className={`drawer ${drawerOpen ? "open" : ""}`}>
          <div style={{ width: 40, height: 4, background: c.border, borderRadius: 4, margin: "0 auto 16px" }} />
          <SidebarPanel />
        </div>
      </div>
    </>
  )
}
