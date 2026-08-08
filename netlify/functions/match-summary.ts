import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body);

    const prompt = `
Generate professional football match summary.

Events:
${JSON.stringify(body.events)}

Return:
- Summary
- Key moments
- Final analysis
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        summary: completion.choices[0].message.content,
      }),
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Summary generation failed",
      }),
    };
  }
}
