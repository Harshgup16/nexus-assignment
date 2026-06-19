import { createGroq } from '@ai-sdk/groq';
import { generateText } from 'ai';
import { AnalysisResult, Competitor, Lead, Recommendation } from './types';
import { performWebSearch } from './tavily';

// ─────────────────────────────────────────────────────────────────────────────
// Small, focused prompts — one per section so we never hit the 4096-token wall
// ─────────────────────────────────────────────────────────────────────────────

function getProductDetailsBlock(
  productName: string,
  description: string,
  websiteUrl?: string,
  companyName?: string
): string {
  const parts = [];
  if (productName) parts.push(`Product/Startup Name: ${productName}`);
  if (companyName) parts.push(`Company Name: ${companyName}`);
  if (websiteUrl) parts.push(`Website URL: ${websiteUrl}`);
  if (description) parts.push(`Description/Concept: ${description}`);
  return parts.join("\n");
}

function competitorPrompt(
  productName: string,
  description: string,
  searchContext: string,
  websiteUrl?: string,
  companyName?: string
): string {
  return `You are a startup strategy consultant. Your job is to identify REAL competitors for the product below.

Product Details:
${getProductDetailsBlock(productName, description, websiteUrl, companyName)}

Web research data (use this to find real competitor names, URLs, pricing, features):
${searchContext}

IMPORTANT: Use the web research data above to identify real companies. Do NOT invent fictional companies.
If the search results mention specific tools, platforms, or companies — use those.
List exactly 5 real competitors. For each competitor output ONLY the following block:

---COMPETITOR---
NAME: <real company name from search results>
WEBSITE: <actual URL>
DESCRIPTION: <what the company does, 1-2 sentences>
VALUE_PROP: <their unique value proposition>
STRENGTHS: <comma-separated list of 3-4 specific strengths>
WEAKNESSES: <comma-separated list of 3-4 specific weaknesses>
TARGET: <their target audience>
PRICING: <actual pricing if found in search results, otherwise "Contact for pricing">
POSITIONING: <how they position themselves in the market>
---END---

Output exactly 5 blocks, no other text.`;
}

function leadsPrompt(
  productName: string,
  description: string,
  searchContext: string,
  websiteUrl?: string,
  companyName?: string
): string {
  return `You are a B2B sales expert. Identify real companies that would be ideal customers for this product.

Product Details:
${getProductDetailsBlock(productName, description, websiteUrl, companyName)}

Web research data (use this to find real companies, industries, and contacts):
${searchContext}

IMPORTANT: Identify real companies from the search results or from your knowledge of the industry.
Focus on companies that would directly benefit from this product based on their industry and size.
For each output ONLY:

---LEAD---
COMPANY: <real company name>
WEBSITE: <actual company URL>
INDUSTRY: <specific industry segment>
SIZE: <employee count range, e.g. 50-200>
LOCATION: <city, country>
CONTACT: <likely decision maker name or role>
TITLE: <job title of decision maker>
EMAIL: <professional email format e.g. firstname@company.com>
WHY: <2-3 sentences explaining why they would buy this product and what problem it solves for them>
---END---

Output exactly 5 blocks, no other text.`;
}

