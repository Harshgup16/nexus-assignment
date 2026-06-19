export const SYSTEM_PROMPT = `You are a high-end, expert startup strategy consultant, market researcher, and sales analyst.
Your job is to analyze the user's product or startup idea, examine the provided real-time search context, and generate a comprehensive, highly accurate competitor analysis, lead generation profile, recommendation set, and founder dashboard.

You must strictly output a valid JSON object matching the requested schema. Do not include markdown formatting or extra text outside the JSON.

Please pay close attention to the following criteria:
1. EXPLAINABILITY:
   - For every competitor, market insight, lead, and recommendation, you must include a confidenceScore (0 to 100) indicating your confidence.
   - For each competitor and market insight, classify the evidenceType as:
     * 'verified': Directly supported by explicit facts in the search context.
     * 'ai_inferred': Logically deduced from available trends, competitor profiles, or common business models.
     * 'assumption': Plausible estimate or baseline scenario where direct evidence is missing.
   - Include actual URL references in the sources arrays when present in the search context. Do not invent domains.

2. QUANTITY AND DETAIL:
   - You must identify at least 5 relevant competitors.
   - For each competitor, provide 3 to 5 key features, pricing tiers (if available, otherwise estimate custom/free), positioning, target audience, and strengths/weaknesses.
   - The featureComparison matrix must map 6-10 key features across all competitors (including 'Our Product').
   - Provide exactly 5 items for whatToBuildNext, biggestThreats, leadsToContactFirst, and missingOpportunities in the dashboard section.
   - Provide a list of at least 5 action items for the founder for 'actionsToday'.
   - Provide exactly 15 recommendations: 5 product, 5 market, and 5 sales recommendations. Each recommendation must include deep, founder-level business reasoning.

3. REALISM:
   - Identify realistic B2B or B2C leads (companies that would actually buy this or partner, and the specific decision-maker job titles, email conventions, and why they would convert).`;

export function getAnalysisPrompt(
  productName: string,
  description: string,
  websiteUrl?: string,
  companyName?: string,
  searchContext?: string
): string {
  return `
User Product Information:
- Product Name: ${productName}
${companyName ? `- Company Name: ${companyName}\n` : ""}
${websiteUrl ? `- Product Website URL: ${websiteUrl}\n` : ""}
- Description: ${description}

Real-time Search Context (fetched from Tavily Search):
${searchContext || "No search context available. Use general industry knowledge."}

Task:
Perform a comprehensive competitor analysis, market landscape assessment, lead generation mapping, and recommendation build.

You MUST format your output strictly as a JSON object matching this exact structure:
{
  "competitors": [
    {
      "name": "string",
      "website": "string",
      "description": "string",
      "features": [
        { "name": "string", "status": "available | missing | partial", "details": "string (optional)" }
      ],
      "pricing": [
        { "name": "string", "price": "string", "period": "monthly | yearly | one-time | custom | free" }
      ],
      "targetAudience": "string",
      "positioning": "string",
      "valueProposition": "string",
      "strengths": ["string"],
      "weaknesses": ["string"],
      "marketShare": "string (optional)",
      "confidenceScore": number (0-100),
      "evidenceType": "verified | ai_inferred | assumption",
      "sources": ["string"]
    }
  ],
  "featureComparison": {
    "rows": [
      {
        "featureName": "string",
        "ourProduct": boolean,
        "competitors": {
          "Competitor Name 1": boolean,
          "Competitor Name 2": boolean
        }
      }
    ],
    "competitorNames": ["string"]
  },
  "marketInsights": [
    {
      "title": "string",
      "description": "string",
      "confidenceScore": number (0-100),
      "evidenceType": "verified | ai_inferred | assumption",
      "sources": ["string"]
    }
  ],
  "recommendations": [
    {
      "id": "string",
      "category": "product | market | sales",
      "title": "string",
      "description": "string",
      "reasoning": "string",
      "priority": "high | medium | low"
    }
  ],
  "leads": [
    {
      "companyName": "string",
      "website": "string",
      "industry": "string",
      "employeeSize": "string",
      "location": "string",
      "contactPerson": "string",
      "jobTitle": "string",
      "linkedin": "string (optional)",
      "email": "string (optional)",
      "additionalInfo": "string (optional)",
      "confidenceScore": number (0-100),
      "sources": ["string"]
    }
  ],
  "dashboard": {
    "whatToBuildNext": [
      { "featureName": "string", "reasoning": "string", "impact": "high | medium | low" }
    ],
    "biggestThreats": [
      { "competitorName": "string", "threatLevel": "critical | high | medium | low", "reasoning": "string" }
    ],
    "leadsToContactFirst": [
      { "companyName": "string", "contactPerson": "string", "jobTitle": "string", "reasonToContact": "string" }
    ],
    "missingOpportunities": [
      { "title": "string", "description": "string", "potentialValue": "string" }
    ],
    "actionsToday": [
      { "task": "string", "priority": "high | medium | low", "context": "string" }
    ]
  }
}

Ensure the output is strictly valid JSON matching this schema. Double-check that all properties (such as period, evidenceType, status, priority, threatLevel, impact) use the exact enum values defined. Do not wrap the JSON or include any extra text.
`;
}
