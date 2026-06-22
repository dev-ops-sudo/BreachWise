require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const requiredEnvs = ['GROQ_API_KEY', 'SUPABASE_URL', 'SUPABASE_KEY'];
requiredEnvs.forEach((key) => {
  if (!process.env[key]) {
    console.warn(`Warning: environment variable ${key} is not set.`);
  }
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());
app.use('/api/generate', require('./routes/generate'));
app.use('/api/evaluate', require('./routes/evaluate'));
app.use('/api/pregenerate', require('./routes/pregenerate'));
app.use('/api/finalreport', require('./routes/finalreport'));

async function fetchGroqText(promptText) {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || 'llama-3.1-8b-instant',
      messages: [{ role: 'user', content: promptText }],
      temperature: 0.35,
      max_completion_tokens: 400,
    }),
  });
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function getMockReportResult(scenarioTitle, scores, nistPhases, readinessLevel) {
  const top = scores.map((score, idx) => ({ score, phase: nistPhases[idx] })).sort((a, b) => b.score - a.score);
  const strong = top.slice(0, 2).map((item) => item.phase);
  const weak = top.slice(-2).map((item) => item.phase);

  return {
    overall_score: Math.round((scores.reduce((sum, value) => sum + value, 0) / scores.length) * 10),
    readiness_level: readinessLevel,
    strong_phases: strong,
    weak_phases: weak,
    summary: `The trainee demonstrated solid capability in ${strong.join(' and ')}, but needs improvement in ${weak.join(' and ')}. The overall performance is ${readinessLevel} level, with clear understanding of incident response processes. Continued practice will help close the remaining gaps.`,
    top_recommendation: `Focus on improving ${weak[0]} phase actions and evidence-based decision making.`,
    suitable_for: readinessLevel === 'Senior Analyst' ? 'Advanced SOC Analyst' : `${readinessLevel} level cybersecurity analyst`,
  };
}

const PORT = parseInt(process.env.PORT, 10) || 4000;
const FALLBACK_PORT = 4001;
let currentPort = PORT;

function startServer(port) {
  server.listen(port, () => {
    console.log(`Express server listening on port ${port}`);
  });
}

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && currentPort === PORT) {
    console.warn(`Port ${PORT} already in use, trying ${FALLBACK_PORT}...`);
    currentPort = FALLBACK_PORT;
    startServer(FALLBACK_PORT);
  } else {
    console.error('Server startup error:', err);
    process.exit(1);
  }
});

app.post('/api/report', async (req, res, next) => {
  try {
    const { scenarioTitle, scores, nistPhases } = req.body;

    if (
      typeof scenarioTitle !== 'string' ||
      !Array.isArray(scores) ||
      scores.length !== 4 ||
      !Array.isArray(nistPhases) ||
      nistPhases.length !== 4 ||
      !scores.every((item) => typeof item === 'number' && item >= 1 && item <= 10) ||
      !nistPhases.every((item) => typeof item === 'string')
    ) {
      return res.status(400).json({ error: 'Missing or invalid request body fields' });
    }

    const averageScore = scores.reduce((sum, value) => sum + value, 0) / scores.length;
    const overallScore = Math.round(averageScore * 10);
    let readinessLevel = 'Junior Analyst';

    if (averageScore < 4) {
      readinessLevel = 'Beginner';
    } else if (averageScore >= 4 && averageScore < 6) {
      readinessLevel = 'Junior Analyst';
    } else if (averageScore >= 6 && averageScore < 8) {
      readinessLevel = 'SOC Analyst';
    } else {
      readinessLevel = 'Senior Analyst';
    }

    const promptText = `You are a cybersecurity training assessor generating a personalized readiness report. ` +
      `Use the following average score and readiness level to build a professional assessment. ` +
      `Scenario Title: ${scenarioTitle}\n` +
      `Scores: ${scores.join(', ')}\n` +
      `NIST Phases: ${nistPhases.join(', ')}\n` +
      `Average score: ${averageScore.toFixed(2)}\n` +
      `Readiness level: ${readinessLevel}\n` +
      `Produce a JSON report with these exact fields: overall_score, readiness_level, strong_phases, weak_phases, summary, top_recommendation, suitable_for. ` +
      `Strong phases should be the NIST phases with the highest scores and weak phases should be those with the lowest scores. ` +
      `Summary should be a 3 sentence professional assessment. ` +
      `Top recommendation should be the single most important improvement area. ` +
      `Suitable_for should name the job role the person is ready for. ` +
      `Do not include markdown formatting or any text outside the JSON.`;

    const rawText = await fetchGroqText(promptText);
    let parsed;

    if (rawText) {
      try {
        const cleanText = stripBackticks(rawText).trim();
        parsed = JSON.parse(cleanText);
      } catch (parseError) {
        console.warn('Failed to parse Groq report output, using fallback:', parseError?.stack || parseError);
      }
    }

    if (!parsed) {
      parsed = getMockReportResult(scenarioTitle, scores, nistPhases, readinessLevel);
    }

    return res.json(parsed);
  } catch (error) {
    console.error('Report route error:', error?.stack || error);
    return res.status(500).json({ error: 'Failed to generate report' });
  }
});

app.use((err, req, res, next) => {
  console.error('Express error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

startServer(PORT);

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
  });
});
