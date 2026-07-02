const express = require('express');
const router = express.Router();
const { stripBackticks } = require('../lib/gemini-client');

function getMockEvaluateResult(question, selectedOption, isCorrect, nistPhase) {
  return {
    score: isCorrect ? 10 : 0,
    verdict: isCorrect ? 'Correct' : 'Incorrect',
    nist_phase: nistPhase,
    reasoning: isCorrect
      ? `The selected option is aligned with the goals of the ${nistPhase} phase and mitigates risk effectively.`
      : `The selected option does not address the main concerns of the ${nistPhase} phase and may leave the incident unresolved.`,
    correct_approach: isCorrect
      ? 'Continue with the chosen action and validate containment through logs and monitoring.'
      : 'Select the option that isolates the affected systems and preserves evidence for investigation.',
    points: isCorrect ? 10 : 2,
  };
}

router.post('/', async (req, res) => {
  try {
    const {
      scenarioTitle,
      scenarioBriefing,
      question,
      nistPhase,
      selectedOption,
      isCorrect,
    } = req.body;

    if (
      typeof scenarioTitle !== 'string' ||
      typeof scenarioBriefing !== 'string' ||
      typeof question !== 'string' ||
      typeof nistPhase !== 'string' ||
      typeof selectedOption !== 'string' ||
      typeof isCorrect !== 'boolean'
    ) {
      return res.status(400).json({ error: 'Missing or invalid request body fields' });
    }

    const promptText = `You are a senior cybersecurity evaluator with 15 years of defensive incident response experience. ` +
      `Evaluate the selected decision in the context of this scenario and the NIST Incident Response framework. ` +
      `Provide a clear score between 1 and 10, a verdict of Correct, Partially Correct, or Incorrect, the nist_phase, a 2-3 sentence explanation of why the selected decision was right or wrong with real world consequences, ` +
      `and a one sentence correct approach. ` +
      `Scenario Title: ${scenarioTitle}\n` +
      `Scenario Briefing: ${scenarioBriefing}\n` +
      `Question: ${question}\n` +
      `Selected Option: ${selectedOption}\n` +
      `Was the selected option correct? ${isCorrect}\n` +
      `NIST Phase: ${nistPhase}\n` +
      `Return only valid JSON with exactly these fields: score, verdict, nist_phase, reasoning, correct_approach, points. ` +
      `Do not include markdown formatting, explanation outside the JSON, or any additional fields.`;

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
          messages: [{ role: 'user', content: promptText }],
          temperature: 0.35,
          max_completion_tokens: 700,
          response_format: { type: 'json_object' },
        }),
      }
    );

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;
    let parsed;

    if (rawText) {
      try {
        const cleanText = stripBackticks(rawText).trim();
        parsed = JSON.parse(cleanText);
      } catch (parseError) {
        console.warn('Failed to parse Groq evaluate output, using fallback:', parseError?.stack || parseError);
      }
    }

    if (!parsed) {
      parsed = getMockEvaluateResult(question, selectedOption, isCorrect, nistPhase);
    } else {
      parsed.score = isCorrect ? 10 : 0;
    }

    return res.json(parsed);
  } catch (error) {
    console.error('Evaluate route error:', error?.stack || error);
    return res.status(500).json({ error: 'Failed to evaluate answer' });
  }
});

module.exports = router;
