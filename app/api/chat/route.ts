// app/api/chat/route.ts
// Handles AI chat about the uploaded document

import { NextResponse } from "next/server"
import OpenAI from "openai"

export const runtime = "nodejs"

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in .env.local")
  return new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" })
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { messages, documentContext } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Invalid messages" }, { status: 400 })
    }

    const client = getGroqClient()

   const systemPrompt = documentContext
  ? `You are an intelligent AI study assistant similar to ChatGPT.

The user has uploaded a document and you help them understand it naturally.

DOCUMENT:
---
${documentContext.slice(0, 8000)}
---

RESPONSE STYLE:
- Write answers in well-structured paragraphs.
- Sound conversational, natural, and human-like.
- Explain concepts clearly instead of giving short bullet replies.
- Use spacing between paragraphs for readability.
- When useful, include examples or analogies.
- If the user asks a direct question, answer first, then explain.
- Keep formatting clean like ChatGPT responses.
- Use markdown formatting where appropriate:
  - **bold** for important terms
  - bullet points only when needed
  - short sections with headings if helpful
- Never sound robotic or overly brief.
- If information is not in the document, clearly say that.

Your goal is to teach and explain naturally like ChatGPT.`

  : `You are an intelligent AI study assistant similar to ChatGPT.

RESPONSE STYLE:
- Write detailed paragraph-style answers.
- Be conversational and natural.
- Explain concepts step-by-step when needed.
- Use clean markdown formatting.
- Add spacing between ideas for readability.
- Avoid overly short answers unless the user asks for brevity.
- Teach concepts clearly and thoughtfully.

Your goal is to help users learn in a natural, ChatGPT-like way.`

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.slice(-10), // keep last 10 messages for context
      ],
      temperature: 0.7,
max_tokens: 1500,
    })

    return NextResponse.json({
      message: response.choices[0]?.message?.content ?? "",
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Chat failed"
    console.error("Chat Error:", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}