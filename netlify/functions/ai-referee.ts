import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event: any) {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
    }
    const authHeader = event.headers?.authorization || event.headers?.Authorization;
    const token = typeof authHeader === "string" ? authHeader.replace(/^Bearer\s+/i, "") : "";
    if (!token || !process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return { statusCode: 401, body: JSON.stringify({ error: "Authentication is required" }) };
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userResult, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userResult.user) {
      return { statusCode: 401, body: JSON.stringify({ error: "Invalid session" }) };
    }
    const body = JSON.parse(event.body || "{}");
    if (typeof body.sport !== "string" || typeof body.incident !== "string" || body.incident.trim().length < 10 || body.incident.length > 2000) {
      return { statusCode: 400, body: JSON.stringify({ error: "Provide an incident between 10 and 2000 characters" }) };
    }

    const prompt = `
You are an elite FIFA referee assistant.

Analyze this incident:

Sport: ${body.sport}
Incident: ${body.incident}
Context: ${body.context || "None"}

Return:
1. Decision
2. Explanation
3. Confidence percentage
4. Rule reference
`;

    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ result: completion.choices[0].message.content || "No analysis returned." }),
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI analysis failed" }),
    };
  }
}
