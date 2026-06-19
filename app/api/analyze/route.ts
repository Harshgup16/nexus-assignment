import { NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/lib/analyzer";
import { z } from "zod";

// Simple in-memory cache for demo/performance requirements
// Hashed input maps to [AnalysisResult, timestamp]
const cache = new Map<string, [any, number]>();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes cache for quick testing

// Simple in-memory rate limiting map
const ipRequestHistory = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10; // Max 10 requests per minute per IP

const InputValidationSchema = z.object({
  productName: z.string().optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  companyName: z.string().optional().or(z.literal("")),
}).refine((data) => {
  const p = (data.productName || "").trim();
  const d = (data.description || "").trim();
  const w = (data.websiteUrl || "").trim();
  const c = (data.companyName || "").trim();
  return p.length > 0 || d.length > 0 || w.length > 0 || c.length > 0;
}, {
  message: "Please provide at least one input field to begin analysis."
}).refine((data) => {
  const p = (data.productName || "").trim();
  if (p.length > 0 && p.length < 2) return false;
  return true;
}, {
  message: "Product Name must be at least 2 characters if provided."
}).refine((data) => {
  const d = (data.description || "").trim();
  if (d.length > 0 && d.length < 10) return false;
  return true;
}, {
  message: "Description must be at least 10 characters long if provided."
});

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const history = ipRequestHistory.get(ip) || [];
  
  // Filter out expired timestamps
  const activeHistory = history.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (activeHistory.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  
  activeHistory.push(now);
  ipRequestHistory.set(ip, activeHistory);
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    
    // 1. Rate Limiting Check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => ({}));
    
    // 2. Input Validation & Sanitization
    const validationResult = InputValidationSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.issues.map((e: any) => e.message).join(" ") },
        { status: 400 }
      );
    }

    const { productName, description, websiteUrl, companyName } = validationResult.data;

    // 3. Cache Check & Deduplication
    const inputHash = JSON.stringify({
      p: (productName || "").trim().toLowerCase(),
      d: (description || "").trim().toLowerCase(),
      w: (websiteUrl || "").trim().toLowerCase(),
      c: (companyName || "").trim().toLowerCase(),
    });

    const cachedEntry = cache.get(inputHash);
    const now = Date.now();

    if (cachedEntry) {
      const [result, timestamp] = cachedEntry;
      if (now - timestamp < CACHE_TTL_MS) {
        console.log("Cache HIT. Returning cached analysis results.");
        return NextResponse.json(result);
      } else {
        cache.delete(inputHash); // Cache expired
      }
    }

    // 4. Run Live Analysis / Mock Analysis (handled internally in runAnalysis)
    const result = await runAnalysis(
      productName || "",
      description || "",
      websiteUrl || undefined,
      companyName || undefined
    );

    // Save to Cache
    cache.set(inputHash, [result, now]);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("API endpoint error:", error);
    return NextResponse.json(
      { error: error?.message || "An unexpected error occurred during competitor analysis." },
      { status: 500 }
    );
  }
}