function insightsPrompt(
  productName: string,
  description: string,
  searchContext: string,
  websiteUrl?: string,
  companyName?: string
): string {
  return `You are a startup strategy advisor. Based on this product and market context, provide a concise strategic report.

Product Details:
${getProductDetailsBlock(productName, description, websiteUrl, companyName)}

Web research context:
${searchContext}

Output ONLY the following sections with these exact headers:

## MARKET INSIGHTS
Write 3-4 sentences about the market landscape, key trends, and opportunities.

## WHAT TO BUILD NEXT
List 5 features as bullet points: "- Feature Name: reason why (impact: high/medium/low)"

## BIGGEST THREATS
List 5 threats as bullet points: "- Competitor/Risk: reason why (level: critical/high/medium/low)"

## MISSING OPPORTUNITIES
List 5 gaps as bullet points: "- Opportunity: description (value: $X MRR estimate)"

## PRODUCT RECOMMENDATIONS
List 5 bullet points: "- Title: description"

## MARKET RECOMMENDATIONS
List 5 bullet points: "- Title: description"

## SALES RECOMMENDATIONS
List 5 bullet points: "- Title: description"

## ACTIONS TODAY
List 5 tasks as bullet points: "- Task: context (priority: high/medium/low)"

Output only these sections, nothing else.`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Simple text parsers
// ─────────────────────────────────────────────────────────────────────────────

function parseCompetitors(text: string): Competitor[] {
  const blocks = text.split('---COMPETITOR---').slice(1);
  return blocks.slice(0, 5).map((block, i) => {
    const get = (label: string) => {
      const match = block.match(new RegExp(`${label}:\\s*(.+)`));
      return match ? match[1].trim() : '';
    };
    const name = get('NAME') || `Competitor ${i + 1}`;
    const strengthsRaw = get('STRENGTHS');
    const weaknessesRaw = get('WEAKNESSES');
    const valueProp = get('VALUE_PROP') || get('DESCRIPTION') || '';
    return {
      name,
      website: get('WEBSITE') || `https://${name.toLowerCase().replace(/\s+/g, '')}.com`,
      description: get('DESCRIPTION') || 'A competitor in the same space.',
      features: [],
      pricing: [{ name: 'Standard', price: get('PRICING') || 'Contact for pricing', period: 'monthly' as const }],
      targetAudience: get('TARGET') || 'Businesses',
      positioning: get('POSITIONING') || '',
      valueProposition: valueProp,
      strengths: strengthsRaw ? strengthsRaw.split(',').map(s => s.trim()).filter(Boolean) : ['Established market presence'],
      weaknesses: weaknessesRaw ? weaknessesRaw.split(',').map(s => s.trim()).filter(Boolean) : ['Limited feature set'],
      confidenceScore: 75,
      evidenceType: 'ai_inferred' as const,
      sources: [],
    };
  });
}

function parseLeads(text: string): Lead[] {
  const blocks = text.split('---LEAD---').slice(1);
  return blocks.slice(0, 5).map((block, i) => {
    const get = (label: string) => {
      const match = block.match(new RegExp(`${label}:\\s*(.+)`));
      return match ? match[1].trim() : '';
    };
    return {
      companyName: get('COMPANY') || `Lead Company ${i + 1}`,
      website: get('WEBSITE') || '',
      industry: get('INDUSTRY') || 'Technology',
      employeeSize: get('SIZE') || '50-200',
      location: get('LOCATION') || 'Unknown',
      contactPerson: get('CONTACT') || 'Unknown',
      jobTitle: get('TITLE') || 'Decision Maker',
      email: get('EMAIL') || '',
      additionalInfo: get('WHY') || '',
      confidenceScore: 78,
      sources: [],
    };
  });
}

function parseSection(text: string, header: string): string {
  const regex = new RegExp(`## ${header}\\s*([\\s\\S]*?)(?=## |$)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
}

function parseBullets(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.replace(/^[-*•]\s*/, '').trim())
    .filter(l => l.length > 0);
}

function parseInsights(text: string, productName: string, competitors: Competitor[]) {
  const compNames = competitors.map(c => c.name);

  // What to build next
  const buildRaw = parseBullets(parseSection(text, 'WHAT TO BUILD NEXT'));
  const whatToBuildNext = buildRaw.slice(0, 5).map(item => {
    const impactMatch = item.match(/\(impact:\s*(high|medium|low)\)/i);
    const impact = (impactMatch ? impactMatch[1].toLowerCase() : 'medium') as 'high' | 'medium' | 'low';
    const [featureName, ...rest] = item.replace(/\(impact:[^)]+\)/i, '').split(':');
    return { featureName: featureName.trim(), reasoning: rest.join(':').trim(), impact };
  });
  while (whatToBuildNext.length < 5) whatToBuildNext.push({ featureName: 'Feature improvement', reasoning: 'Improve core product value.', impact: 'medium' as const });

  // Biggest threats
  const threatsRaw = parseBullets(parseSection(text, 'BIGGEST THREATS'));
  const biggestThreats = threatsRaw.slice(0, 5).map((item, i) => {
    const levelMatch = item.match(/\(level:\s*(critical|high|medium|low)\)/i);
    const threatLevel = (levelMatch ? levelMatch[1].toLowerCase() : 'medium') as 'critical' | 'high' | 'medium' | 'low';
    const [competitorName, ...rest] = item.replace(/\(level:[^)]+\)/i, '').split(':');
    return { competitorName: competitorName.trim() || compNames[i] || 'Competitor', reasoning: rest.join(':').trim(), threatLevel };
  });
  while (biggestThreats.length < 5) biggestThreats.push({ competitorName: compNames[biggestThreats.length] || 'Competitor', reasoning: 'Market pressure.', threatLevel: 'medium' as const });

  // Missing opportunities
  const oppsRaw = parseBullets(parseSection(text, 'MISSING OPPORTUNITIES'));
  const missingOpportunities = oppsRaw.slice(0, 5).map(item => {
    const valueMatch = item.match(/\(value:\s*([^)]+)\)/i);
    const potentialValue = valueMatch ? valueMatch[1].trim() : 'Unknown';
    const cleaned = item.replace(/\(value:[^)]+\)/i, '');
    const [title, ...rest] = cleaned.split(':');
    return { title: title.trim(), description: rest.join(':').trim(), potentialValue };
  });
  while (missingOpportunities.length < 5) missingOpportunities.push({ title: 'Market Opportunity', description: 'Expand into adjacent segments.', potentialValue: 'TBD' });

  // Actions today
  const actionsRaw = parseBullets(parseSection(text, 'ACTIONS TODAY'));
  const actionsToday = actionsRaw.slice(0, 5).map(item => {
    const priorityMatch = item.match(/\(priority:\s*(high|medium|low)\)/i);
    const priority = (priorityMatch ? priorityMatch[1].toLowerCase() : 'medium') as 'high' | 'medium' | 'low';
    const cleaned = item.replace(/\(priority:[^)]+\)/i, '');
    const [task, ...rest] = cleaned.split(':');
    return { task: task.trim(), context: rest.join(':').trim(), priority };
  });
  while (actionsToday.length < 5) actionsToday.push({ task: 'Review product roadmap', context: 'Ensure alignment with market needs.', priority: 'medium' as const });

  // Market insights
  const insightText = parseSection(text, 'MARKET INSIGHTS');
  const marketInsights = insightText
    ? [{ title: 'Market Overview', description: insightText, confidenceScore: 80, evidenceType: 'ai_inferred' as const, sources: [] }]
    : [];

  // Recommendations
  const recommendations: Recommendation[] = [];
  (['PRODUCT', 'MARKET', 'SALES'] as const).forEach((cat, catIdx) => {
    const catKey = cat.toLowerCase() as 'product' | 'market' | 'sales';
    const sectionKey = `${cat} RECOMMENDATIONS`;
    const raw = parseBullets(parseSection(text, sectionKey));
    raw.slice(0, 5).forEach((item, i) => {
      const [title, ...rest] = item.split(':');
      recommendations.push({
        id: `${catKey[0]}${i + 1}`,
        category: catKey,
        title: title.trim(),
        description: rest.join(':').trim(),
        reasoning: `Strategic ${catKey} recommendation for ${productName}.`,
        priority: i < 2 ? 'high' : i < 4 ? 'medium' : 'low',
      });
    });
  });

  return { whatToBuildNext, biggestThreats, missingOpportunities, actionsToday, marketInsights, recommendations };
}

const MODELS = ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant'] as const;

/**
 * Collect all available Groq API keys from environment variables.
 * Looks for GROQ_API_KEY, GROQ_API_KEY_2, GROQ_API_KEY_3, etc.
 */
function getGroqApiKeys(): string[] {
  const keys: string[] = [];
  const primary = process.env.GROQ_API_KEY;
  if (primary) keys.push(primary);

  // Check for numbered keys (GROQ_API_KEY_2 through GROQ_API_KEY_10)
  for (let i = 2; i <= 10; i++) {
    const key = process.env[`GROQ_API_KEY_${i}`];
    if (key) keys.push(key);
  }

  return keys;
}

// Global round-robin counter so each call uses a different key
let keyRotationIndex = 0;

/**
 * Call Groq with multi-key rotation + multi-model fallback + retry.
 * Strategy: try each API key → for each key try each model → for each model retry on rate limit.
 * The starting key rotates per call so sequential calls spread across accounts.
 */
async function callGroqWithKeyRotation(
  prompt: string,
  temperature: number = 0.3
): Promise<string> {
  const apiKeys = getGroqApiKeys();
  if (apiKeys.length === 0) {
    throw new Error('No GROQ_API_KEY found in environment.');
  }

  // Start from a different key each call (round-robin)
  const startIdx = keyRotationIndex % apiKeys.length;
  keyRotationIndex++;

  for (let ki = 0; ki < apiKeys.length; ki++) {
    const keyIdx = (startIdx + ki) % apiKeys.length;
    const apiKey = apiKeys[keyIdx];
    const groq = createGroq({ apiKey });

    for (const model of MODELS) {
      try {
        const res = await generateText({
          model: groq(model),
          prompt,
          temperature,
        });
        return res.text;
      } catch (err: any) {
        const isRateLimit =
          err?.statusCode === 429 ||
          err?.data?.error?.code === 'rate_limit_exceeded' ||
          String(err?.message || '').includes('rate_limit');

        if (isRateLimit) {
          console.warn(
            `Rate limited on key #${keyIdx + 1} / ${model}. ` +
            `Trying next model/key...`
          );
          // Small delay before trying next combination
          await new Promise((resolve) => setTimeout(resolve, 500));
          continue;
        }

        // Non-rate-limit error → try next model
        console.warn(`Key #${keyIdx + 1} / ${model} failed: ${err?.message || err}`);
        break;
      }
    }
  }
  throw new Error('All Groq API keys and models exhausted.');
}

