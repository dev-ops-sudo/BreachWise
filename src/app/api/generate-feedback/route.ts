import { groqConfig, getGroqApiKey } from '@/lib/groq-client';

export async function POST(request: Request) {
  try {
    const { attackTitle, userAnswers, difficulty } = await request.json();

    if (!attackTitle || !userAnswers || userAnswers.length === 0) {
      return Response.json(
        { error: 'attackTitle and userAnswers are required' },
        { status: 400 }
      );
    }

    const apiKey = getGroqApiKey();

    const answersText = userAnswers
      .map(
        (answer: any, i: number) =>
          `Question ${i + 1}: ${answer.question}\nUser Answer: ${answer.answer || '(No answer provided)'}`
      )
      .join('\n\n');

    const prompt = `You are a cybersecurity training expert. Analyze the following incident response training performance and provide:
1. A score from 1-100 based on answer quality
2. A rank (Novice, Intermediate, Advanced, Expert)
3. 3-5 specific improvement suggestions
4. Key strengths demonstrated

Training Scenario: ${attackTitle}
Difficulty Level: ${difficulty}

${answersText}

Provide response in JSON format:
{
  "score": <number 1-100>,
  "rank": "Novice|Intermediate|Advanced|Expert",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2", "improvement3"],
  "feedback": "Overall feedback message"
}`;

    const response = await fetch(`${groqConfig.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Groq API error:', error);
      return Response.json(
        { error: 'Failed to generate AI feedback' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return Response.json(
        { error: 'No response from AI' },
        { status: 500 }
      );
    }

    try {
      const feedback = JSON.parse(content);
      return Response.json(feedback);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return Response.json(
        { error: 'Failed to parse AI response' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Generate feedback error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
