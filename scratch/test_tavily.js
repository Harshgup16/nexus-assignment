const { tavily } = require("@tavily/core");
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

const TAVILY_API_KEY = env.TAVILY_API_KEY;

async function run() {
  const tvly = tavily({ apiKey: TAVILY_API_KEY });
  console.log("Calling Tavily core search...");
  try {
    const res = await tvly.search("Envirowealth climate carbon competitors", { searchDepth: "advanced", maxResults: 5 });
    console.log("Raw Response Keys:", Object.keys(res));
    console.log("First Result Keys:", res.results && res.results[0] ? Object.keys(res.results[0]) : "None");
    console.log("First Result Title:", res.results && res.results[0] ? res.results[0].title : "None");
    console.log("First Result URL:", res.results && res.results[0] ? res.results[0].url : "None");
    console.log("First Result Content Length:", res.results && res.results[0] ? res.results[0].content.length : "None");
    console.log("Results count:", res.results ? res.results.length : 0);
  } catch (err) {
    console.error("Tavily SDK error:", err);
  }
}

run();
