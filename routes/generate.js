const express = require('express');
const router = express.Router();
const { stripBackticks } = require('../lib/gemini-client');

function getMockGenerateResult(scenarioTitle, scenarioBriefing, attackType, nistPhase) {
  return {
    question: `In the ${nistPhase} phase of the ${attackType} attack, what is the best next step to contain the incident?`,
    context: `Scenario: ${scenarioTitle}. Briefing: ${scenarioBriefing}`,
    options: [
      { id: 'a', text: 'Isolate affected hosts and take systems offline.', correct: true },
      { id: 'b', text: 'Continue monitoring network traffic without action.', correct: false },
      { id: 'c', text: 'Notify external vendors immediately.', correct: false },
      { id: 'd', text: 'Restore backups before investigating.', correct: false },
    ],
    nist_phase: nistPhase,
  };
}

router.post('/', async (req, res) => {
  try {
    const {
      scenarioTitle,
      scenarioBriefing,
      attackType,
      nistPhase,
      questionNumber,
      previousQuestion,
      previousAnswer,
      previousScore,
    } = req.body;

    if (
      typeof scenarioTitle !== 'string' ||
      typeof scenarioBriefing !== 'string' ||
      typeof attackType !== 'string' ||
      typeof nistPhase !== 'string' ||
      typeof questionNumber !== 'number'
    ) {
      return res.status(400).json({ error: 'Missing or invalid request body fields' });
    }

    const phaseInstruction = `Always test the ${nistPhase} phase and align the question to ${attackType} in this scenario.`;
    let difficultyInstruction = '';

    if (questionNumber === 1) {
      difficultyInstruction = 'Generate a fresh decision point question for the scenario.';
    } else {
      const scoreText = typeof previousScore === 'number' ? previousScore : null;
      if (scoreText !== null && scoreText < 6) {
        difficultyInstruction = 'Adapt the next question to be easier, while still testing the same phase.';
      } else {
        difficultyInstruction = 'Adapt the next question to be harder, while still testing the same phase.';
      }
    }

    const previousContext = [];
    if (questionNumber > 1) {
      previousContext.push(`previousQuestion: ${previousQuestion ?? 'none'}`);
      previousContext.push(`previousAnswer: ${previousAnswer ?? 'none'}`);
      previousContext.push(`previousScore: ${previousScore ?? 'none'}`);
    }

    const randomSeed = Math.random().toString(36).substring(7);
    const promptText = `You are building a cybersecurity incident response training decision point for BreachWise.\n` +
      `Scenario Title: ${scenarioTitle}\n` +
      `Briefing: ${scenarioBriefing}\n` +
      `Attack Type: ${attackType}\n` +
      `NIST Phase: ${nistPhase}\n` +
      `Question Number: ${questionNumber}\n` +
      `Randomization Seed: ${randomSeed}\n` +
      `${phaseInstruction}\n` +
      `${difficultyInstruction}\n` +
      (previousContext.length ? `Previous context:\n${previousContext.join('\n')}\n` : '') +
      `IMPORTANT: Ensure the question, options, and context are completely unique, diverse, and highly realistic. Avoid generating identical or generic questions.\n` +
      `Return only valid JSON with exactly these properties: question, context, options, nist_phase.\n` +
      `Options must be an array of four objects with keys: id (a, b, c, d), text (the option text), and correct (boolean indicating if the option is correct). Only one option must have correct set to true.\n` +
      `Do not include markdown formatting or explanatory text around the JSON.\n` +
      `Make the question specific to the attack type and scenario.`;

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
          temperature: 0.7,
          max_completion_tokens: 500,
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
        console.warn('Failed to parse Groq generate output, using fallback:', parseError?.stack || parseError);
      }
    }

    if (!parsed) {
      parsed = getMockGenerateResult(scenarioTitle, scenarioBriefing, attackType, nistPhase);
    }

    return res.json(parsed);
  } catch (error) {
    console.error('Generate route error:', error?.stack || error);
    return res.status(500).json({ error: 'Failed to generate question' });
  }
});

module.exports = router;
