import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export async function handler(event: any) {
  try {
    if (event.httpMethod !== "POST") return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    const authorization = event.headers?.authorization || event.headers?.Authorization;
    const token = typeof authorization === "string" ? authorization.replace(/^Bearer\s+/i, "") : "";
    if (!token || !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return { statusCode: 401, body: JSON.stringify({ error: "Sign in to use AI support" }) };
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return { statusCode: 401, body: JSON.stringify({ error: "Invalid session" }) };

    const body = JSON.parse(event.body || "{}");
    if (typeof body.question !== "string" || body.question.trim().length < 4 || body.question.length > 2000) {
      return { statusCode: 400, body: JSON.stringify({ error: "Provide a question between 4 and 2000 characters" }) };
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: "You are RefAI customer care. Give concise, practical help for the sports platform. Do not invent account, payment, or streaming status. For payment disputes or account access, direct the user to create a support ticket." },
        { role: "user", content: body.question.trim() },
      ],
    });
    return { statusCode: 200, body: JSON.stringify({ answer: completion.choices[0].message.content || "No response was generated." }) };
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: "AI support is temporarily unavailable" }) };
  }
}
