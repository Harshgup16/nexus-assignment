import { generateObject } from 'ai';
import { createGroq } from '@ai-sdk/groq';
import { AnalysisResultPayloadSchema } from '../lib/schemas';
import { SYSTEM_PROMPT, getAnalysisPrompt } from '../lib/prompts';
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

const groqApiKey = process.env.GROQ_API_KEY;

async function test() {
  console.log("Running generateObject test directly...");
  try {
    const groq = createGroq({ apiKey: groqApiKey });
    const { object } = await generateObject({
      model: groq('llama-3.3-70b-versatile'),
      providerOptions: {
        groq: {
          structuredOutputs: false,
        }
      },
      system: SYSTEM_PROMPT,
      prompt: getAnalysisPrompt(
        "NexusBuild",
        "Build web applications and SaaS products with AI pair-programming and browser verification.",
        undefined,
        undefined,
        "No competitors found in web search."
      ),
      schema: AnalysisResultPayloadSchema,
      temperature: 0.2,
    });
    console.log("SUCCESS!", JSON.stringify(object, null, 2));
  } catch (err: any) {
    console.error("Caught error in test:", err);
    if (err.text) {
      console.log("\n--- Raw Text Generated ---");
      console.log(err.text);
      console.log("--------------------------");
    }
    if (err.warnings) {
      console.log("\n--- Warnings ---");
      console.log(err.warnings);
    }
  }
}

test();
