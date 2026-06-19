const fs = require('fs');
const path = require('path');

const dotenvContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
const env = {};
dotenvContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    env[key] = val;
  }
});

const GROQ_API_KEY = env.GROQ_API_KEY;

async function testGroqModel(modelName) {
  console.log(`\nTesting Groq model: ${modelName}...`);
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: modelName,
        messages: [{ role: "user", content: "Tell me one interesting fact about space in 10 words." }],
        temperature: 0.1
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log(`Success! Response: ${data.choices?.[0]?.message?.content}`);
      return true;
    } else {
      console.error(`Error response:`, data);
      return false;
    }
  } catch (err) {
    console.error(`Fetch error:`, err);
    return false;
  }
}

async function run() {
  await testGroqModel("llama-3.1-8b-instant");
  await testGroqModel("llama-3.3-70b-versatile");
}

run();
