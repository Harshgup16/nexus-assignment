import { tavily } from "@tavily/core";

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface TavilySearchResponse {
  query: string;
  results: SearchResult[];
}

/**
 * Extract the most meaningful *industry / domain* keywords from a description.
 * Strips location words (cities, countries), generic business words, and
 * pronouns so the resulting query targets the vertical, not the geography.
 */
function extractDomainKeywords(description: string, limit = 8): string[] {
  if (!description) return [];

  const cleanDesc = description.replace(/[^a-zA-Z0-9 ]/g, " ");
  const words = cleanDesc.split(/\s+/).filter((w) => w.length > 2);

  // Expanded stop-word set: generic business terms + location words + pronouns
  const stopWords = new Set([
    // generic
    "about", "their", "there", "these", "those", "would", "other", "using",
    "which", "where", "under", "while", "after", "before", "helps", "help",
    "based", "startup", "concept", "company", "product", "ideal", "the",
    "and", "for", "with", "its", "are", "has", "have", "that", "this",
    "from", "also", "can", "will", "use", "our", "who", "how", "what",
    "been", "into", "more", "most", "such", "than", "not", "but", "all",
    "any", "each", "them", "then", "only", "very", "just", "being",
    // location & geography — do NOT waste query budget on these
    "india", "indian", "surat", "gujarat", "mumbai", "delhi", "bangalore",
    "bengaluru", "hyderabad", "pune", "chennai", "kolkata", "ahmedabad",
    "rajkot", "vadodara", "jaipur", "noida", "gurgaon", "asia", "global",
    "city", "state", "country", "region", "local", "national",
    // size / audience
    "individuals", "individual", "businesses", "business", "customers",
    "users", "people", "organizations", "organisations",
  ]);

  const seen = new Set<string>();
  const filtered: string[] = [];

  for (const w of words) {
    const lower = w.toLowerCase();
    if (stopWords.has(lower)) continue;
    if (seen.has(lower)) continue;
    seen.add(lower);
    filtered.push(w);
    if (filtered.length >= limit) break;
  }

  return filtered;
}

/**
 * Build multiple, purpose-specific search queries so Tavily returns
 * competitive-landscape data rather than just the brand's own pages.
 */
function buildSearchQueries(
  productName: string,
  description: string,
  websiteUrl?: string,
  companyName?: string
): string[] {
  const keywords = extractDomainKeywords(description, 8);
  const keywordStr = keywords.join(" ");
  const name = (productName || companyName || "").trim();

  const queries: string[] = [];

  // Query 1 — direct competitor lookup using industry keywords
  if (keywordStr) {
    queries.push(`${keywordStr} software competitors comparison ${new Date().getFullYear()}`);
  }

  // Query 2 — pricing & features comparison in the vertical
  if (keywordStr) {
    queries.push(`best ${keywords.slice(0, 4).join(" ")} tools pricing features reviews`);
  }

  // Query 3 — brand + competitors (if a name exists)
  if (name) {
    queries.push(`${name} alternatives competitors market`);
  }

  // Fallback if we somehow have nothing
  if (queries.length === 0) {
    queries.push("startup competitor analysis tools");
  }

  return queries;
}

export async function performWebSearch(
  productName: string,
  description: string,
  websiteUrl?: string,
  companyName?: string
): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;

  if (!apiKey) {
    console.warn(
      "TAVILY_API_KEY is not defined in environment variables. Falling back to default mock search context."
    );
    return getMockSearchContext(productName, description);
  }

  try {
    const tvly = tavily({ apiKey });

    const queries = buildSearchQueries(productName, description, websiteUrl, companyName);

    console.log(`Performing ${queries.length} Tavily searches:`);
    queries.forEach((q, i) => console.log(`  Query ${i + 1}: "${q}"`));

    const searchPromises = queries.map((q) =>
      tvly
        .search(q, { searchDepth: "advanced", maxResults: 5 })
        .catch((e: Error) => {
          console.error(`Tavily search failed for: "${q}"`, e);
          return { results: [] };
        })
    );

    const responses = await Promise.all(searchPromises);
    const allResults = responses.flatMap((r) => r.results || []);

    if (allResults.length === 0) {
      console.warn("Tavily returned zero results across all queries. Using mock search context.");
      return getMockSearchContext(productName, description);
    }

    // Deduplicate by URL and sort by score descending
    const seen = new Set<string>();
    const unique = allResults.filter((r) => {
      if (seen.has(r.url)) return false;
      seen.add(r.url);
      return true;
    });
    unique.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Format search results into a clean text block for the LLM
    const formattedContext = unique
      .slice(0, 15) // top 15 unique sources
      .map(
        (r, index) =>
          `Source [${index + 1}]: ${r.title}\nURL: ${r.url}\nContent Summary: ${r.content}\n---`
      )
      .join("\n\n");

    console.log(`Tavily returned ${unique.length} unique results (using top ${Math.min(unique.length, 15)}).`);

    return formattedContext;
  } catch (error) {
    console.error("Failed to execute Tavily Search:", error);
    return getMockSearchContext(productName, description);
  }
}

function getMockSearchContext(productName: string, description: string): string {
  return `
Mock Search Context (Tavily Fallback):
Query: "${productName} competitors and alternatives"
- Alternative startups exist in this space offering similar services.
- Pricing in this category typically ranges from $15/month for individuals to $99/month for teams and custom plans for enterprises.
- Key features users look for in this segment include automated reporting, user-friendly dashboard, integration with popular CRMs, and real-time alerts.
- Major competitors in this field generally target startup founders, product managers, and marketing teams.
- Common strengths include established brand trust and polished mobile applications, while common weaknesses are slow support times and high pricing tiers.
  `;
}
