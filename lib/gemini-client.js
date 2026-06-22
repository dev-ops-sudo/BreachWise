const { GoogleGenerativeAI } = require('@google/generative-ai');

const GEMINI_MODEL = 'gemini-1.5-flash';
const API_KEY = process.env.GEMINI_API_KEY;

let geminiModel = null;
if (API_KEY) {
  try {
    const client = new GoogleGenerativeAI(API_KEY);
    geminiModel = client.getGenerativeModel({
      model: GEMINI_MODEL,
      generationConfig: {
        maxOutputTokens: 900,
        temperature: 0.7,
        topP: 0.9,
      },
    });
  } catch (error) {
    console.warn('Failed to initialize Gemini client:', error?.stack || error);
    geminiModel = null;
  }
}

function stripBackticks(text) {
  return text.replace(/`+/g, '');
}

function extractTextFromGenerateContentResult(result) {
  if (!result || !result.response) {
    return null;
  }

  const candidates = result.response.candidates;
  if (!Array.isArray(candidates) || candidates.length === 0) {
    return null;
  }

  const content = candidates[0]?.content;
  if (!content) {
    return null;
  }

  if (typeof content.text === 'string') {
    return content.text;
  }

  if (Array.isArray(content.parts)) {
    const text = content.parts.map((part) => (part && typeof part.text === 'string' ? part.text : '')).join('');
    return text.trim() || null;
  }

  return null;
}

async function callGemini(promptText) {
  if (!geminiModel) {
    return null;
  }

  try {
    const result = await geminiModel.generateContent(promptText);
    return extractTextFromGenerateContentResult(result);
  } catch (error) {
    console.warn('Gemini request failed:', error?.stack || error);
    return null;
  }
}

module.exports = {
  callGemini,
  stripBackticks,
  extractTextFromGenerateContentResult,
};
