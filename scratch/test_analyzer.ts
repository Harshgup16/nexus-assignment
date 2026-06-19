import { runAnalysis } from '../lib/analyzer';
import * as fs from 'fs';
import * as path from 'path';

// Read env variables manually from .env
try {
  const dotenvContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  dotenvContent.split('\n').forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
      process.env[key] = val;
    }
  });
} catch (e: any) {
  console.log("Failed to load .env manually:", e.message);
}

async function test() {
  console.log("Running runAnalysis test directly...");
  try {
    const result = await runAnalysis(
      "NexusBuild",
      "Build web applications and SaaS products with AI pair-programming and browser verification."
    );
    console.log("\nSuccess!");
    console.log("Competitors found:", result.competitors.map(c => c.name));
    console.log("Sample lead:", result.leads?.[0]?.companyName);
  } catch (err) {
    console.error("Caught error in test:", err);
  }
}

test();
