import { NextResponse } from "next/server";
import OpenAI from "openai";
import pdfParse from "pdf-parse";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are an expert educational concept map generator.

Given lecture material, extract key concepts and their relationships and output a JSON object.

Node rules:
- Extract 8–15 key concepts (more for denser material)
- id: short snake_case identifier, unique, no spaces
- label: 1–3 words; use \\n to split into two lines if needed (e.g. "Working\\nMemory")
- def: 2–3 sentence explanation grounded in the material
- source: brief note on where this appears (e.g. "Introduction", "Slide 4", "Section 2")
- x: integer 80–880 — place the most central concept near 480
- y: integer 80–620 — spread nodes vertically to avoid overlap
- Each node is roughly 130px wide × 50px tall; keep nodes at least 140px apart

Edge rules:
- 1–2 edges per concept on average; avoid redundant edges
- from/to: must reference valid node ids
- label: short relationship phrase (e.g. "comprises", "enables", "informs", "builds on", "precedes")

Layout rules:
- Put the root/most important concept near x:480, y:300
- Cluster related concepts spatially
- Avoid placing more than 3 nodes on the same y value

Output ONLY valid JSON with this exact shape:
{
  "title": "short descriptive title of the material",
  "subtitle": "course or document name if identifiable",
  "nodes": [
    { "id": "...", "label": "...", "def": "...", "source": "...", "x": 0, "y": 0 }
  ],
  "edges": [
    { "from": "...", "to": "...", "label": "..." }
  ]
}`;

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
    }

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

    const formData = await request.formData();
    const fileEntries = formData.getAll("files");
    const pastedText = formData.get("text") || "";

    const extractedParts = [];

    for (const file of fileEntries) {
      if (!(file instanceof Blob)) continue;
      const buffer = Buffer.from(await file.arrayBuffer());
      if (file.type === "application/pdf" || file.name?.endsWith(".pdf")) {
        const parsed = await pdfParse(buffer);
        extractedParts.push(`[File: ${file.name}]\n${parsed.text}`);
      } else {
        extractedParts.push(`[File: ${file.name}]\n${buffer.toString("utf-8")}`);
      }
    }

    if (pastedText.trim()) extractedParts.push(`[Pasted notes]\n${pastedText.trim()}`);

    const combined = extractedParts.join("\n\n").trim();

    if (!combined) {
      return NextResponse.json({ error: "No content provided" }, { status: 400 });
    }

    // Truncate to ~12 000 chars to stay within token budget
    const content = combined.length > 12000 ? combined.slice(0, 12000) + "\n\n[truncated]" : combined;

    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Generate a concept map from this lecture material:\n\n${content}` },
      ],
    });

    const result = JSON.parse(completion.choices[0].message.content);

    if (!Array.isArray(result.nodes) || !Array.isArray(result.edges)) {
      throw new Error("AI returned an unexpected response shape");
    }

    // Sanitize: ensure all edge refs point to real nodes
    const nodeIds = new Set(result.nodes.map((n) => n.id));
    result.edges = result.edges.filter((e) => nodeIds.has(e.from) && nodeIds.has(e.to));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[generate-map]", err);
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
