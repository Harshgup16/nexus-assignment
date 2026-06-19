const { tavily } = require("@tavily/core");
const fs = require('fs');
const path = require('path');

// Load .env
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
  const productName = "EnviroWealth";
  const description = "Indian climate-tech startup based in Surat, Gujarat. Helps individuals, MSMEs, industries, and events measure, reduce, and offset their carbon emissions using AI-powered sustainability tools.";

  // 1. Replicate the exact keyword extraction from tavily.ts
  const cleanDesc = description.replace(/[^a-zA-Z0-9 ]/g, ' ');
  const words = cleanDesc.split(/\s+/).filter(w => w.length > 3);
  const stopWords = new Set(['about', 'their', 'there', 'would', 'other', 'using', 'which', 'where', 'these', 'those', 'under', 'while', 'after', 'before', 'helps', 'based', 'startup', 'concept', 'company', 'product', 'ideal']);
  const filteredWords = words.filter(w => !stopWords.has(w.toLowerCase())).slice(0, 6);
  const industryKeywords = filteredWords.join(" ");

  console.log("=== KEYWORD EXTRACTION ===");
  console.log("All words >3 chars:", words);
  console.log("After stopword filter:", filteredWords);
  console.log("Industry keywords:", industryKeywords);

  const namePart = productName.trim();
  const searchSubject = `${namePart} ${industryKeywords}`;
  const query1 = `${searchSubject} competitors startup products and offerings`;
  const query2 = `${searchSubject} market alternatives pricing features reviews`;

  console.log("\n=== SEARCH QUERIES ===");
  console.log("Query 1:", query1);
  console.log("Query 2:", query2);

  // 2. Run actual Tavily searches
  const tvly = tavily({ apiKey: TAVILY_API_KEY });

  console.log("\n=== TAVILY SEARCH 1 ===");
  try {
    const res1 = await tvly.search(query1, { searchDepth: "advanced", maxResults: 5 });
    console.log("Results count:", res1.results.length);
    res1.results.forEach((r, i) => {
      console.log(`\n  [${i+1}] ${r.title}`);
      console.log(`      URL: ${r.url}`);
      console.log(`      Score: ${r.score}`);
      console.log(`      Content length: ${r.content.length} chars`);
      console.log(`      Content preview: ${r.content.substring(0, 200)}...`);
    });
  } catch (err) {
    console.error("Search 1 failed:", err.message);
  }

  console.log("\n=== TAVILY SEARCH 2 ===");
  try {
    const res2 = await tvly.search(query2, { searchDepth: "advanced", maxResults: 5 });
    console.log("Results count:", res2.results.length);
    res2.results.forEach((r, i) => {
      console.log(`\n  [${i+1}] ${r.title}`);
      console.log(`      URL: ${r.url}`);
      console.log(`      Score: ${r.score}`);
      console.log(`      Content length: ${r.content.length} chars`);
      console.log(`      Content preview: ${r.content.substring(0, 200)}...`);
    });
  } catch (err) {
    console.error("Search 2 failed:", err.message);
  }

  // 3. Test with better queries focused on the INDUSTRY rather than brand name
  console.log("\n=== IMPROVED QUERY TEST ===");
  const betterQuery1 = "carbon footprint calculator software competitors for MSMEs India";
  const betterQuery2 = "ESG reporting sustainability platform pricing features comparison";
  const betterQuery3 = "climate tech startups India carbon emission tracking tools";
  
  try {
    const [r1, r2, r3] = await Promise.all([
      tvly.search(betterQuery1, { searchDepth: "advanced", maxResults: 5 }),
      tvly.search(betterQuery2, { searchDepth: "advanced", maxResults: 5 }),
      tvly.search(betterQuery3, { searchDepth: "advanced", maxResults: 5 }),
    ]);
    
    console.log("\nBetter Query 1 results:", r1.results.length);
    r1.results.forEach((r, i) => {
      console.log(`  [${i+1}] ${r.title} (${r.content.length} chars)`);
    });
    
    console.log("\nBetter Query 2 results:", r2.results.length);
    r2.results.forEach((r, i) => {
      console.log(`  [${i+1}] ${r.title} (${r.content.length} chars)`);
    });
    
    console.log("\nBetter Query 3 results:", r3.results.length);
    r3.results.forEach((r, i) => {
      console.log(`  [${i+1}] ${r.title} (${r.content.length} chars)`);
    });
  } catch (err) {
    console.error("Better query test failed:", err.message);
  }
}

run();
