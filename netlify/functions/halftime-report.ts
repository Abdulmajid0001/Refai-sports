import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function handler(event: any) {
  try {
    const body = JSON.parse(event.body);

    const prompt = `
Generate halftime report.

Home Team: ${body.homeTeam}
Away Team: ${body.awayTeam}
Score: ${body.homeScore}-${body.awayScore}

Stats:
${JSON.stringify(body.stats || {})}

Return:
- Tactical analysis
- Momentum
- Referee notes
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        report: completion.choices[0].message.content,
      }),
    };
  } catch {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Halftime report failed",
      }),
    };
  }
}
