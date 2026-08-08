import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body);

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
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        result: completion.choices[0].message.content,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "AI analysis failed" }),
    };
  }
}