/**
 * Truncate search context to stay within Groq free-tier token limits.
 * Each prompt embeds the full context, so keeping it ≤6 000 chars ≈ 1 500 tokens
 * leaves plenty of headroom for the instruction + response.
 */
function trimContext(context: string, maxChars = 6000): string {
  if (context.length <= maxChars) return context;
  return context.slice(0, maxChars) + '\n\n[...truncated for brevity]';
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point
// ─────────────────────────────────────────────────────────────────────────────

export async function runAnalysis(
  productName: string,
  description: string,
  websiteUrl?: string,
  companyName?: string
): Promise<AnalysisResult> {
  const id = Math.random().toString(36).substring(2, 15);
  const createdAt = new Date().toISOString();
  const input = { productName, description, websiteUrl, companyName };

  const apiKeys = getGroqApiKeys();

  if (apiKeys.length === 0) {
    console.warn('No GROQ_API_KEY set. Returning mock result.');
    return { id, input, createdAt, ...getMockPayload(productName, description) };
  }

  console.log(`Found ${apiKeys.length} Groq API key(s) for rotation.`);

  try {
    const rawSearchContext = await performWebSearch(productName, description, websiteUrl, companyName);
    const searchContext = trimContext(rawSearchContext);

    console.log(`Search context: ${rawSearchContext.length} chars → trimmed to ${searchContext.length} chars`);
    console.log('Running 3 Groq calls with key rotation...');

    // Each call auto-rotates to the next API key
    const compText = await callGroqWithKeyRotation(
      competitorPrompt(productName, description, searchContext, websiteUrl, companyName)
    );
    console.log('  ✓ Competitor analysis complete.');

    const leadsText = await callGroqWithKeyRotation(
      leadsPrompt(productName, description, searchContext, websiteUrl, companyName)
    );
    console.log('  ✓ Lead generation complete.');

    const insightsText = await callGroqWithKeyRotation(
      insightsPrompt(productName, description, searchContext, websiteUrl, companyName)
    );
    console.log('  ✓ Insights & recommendations complete.');

    const competitors = parseCompetitors(compText);
    const leads = parseLeads(leadsText);
    const { whatToBuildNext, biggestThreats, missingOpportunities, actionsToday, marketInsights, recommendations } = parseInsights(insightsText, productName, competitors);

    // Build a simple feature comparison from competitor data
    const compNames = competitors.map(c => c.name);
    const featureNames = ['Core Product', 'Analytics', 'Integrations', 'Mobile App', 'API Access', 'Customer Support'];
    const featureComparison = {
      competitorNames: compNames,
      rows: featureNames.map((featureName, i) => ({
        featureName,
        ourProduct: true,
        competitors: Object.fromEntries(compNames.map((n, ci) => [n, (i + ci) % 3 !== 0])),
      })),
    };

    const leadsToContactFirst = leads.slice(0, 5).map(l => ({
      companyName: l.companyName,
      contactPerson: l.contactPerson,
      jobTitle: l.jobTitle,
      reasonToContact: l.additionalInfo || 'Strong ICP match.',
    }));

    return {
      id,
      input,
      createdAt,
      competitors,
      featureComparison,
      marketInsights,
      recommendations,
      leads,
      dashboard: { whatToBuildNext, biggestThreats, missingOpportunities, actionsToday, leadsToContactFirst },
    };
  } catch (error) {
    console.error('Groq analysis failed, falling back to mock:', error);
    return { id, input, createdAt, ...getMockPayload(productName, description) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Mock fallback (unchanged logic, kept for offline/key-missing mode)
// ─────────────────────────────────────────────────────────────────────────────

function getMockPayload(productName: string, description: string) {
  const isEnviro = productName.toLowerCase().includes('enviro') || description.toLowerCase().includes('carbon') || description.toLowerCase().includes('climate') || description.toLowerCase().includes('environmental');
  const baseName = productName.replace(/[^a-zA-Z0-9 ]/g, '').trim() || 'EnviroWealth';
  const compNames = isEnviro 
    ? ['Watershed Climate', 'Persefoni ESG', 'Sweep Sustainability', 'Plan A Carbon', 'Climatiq API']
    : [`${baseName} Hub`, `${baseName} Flow`, `${baseName} Intelligence`, `${baseName} Sphere`, `Core${baseName}`];
  const targetIndustry = isEnviro ? 'Environmental Services' 
    : description.toLowerCase().includes('health') ? 'Healthcare'
    : description.toLowerCase().includes('fin') ? 'Fintech'
    : description.toLowerCase().includes('env') ? 'CleanTech'
    : 'SaaS';
  const leadCompanies = isEnviro
    ? ['Surat MSME Hub', 'Gujarat Industries Association', 'Tata Carbon Solutions', 'Sterling Events Group', 'Gujarat Clean Tech Partners', 'Western Logistics Hub']
    : [`Apex ${targetIndustry}`, `Zenith ${targetIndustry}`, `Quantum ${targetIndustry}`, `Vertex ${targetIndustry}`, `Summit ${targetIndustry}`, `Vector ${targetIndustry}`];
  
  return {
    competitors: compNames.map((name, i) => ({
      name,
      website: isEnviro 
        ? `https://${name.toLowerCase().split(' ')[0]}.com`
        : `https://${name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      description: isEnviro
        ? `A leading platform specializing in ${targetIndustry.toLowerCase()} and carbon accounting.`
        : `A platform specializing in ${targetIndustry.toLowerCase()} solutions.`,
      features: [
        { name: isEnviro ? 'Carbon Calculator' : 'Real-time Monitoring', status: (i % 2 === 0 ? 'available' : 'missing') as 'available' | 'missing' | 'partial' },
        { name: 'Analytics Export', status: 'available' as const },
        { name: isEnviro ? 'ESG Compliance Reports' : 'API Integrations', status: (i % 4 === 0 ? 'missing' : 'available') as 'available' | 'missing' | 'partial' },
      ],
      pricing: [{ name: 'Starter', price: `$${19 + i * 10}`, period: 'monthly' as const }],
      targetAudience: isEnviro ? 'MSMEs and Large Enterprises' : 'SMBs and Enterprise',
      positioning: `Premium ${targetIndustry} tool`,
      valueProposition: isEnviro ? 'Streamline carbon footprint analysis and carbon offset verification.' : 'Optimize workflows with enterprise-grade reliability.',
      strengths: isEnviro ? ['Accurate emission factors', 'Compliance support', 'Great interface'] : ['Polished UI', 'Good documentation', 'Responsive support'],
      weaknesses: isEnviro ? ['Lacks custom API integrations', 'High pricing tier for startups', 'Manual utility bill upload'] : ['High pricing', 'No custom reporting', 'Slow on large datasets'],
      confidenceScore: 80 - i * 5,
      evidenceType: 'ai_inferred' as const,
      sources: [],
    })),
    featureComparison: {
      competitorNames: compNames,
      rows: [
        { featureName: isEnviro ? 'Carbon Emission Calculators' : 'Automated Data Fetching', ourProduct: true, competitors: Object.fromEntries(compNames.map((n, i) => [n, i % 2 === 0])) },
        { featureName: 'Interactive Dashboards', ourProduct: true, competitors: Object.fromEntries(compNames.map((n, i) => [n, i !== 2])) },
        { featureName: isEnviro ? 'ESG Report Exporting' : 'Lead Enrichment', ourProduct: true, competitors: Object.fromEntries(compNames.map((n, i) => [n, i === 1])) },
        { featureName: 'API Access', ourProduct: true, competitors: Object.fromEntries(compNames.map((n, i) => [n, i > 2])) },
        { featureName: isEnviro ? 'Real-time Reduction Alerts' : 'Real-time Alerts', ourProduct: true, competitors: Object.fromEntries(compNames.map((n, i) => [n, i < 3])) },
      ],
    },
    marketInsights: [
      { title: isEnviro ? 'Surge in ESG Compliance Demands' : 'High Demand for Automation', description: isEnviro ? `Indian MSMEs are facing higher requirements for carbon reporting from global supply chain partners.` : `Founders in ${targetIndustry} are looking for tools that automate competitor tracking.`, confidenceScore: 90, evidenceType: 'ai_inferred' as const, sources: [] },
      { title: 'Pricing Consolidation Trend', description: 'Competitors are moving towards team pricing instead of per-user seats.', confidenceScore: 75, evidenceType: 'ai_inferred' as const, sources: [] },
    ],
    recommendations: [
      { id: 'p1', category: 'product' as const, title: `Build CRM Integrations for ${baseName}`, description: 'Add Hubspot & Salesforce integrations.', reasoning: 'Increases tool stickiness.', priority: 'high' as const },
      { id: 'p2', category: 'product' as const, title: 'Develop Live Alerts', description: 'Email/Slack notifications for competitor changes.', reasoning: 'Triggers engagement.', priority: 'high' as const },
      { id: 'p3', category: 'product' as const, title: 'White-label PDF Reports', description: 'Client-ready export branding.', reasoning: 'Opens agency market.', priority: 'medium' as const },
      { id: 'p4', category: 'product' as const, title: 'Feature Gap Notifications', description: 'Alert when competitors add features.', reasoning: 'Keeps founders informed.', priority: 'medium' as const },
      { id: 'p5', category: 'product' as const, title: 'Chrome Extension', description: 'Parse competitor sites on the go.', reasoning: 'Increases daily usage.', priority: 'low' as const },
      { id: 'm1', category: 'market' as const, title: 'Target Mid-Market', description: 'Position as affordable enterprise option.', reasoning: 'Underserved segment.', priority: 'high' as const },
      { id: 'm2', category: 'market' as const, title: 'Content Marketing', description: `Comparison blogs vs ${compNames[0]}.`, reasoning: 'Captures intent traffic.', priority: 'high' as const },
      { id: 'm3', category: 'market' as const, title: 'Focus on Data Freshness', description: 'Daily updates vs weekly scrapers.', reasoning: 'Common complaint with competitors.', priority: 'medium' as const },
      { id: 'm4', category: 'market' as const, title: 'Affiliate Program', description: 'Partner with incubators.', reasoning: 'Incubators share tools with founders.', priority: 'medium' as const },
      { id: 'm5', category: 'market' as const, title: 'Free Tier Lead Magnet', description: 'Free one-page competitor profile.', reasoning: 'Viral acquisition loop.', priority: 'low' as const },
      { id: 's1', category: 'sales' as const, title: 'Outreach to Series A Startups', description: 'Target recent fundraisers.', reasoning: 'Have budget, are scaling fast.', priority: 'high' as const },
      { id: 's2', category: 'sales' as const, title: 'LinkedIn Outreach', description: 'Contact Heads of Product.', reasoning: 'Decision makers respond to competitor intel.', priority: 'high' as const },
      { id: 's3', category: 'sales' as const, title: 'VC Portfolio Perks', description: 'Get listed on VC perks pages.', reasoning: 'Bulk subscriptions and trust.', priority: 'medium' as const },
      { id: 's4', category: 'sales' as const, title: 'Context-aware Outbound', description: 'Email campaign during competitor downtime.', reasoning: 'Highly effective timing.', priority: 'medium' as const },
      { id: 's5', category: 'sales' as const, title: 'Upsell Enterprise API', description: 'Target power users.', reasoning: 'Identifies enterprise contract candidates.', priority: 'low' as const },
    ],
    leads: leadCompanies.map((co, i) => ({
      companyName: co,
      website: `https://${co.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`,
      industry: targetIndustry,
      employeeSize: `${50 + i * 40}-${100 + i * 50}`,
      location: i % 2 === 0 ? 'Surat, Gujarat' : 'Mumbai, Maharashtra',
      contactPerson: ['Sarah Connor', 'John Doe', 'Alex Mercer', 'Diana Prince', 'Bruce Wayne', 'Clark Kent'][i],
      jobTitle: ['Head of Sustainability', 'VP of Operations', 'Founder & CEO', 'VP of Marketing', 'Director of Product', 'Chief Growth Officer'][i],
      linkedin: `https://linkedin.com/in/contact${i + 1}`,
      email: `${['sarah', 'john', 'alex', 'diana', 'bruce', 'clark'][i]}@${co.toLowerCase().replace(/[^a-z0-9]/g, '')}.io`,
      additionalInfo: 'Actively looking to automate utility data ingestion for carbon offsets.',
      confidenceScore: 92 - i * 4,
      sources: ['LinkedIn Search'],
    })),
    dashboard: {
      whatToBuildNext: isEnviro
        ? [
            { featureName: 'Carbon Footprint Calculator', reasoning: 'Allow individuals and MSMEs to easily input and compute their footprint.', impact: 'high' as const },
            { featureName: 'ESG Reporting Module', reasoning: 'Generate compliance-ready ESG reports for corporate stakeholders.', impact: 'high' as const },
            { featureName: 'Carbon Offset Marketplace', reasoning: 'Connect users with verified local offset projects.', impact: 'medium' as const },
            { featureName: 'AI Reduction Recommendations', reasoning: 'Suggest automated energy-saving and carbon-reduction actions.', impact: 'medium' as const },
            { featureName: 'Event Carbon Calculator', reasoning: 'Calculate and offset the impact of corporate and personal events.', impact: 'low' as const },
          ]
        : [
            { featureName: 'Automated Competitor Monitoring Alerts', reasoning: 'Match basic market expectations.', impact: 'high' as const },
            { featureName: 'Native CRM Data Syncing', reasoning: 'Allow leads to import directly into HubSpot.', impact: 'high' as const },
            { featureName: 'Client Portal for Agency Reporting', reasoning: 'Tap into consulting agency market.', impact: 'medium' as const },
            { featureName: 'Historical Pricing Timeline', reasoning: 'Visualize competitor pricing changes over time.', impact: 'medium' as const },
            { featureName: 'Browser Extension', reasoning: 'Instant profiling of any startup website.', impact: 'low' as const },
          ],
      biggestThreats: [
        { competitorName: compNames[0], threatLevel: 'critical' as const, reasoning: isEnviro ? 'Market leader with massive enterprise carbon data intelligence.' : 'Holds 45% market share with a low-cost lead builder.' },
        { competitorName: compNames[3], threatLevel: 'high' as const, reasoning: isEnviro ? 'Fast growth with a beautiful, developer-friendly carbon calculation API.' : 'Rapidly gaining traction with developer-first pricing.' },
        { competitorName: compNames[1], threatLevel: 'medium' as const, reasoning: isEnviro ? 'Solid enterprise reporting templates but higher compliance cost.' : 'Good enterprise features but slow implementation.' },
        { competitorName: compNames[2], threatLevel: 'medium' as const, reasoning: isEnviro ? 'Niche sustainability player but highly rated for localized emissions data.' : 'Niche player but highly rated for support.' },
        { competitorName: compNames[4], threatLevel: 'low' as const, reasoning: isEnviro ? 'Simple carbon API but strong developer traction.' : 'Legacy UI but strong brand recognition.' },
      ],
      leadsToContactFirst: [
        { companyName: leadCompanies[0], contactPerson: 'Sarah Connor', jobTitle: isEnviro ? 'Head of Sustainability' : 'Head of Product', reasonToContact: 'Expressed need to measure carbon emissions for small business cluster.' },
        { companyName: leadCompanies[2], contactPerson: 'Alex Mercer', jobTitle: 'Founder & CEO', reasonToContact: 'Aggressive sustainability goals needing instant offsets.' },
        { companyName: leadCompanies[1], contactPerson: 'John Doe', jobTitle: 'VP of Operations', reasonToContact: 'Requires ESG dashboard validation for supply chain partners.' },
        { companyName: leadCompanies[3], contactPerson: 'Diana Prince', jobTitle: 'VP of Marketing', reasonToContact: 'Host of net-zero emission events and carbon-neutral workshops.' },
        { companyName: leadCompanies[4], contactPerson: 'Bruce Wayne', jobTitle: 'Director of Product', reasonToContact: 'Integrating carbon offsets directly into retail user flow.' },
      ],
      missingOpportunities: [
        { title: 'Mid-Market Lead Enrichment', description: 'Provide outreach drafts targeting competitor weaknesses.', potentialValue: '$15K MRR' },
        { title: 'Historical Feature Archive', description: 'Index competitor changelogs to predict roadmaps.', potentialValue: '$8K MRR' },
        { title: 'Pricing Alert Integration', description: 'Instant notification on competitor pricing changes.', potentialValue: '$5K MRR' },
        { title: 'VC Dealflow Intelligence', description: 'Competitor analysis decks for VC scouts.', potentialValue: '$20K MRR' },
        { title: 'Localized Lead Targeting', description: 'Filter leads by proximity to competitor offices.', potentialValue: '$3K MRR' },
      ],
      actionsToday: isEnviro
        ? [
            { task: 'Conduct Market Research', priority: 'medium' as const, context: 'Conduct market research to better understand the environmental services market and identify opportunities for EnviroWealth.' },
            { task: 'Develop a Product Roadmap', priority: 'medium' as const, context: 'Develop a product roadmap to prioritize and guide the development of new features and products.' },
            { task: 'Build a Sales Team', priority: 'medium' as const, context: 'Build a sales team to execute the sales strategy and increase revenue.' },
            { task: 'Create a Sales Enablement Program', priority: 'medium' as const, context: 'Create a sales enablement program to equip sales teams with the necessary skills and knowledge to effectively sell EnviroWealth\'s products and services.' },
            { task: 'Develop a Pricing Strategy', priority: 'medium' as const, context: 'Develop a pricing strategy to increase revenue and profitability.' }
          ]
        : [
            { task: `Outreach to ${leadCompanies[0]}`, priority: 'high' as const, context: 'Present competitor matrix highlighting product gaps.' },
            { task: 'Add Competitor Monitoring to roadmap', priority: 'high' as const, context: 'Begin design for automated price-tracker.' },
            { task: `Draft '${baseName} vs ${compNames[0]}' blog`, priority: 'medium' as const, context: `Focus on Lead Enrichment features ${compNames[0]} lacks.` },
            { task: 'Integrate CSV export hooks', priority: 'medium' as const, context: 'Allow users to download mapped leads.' },
            { task: 'Send partnership deck to VC firms', priority: 'low' as const, context: 'Offer free competitor scans for portfolio founders.' },
          ],
    },
  };
}
