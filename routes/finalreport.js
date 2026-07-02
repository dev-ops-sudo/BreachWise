const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { stripBackticks } = require('../lib/gemini-client');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

function parseJsonFromText(text) {
  if (!text) return null;
  const clean = stripBackticks(text).trim();
  const match = clean.match(/\{[\s\S]*\}$/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (err) {
    return null;
  }
}

router.post('/', async (req, res) => {
  try {
    const { userId, scenarioId, scenarioTitle, answers, sessionId } = req.body;

    if (!userId || !scenarioId || !scenarioTitle || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: 'Missing or invalid request body fields' });
    }

    const answersText = answers
      .map((a, index) =>
        `Question ${index + 1} (${a.nistPhase}):\nQ: ${a.question}\nUser chose: ${a.selectedOption}\nCorrect: ${a.isCorrect ? 'YES' : 'NO'}`
      )
      .join('\n\n');

    const prompt = `You are a senior cybersecurity training assessor with 15 years of defense experience.\n\n` +
      `A trainee just completed the "${scenarioTitle}" incident response simulation.\n\n` +
      `Here are all their decisions:\n\n${answersText}\n\n` +
      `Analyse ALL decisions together and provide a comprehensive assessment.\n\n` +
      `Return ONLY valid JSON, no markdown, no backticks:\n{\n` +
      `  "overall_score": 0,\n` +
      `  "readiness_level": "<Beginner|Junior Analyst|SOC Analyst|Senior Analyst>",\n` +
      `  "decisions": [\n` +
      `    {\n` +
      `      "question_number": 1,\n` +
      `      "score": 0,\n` +
      `      "verdict": "<Correct|Partially Correct|Incorrect>",\n` +
      `      "explanation": "detailed explanation of why their choice was right or wrong",\n` +
      `      "correct_approach": "what they should have done"\n` +
      `    }\n` +
      `  ],\n` +
      `  "strong_phases": [],\n` +
      `  "weak_phases": [],\n` +
      `  "summary": "3 sentence overall assessment of their incident response ability",\n` +
      `  "top_recommendation": "the single most important thing they need to improve",\n` +
      `  "suitable_for": "what role they are ready for right now"\n` +
      `}`;

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.35,
          max_completion_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      }
    );

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;

    const totalQuestions = answers.length;
    const correctCount = answers.filter(a => 
      a.isCorrect || a.correct || a.verdict === 'Correct'
    ).length;
    const overallScore = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);

    const parsed = parseJsonFromText(rawText) || {
      overall_score: overallScore,
      readiness_level: 'SOC Analyst',
      decisions: answers.map((a, index) => ({
        question_number: index + 1,
        score: a.isCorrect ? 8 : 3,
        verdict: a.isCorrect ? 'Correct' : 'Incorrect',
        explanation: a.isCorrect ? 'The trainee chose a response aligned with the incident response objective.' : 'This option did not fully address the required mitigation or evidence preservation.',
        correct_approach: a.isCorrect ? 'Continue with the selected containment action and validate through logs.' : 'Select the option that isolates affected systems and preserves forensic evidence.',
      })),
      strong_phases: answers.filter((a) => a.isCorrect).map((a) => a.nistPhase),
      weak_phases: answers.filter((a) => !a.isCorrect).map((a) => a.nistPhase),
      summary: 'The trainee showed solid decision making in the phases they understood, but there is room to improve consistency in the weaker stages. Continued simulation practice will help build stronger incident response judgment. Overall, the trainee is on track for SOC Analyst readiness.',
      top_recommendation: 'Focus on selecting actions that clearly isolate the incident and preserve evidence during containment.',
      suitable_for: 'SOC Analyst',
    };
    parsed.overall_score = overallScore;

    const answerRows = answers.map((answer, index) => ({
      user_id: userId,
      scenario_id: scenarioId,
      question_number: index + 1,
      question: answer.question,
      selected_option: answer.selectedOption,
      is_correct: answer.isCorrect,
      created_at: new Date().toISOString(),
    }));

    const { error: answerInsertError } = await supabase
      .from('user_answers')
      .insert(answerRows);

    if (answerInsertError) {
      console.error('Failed to save user answers:', answerInsertError);
    }

    await supabase.from('scenario_results').insert({
      user_id: userId,
      scenario_id: scenarioId,
      scenario_title: scenarioTitle,
      scores: answers.map((answer) => (answer.isCorrect ? 10 : 0)),
      overall_score: parsed.overall_score,
      readiness_level: parsed.readiness_level,
      strong_phases: parsed.strong_phases,
      weak_phases: parsed.weak_phases,
      session_id: sessionId || null,
      completed_at: new Date().toISOString(),
    });

    return res.json(parsed);
  } catch (error) {
    console.error('Final report error:', error?.stack || error);
    return res.status(500).json({ error: 'Failed to generate final report' });
  }
});

module.exports = router;
