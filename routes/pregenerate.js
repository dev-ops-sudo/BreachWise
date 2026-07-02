const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { stripBackticks } = require('../lib/gemini-client');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

const scenarios = [
  {
    id: 'scenario_01',
    title: 'Ransomware on Defense Contractor Network',
    attackType: 'Ransomware',
    nistPhases: ['Detect', 'Contain', 'Contain', 'Recover'],
  },
  {
    id: 'scenario_02',
    title: 'Supply Chain Compromise',
    attackType: 'Supply Chain',
    nistPhases: ['Detect', 'Detect', 'Contain', 'Recover'],
  },
  {
    id: 'scenario_03',
    title: 'Insider Threat Exfiltration',
    attackType: 'Insider Threat',
    nistPhases: ['Detect', 'Detect', 'Contain', 'Recover'],
  },
  {
    id: 'scenario_04',
    title: 'DDoS on Government Portal',
    attackType: 'DDoS',
    nistPhases: ['Detect', 'Contain', 'Contain', 'Recover'],
  },
  {
    id: 'scenario_05',
    title: 'Spear Phishing Attack',
    attackType: 'Phishing',
    nistPhases: ['Detect', 'Detect', 'Contain', 'Recover'],
  },
  {
    id: 'scenario_06',
    title: 'Zero-Day Exploit',
    attackType: 'Zero-Day',
    nistPhases: ['Detect', 'Contain', 'Contain', 'Recover'],
  },
  {
    id: 'scenario_07',
    title: 'ICS Power Grid Attack',
    attackType: 'ICS Attack',
    nistPhases: ['Detect', 'Contain', 'Contain', 'Recover'],
  },
  {
    id: 'scenario_08',
    title: 'APT Long-Term Intrusion',
    attackType: 'APT',
    nistPhases: ['Detect', 'Detect', 'Contain', 'Recover'],
  },
];

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

async function generateAndStore(userId, scenario, questionNumber, previousQuestion, previousAnswer, previousScore, sessionId) {
  const nistPhase = scenario.nistPhases[questionNumber - 1] || 'Detect';
  const isFirst = questionNumber === 1;
  const sid = sessionId || '';

  const prompt = isFirst
    ? `You are a senior cybersecurity incident response trainer.\nScenario: ${scenario.title}\nAttack Type: ${scenario.attackType}\nNIST Phase: ${nistPhase}\nQuestion: ${questionNumber} of 4\n\nGenerate a realistic high-pressure decision point question for an Incident Response Lead.\n\nReturn ONLY valid JSON, no markdown, no backticks:\n{\n  "question": "the question",\n  "context": "one sentence new development",\n  "options": [\n    { "id": "a", "text": "option", "correct": false },\n    { "id": "b", "text": "option", "correct": true },\n    { "id": "c", "text": "option", "correct": false },\n    { "id": "d", "text": "option", "correct": false }\n  ],\n  "nist_phase": "${nistPhase}"\n}`
    : `You are a senior cybersecurity incident response trainer.\nScenario: ${scenario.title}\nAttack Type: ${scenario.attackType}\nNIST Phase: ${nistPhase}\nQuestion: ${questionNumber} of 4\nPrevious question: "${previousQuestion || 'none'}"\nTrainee answered: "${previousAnswer || 'none'}"\nScore: ${typeof previousScore === 'number' ? previousScore : 5}/10\n\n${typeof previousScore === 'number' && previousScore < 6 ? 'Trainee struggled — generate a clearer follow-up on same phase.' : 'Trainee did well — generate a harder question building on previous.'}\n\nReturn ONLY valid JSON, no markdown, no backticks:\n{\n  "question": "the question",\n  "context": "one sentence new development",\n  "options": [\n    { "id": "a", "text": "option", "correct": false },\n    { "id": "b", "text": "option", "correct": true },\n    { "id": "c", "text": "option", "correct": false },\n    { "id": "d", "text": "option", "correct": false }\n  ],\n  "nist_phase": "${nistPhase}"\n}`;

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
  const generated = parseJsonFromText(rawText) || {
    question: `In the ${nistPhase} phase of the ${scenario.attackType} attack, what is the best next step?`,
    context: `A new development occurs in the ${nistPhase} stage of the incident.`,
    options: [
      { id: 'a', text: 'Isolate affected systems and capture volatile data.', correct: true },
      { id: 'b', text: 'Wait for leadership approval before acting.', correct: false },
      { id: 'c', text: 'Restore systems immediately from backup.', correct: false },
      { id: 'd', text: 'Notify external vendors before containment.', correct: false },
    ],
    nist_phase: nistPhase,
  };

  await supabase.from('generated_questions').insert({
    user_id: userId,
    scenario_id: scenario.id,
    question_number: questionNumber,
    question: generated.question,
    context: generated.context,
    options: generated.options,
    nist_phase: generated.nist_phase,
    status: 'ready',
    session_id: sid,
  });

  return generated;
}

router.post('/init', async (req, res) => {
  try {
    const { userId, sessionId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId required' });
    }

    const sid = sessionId || '';
    const { data: existing, error: getError } = await supabase
      .from('generated_questions')
      .select('id')
      .eq('user_id', userId)
      .eq('session_id', sid)
      .eq('question_number', 1)
      .limit(1);

    if (getError) {
      console.error('Supabase lookup error:', getError);
      return res.status(500).json({ error: 'Database lookup failed' });
    }

    if (existing && existing.length > 0) {
      return res.json({ message: 'Already initialized' });
    }

    // Questions are generated on demand by /next. The old behavior fired eight
    // simultaneous Groq requests here, even when the user opened one scenario.
    return res.json({ message: 'Initialized; questions will be generated on demand' });
  } catch (error) {
    console.error('Pregenerate init error:', error?.stack || error);
    return res.status(500).json({ error: 'Failed to initialize generation' });
  }
});

router.post('/next', async (req, res) => {
  try {
    const {
      userId,
      scenarioId,
      questionNumber,
      previousQuestion,
      previousAnswer,
      previousScore,
      sessionId,
    } = req.body;

    if (!userId || !scenarioId || typeof questionNumber !== 'number') {
      return res.status(400).json({ error: 'Missing required request body fields' });
    }

    const scenario = scenarios.find((item) => item.id === scenarioId);
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }

    const nextNumber = questionNumber + 1;
    if (nextNumber > 4) {
      return res.json({ message: 'All questions generated' });
    }

    const generated = await generateAndStore(
      userId,
      scenario,
      nextNumber,
      previousQuestion,
      previousAnswer,
      previousScore,
      sessionId
    );

    return res.json(generated);
  } catch (error) {
    console.error('Pregenerate next error:', error?.stack || error);
    return res.status(500).json({ error: 'Failed to generate next question' });
  }
});

router.get('/question', async (req, res) => {
  try {
    const { userId, scenarioId, questionNumber, sessionId } = req.query;
    if (!userId || !scenarioId || !questionNumber) {
      return res.status(400).json({ error: 'Missing query parameters' });
    }

    const sid = sessionId || '';
    const { data, error } = await supabase
      .from('generated_questions')
      .select('*')
      .eq('user_id', userId)
      .eq('scenario_id', scenarioId)
      .eq('question_number', Number(questionNumber))
      .eq('session_id', sid)
      .single();

    if (error) {
      return res.status(404).json({ error: 'Question not found yet' });
    }

    return res.json(data);
  } catch (error) {
    console.error('Pregenerate question error:', error?.stack || error);
    return res.status(500).json({ error: 'Failed to fetch question' });
  }
});

module.exports = router;
