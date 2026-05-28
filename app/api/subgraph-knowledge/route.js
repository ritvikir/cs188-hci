import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";

const SYSTEM_PROMPT = `You are a study assistant. You are given a focus concept and the
concepts directly connected to it in a concept map, with their definitions and the labeled
relationships between them. Write a concise 2–3 sentence overview that explains how these
concepts connect and build on one another, so a learner understands the neighborhood as a
whole rather than as isolated facts. Be specific and grounded in the given definitions —
do not invent facts or list resources. Output ONLY valid JSON: { "synthesis": "..." }`;

export async function POST(request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    // Graceful degradation: no key means no synthesis, but the client still
    // renders the merged resource list. Never surface this as an error.
    if (!apiKey) return NextResponse.json({ synthesis: null });

    const { topic, nodes, edges } = await request.json();
    if (!Array.isArray(nodes) || nodes.length === 0) {
      return NextResponse.json({ synthesis: null });
    }

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-5.4-mini";

    const conceptLines = nodes
      .map((n) => `- ${String(n.label || "").replace(/\n/g, " ")}: ${n.def || ""}`)
      .join("\n");
    const edgeLines = Array.isArray(edges)
      ? edges.map((e) => `- ${e.from} ${e.label} ${e.to}`).join("\n")
      : "";

    const userContent = `Focus concept: ${topic}\n\nConcepts:\n${conceptLines}\n\nRelationships:\n${edgeLines}`;

    const completion = await openai.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      temperature: 0.3,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
    });

    const result = JSON.parse(completion.choices[0].message.content);
    return NextResponse.json({ synthesis: result.synthesis || null });
  } catch (err) {
    console.error("[subgraph-knowledge]", err);
    // Degrade gracefully so the merged resource list still shows.
    return NextResponse.json({ synthesis: null });
  }
}
