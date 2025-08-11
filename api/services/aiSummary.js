import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function summarizeNews({ text, title = "", maxWords = 160 }) {
    if (!text || text.trim().length === 0) {
        throw new Error("summarizeNews: 'text' is required and cannot be empty");
    }

    const model = "gpt-4.1-nano";

    const res = await openai.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
            {
             role: "system",
             content: "You are a concise news summarizer. Produce neutral, factual summaries and extract key topics."
            },
            {
             role: "user",
             content: [
                 `Title: ${title || "(untitled)"}`,
                 "",
                 "Task:",
                 `1) Write a concise summary (<= ${maxWords} words).`,
                 "2) Provide 3–6 bullet points with the most important facts.",
                 "3) Provide 3–8 keywords (lowercase, no #).",
                 "4) Estimate sentiment as positive | neutral | negative.",
                 "5) Give confidence 0–1 for summary accuracy.",
                 "",
                 "Output strict JSON with keys:",
                 '{ "summary": string, "bullets": string[], "keywords": string[], "sentiment": "positive"|"neutral"|"negative", "confidence": number }',
                 "",
                 "Article text:",
                 text
             ].join("\n")
            }
        ]
    });

    const content = res.choices?.[0]?.message?.content || "{}";

    let json;
    try {
        json = JSON.parse(content);
    } catch {
        json = {
            summary: content,
            bullets: [],
            keywords: [],
            sentiment: "neutral",
            confidence: 0.5
        };
    }

    return json;
}