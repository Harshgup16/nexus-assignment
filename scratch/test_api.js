const fs = require('fs');
const path = require('path');

// Read env variables manually from .env
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
const TAVILY_API_KEY = env.TAVILY_API_KEY;

console.log("GROQ KEY:", GROQ_API_KEY ? "Found (length: " + GROQ_API_KEY.length + ")" : "Missing");
console.log("TAVILY KEY:", TAVILY_API_KEY ? "Found (length: " + TAVILY_API_KEY.length + ")" : "Missing");

async function testTavily() {
  if (!TAVILY_API_KEY) return;
  console.log("\n1. Testing Tavily Web Search via Fetch...");
  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: "NexusBuild startup competitors",
        search_depth: "basic",
        max_results: 3
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log("Tavily Search success! Found results count:", data.results?.length);
      console.log("Tavily first title:", data.results?.[0]?.title);
    } else {
      console.error("Tavily error response:", data);
    }
  } catch (err) {
    console.error("Tavily fetch error:", err);
  }
}

async function testGroq() {
  if (!GROQ_API_KEY) return;
  console.log("\n2. Testing Groq AI Completion via Fetch...");
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: "Hello! Answer in exactly one word: Success" }],
        temperature: 0.1
      })
    });
    const data = await res.json();
    if (res.ok) {
      console.log("Groq API success! Response text:", data.choices?.[0]?.message?.content);
    } else {
      console.error("Groq error response:", data);
    }
  } catch (err) {
    console.error("Groq fetch error:", err);
  }
}

async function run() {
  await testTavily();
  await testGroq();
}

run();
