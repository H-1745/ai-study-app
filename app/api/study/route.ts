// app/api/study/route.ts
import { NextResponse } from "next/server";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

async function extractFromPDF(buffer: ArrayBuffer): Promise<string> {
  const { extractText } = await import("unpdf");
  const result = await extractText(new Uint8Array(buffer));
const raw =
  typeof result === "string"
    ? result
    : Array.isArray(result.text)
      ? result.text.join("\n")
      : result.text ?? "";
  return String(raw);
}

async function extractFromPPT(buffer: ArrayBuffer): Promise<string> {
  const officeParser = (await import("officeparser")).default;
  const nodeBuffer = Buffer.from(buffer);
  return new Promise((resolve) => {
    officeParser.parseOffice(nodeBuffer, { outputErrorToConsole: false })
      .then((result: unknown) => {
        const parsed = result as { text?: string };
        if (typeof result === "string") return resolve(result);
        if (result && typeof parsed.text === "string") {
          return resolve(parsed.text);
        }
        return resolve(String(result ?? ""));
      })
      .catch(() => resolve(""));
  });
}

function getGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set in .env.local");
  return new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
}

function buildPrompt(text: string, mode: string): string {
  const trimmed = text.slice(0, 9500);

  if (mode === "notes") {
    return `You are an expert academic note-taker. Create clean, well-structured study notes using proper Markdown only.

Strict Rules:
- Use # for main title and ## for section headings.
- Bold all headings: ## **Exact Heading Name**
- Use only - for bullet points. Never use ●, ◦, or other symbols.
- Bold key concepts like: - **Key Concept**: explanation...
- Keep clean and consistent formatting.

Return in this EXACT format:

# **Main Document Title**

## **Overview**
7-8 sentences summarizing the document.

## **Real Section Heading 1**
- **Key Concept**: Full clear detailed sentence explanation length varying upon the context minimum 4 lines.
  - Supporting detail or example
  - Another supporting detail
- **Another Key Concept**: Full clear sentence explanation.
  - Clear sub-point
  - Clear sub-point

(Continue for all major sections using the real headings from the document)

## **⭐ Important Points to Remember**
- Critical fact or concept 1
- Critical fact or concept 2
- Critical fact or concept 3
- Critical fact or concept 4
- Critical fact or concept 5

## **📝 Summary**
One strong paragraph that ties everything together.

Use real headings from the document. Keep markdown clean. No extra symbols.

DOCUMENT:
${trimmed}`;
  }

  if (mode === "flashcards") return `You are a study assistant. Create exactly 10 high-quality flashcards from the document.

Rules:
- Questions must test UNDERSTANDING, not just recall
- Answers must be complete and informative (2-3 sentences)
- Cover different sections of the document
- Mix concept, definition, and application questions

Format EXACTLY like this (no extra text before or after):
---
Q: [question here]
A: [answer here]
---
Q: [question here]
A: [answer here]
---

DOCUMENT:
${trimmed}`;

  if (mode === "quiz") return `You are a study assistant. Create exactly 6 multiple-choice quiz questions from the document.

Rules:
- Questions must be clear and specific
- Wrong options must be plausible
- Cover different topics from the document
- Explanations must be educational

Return ONLY a valid JSON array, no markdown, no extra text:
[
  {
    "question": "Question text?",
    "options": ["A) option", "B) option", "C) option", "D) option"],
    "answer": "A) option",
    "explanation": "Why this is correct."
  }
]

DOCUMENT:
${trimmed}`;

  return "";
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const mode = (formData.get("mode") as string) || "notes";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const filename = file.name.toLowerCase();
    const isPDF = filename.endsWith(".pdf");
    const isPPT = filename.endsWith(".ppt") || filename.endsWith(".pptx");

    if (!isPDF && !isPPT)
      return NextResponse.json({ error: "Only PDF and PPT/PPTX files are supported" }, { status: 400 });

    const arrayBuffer = await file.arrayBuffer();
    let text = isPDF ? await extractFromPDF(arrayBuffer) : await extractFromPPT(arrayBuffer);
    text = String(text ?? "");

    if (!text.trim())
      return NextResponse.json({ error: "Could not extract text. File may be image-only or corrupted." }, { status: 400 });

    const client = getGroqClient();
    const prompt = buildPrompt(text, mode);

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "You are an expert study assistant. Follow the output format exactly. Be clean and professional." },
        { role: "user", content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 3000,
    });

    const content = response.choices[0]?.message?.content ?? "";

    if (mode === "quiz") {
      try {
        const clean = content.replace(/```json|```/g, "").trim();
        const questions = JSON.parse(clean);
        return NextResponse.json({ mode, questions });
      } catch {
        return NextResponse.json({ mode, raw: content });
      }
    }

    return NextResponse.json({
      mode,
      content,
      filename: file.name,
      fileType: isPDF ? "pdf" : "pptx",
      extractedText: text.slice(0, 9000),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Processing failed";
    console.error("Study AI Error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}