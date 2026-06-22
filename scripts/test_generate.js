const payload = {
  scenarioTitle: "Ransomware on Defense Network",
  scenarioBriefing: "It is 02:47 AM. Ransomware spreading.",
  attackType: "Ransomware",
  nistPhase: "Detect",
  questionNumber: 1,
  previousQuestion: null,
  previousAnswer: null,
  previousScore: null,
};

const endpoint = process.env.TEST_ENDPOINT || 'http://localhost:4000/api/generate';

async function wait(ms){ return new Promise(r=>setTimeout(r,ms)); }

(async function run(){
  const maxAttempts = 8;
  for (let i=1;i<=maxAttempts;i++){
    try{
      console.log(`Attempt ${i} -> POST ${endpoint}`);
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const text = await res.text();
      console.log('Response status:', res.status);
      console.log('Response body:');
      console.log(text);
      process.exit(0);
    }catch(err){
      console.error(`Request failed (attempt ${i}):`, err?.stack || err);
      await wait(1000);
    }
  }
  console.error('All attempts failed');
  process.exit(1);
})();
