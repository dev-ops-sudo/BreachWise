require('dotenv').config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('GEMINI_API_KEY not set in .env');
  process.exit(1);
}

const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(API_KEY)}`;
const promptText = 'Test prompt for schema detection: Say hello briefly.';

const variants = [
  { name: 'prompt_text', body: { prompt: { text: promptText }, temperature: 0.5, maxOutputTokens: 64 } },
  { name: 'input_string', body: { input: promptText, temperature: 0.5, maxOutputTokens: 64 } },
  { name: 'input_object', body: { input: { text: promptText }, temperature: 0.5, maxOutputTokens: 64 } },
  { name: 'instances_parameters', body: { instances: [{ input: promptText }], parameters: { temperature: 0.5, maxOutputTokens: 64 } } },
  { name: 'instances_content', body: { instances: [{ content: [{ type: 'text', text: promptText }] }], parameters: { temperature: 0.5, maxOutputTokens: 64 } } },
  { name: 'messages_style', body: { messages: [{ author: 'user', content: [{ type: 'text', text: promptText }] }], temperature: 0.5, maxOutputTokens: 64 } },
  { name: 'text_key', body: { text: promptText, temperature: 0.5, maxOutputTokens: 64 } },
];

(async () => {
  for (const v of variants) {
    try {
      console.log('Trying variant:', v.name);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(v.body),
      });
      const text = await res.text();
      console.log('Status:', res.status);
      console.log('Body:', text.slice(0, 2000));
      if (res.ok) {
        console.log('\nSUCCESS with variant:', v.name);
        process.exit(0);
      }
    } catch (err) {
      console.error('Error for variant', v.name, err?.stack || err);
    }
    await new Promise(r => setTimeout(r, 500));
  }
  console.error('No variant succeeded');
  process.exit(2);
})();
