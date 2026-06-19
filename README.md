# EnviroWealth Market Intelligence Competitor Analyzer

EnviroWealth Market Intelligence is a powerful, AI-driven market intelligence, competitor analysis, and lead generation dashboard built for founders and startups. It performs real-time competitor research, formats structured insights, highlights market gaps and risks, generates high-quality sales leads, and offers a comprehensive roadmap of priority actions.

---

## 🚀 Key Features

* **Real-time Web Search & Context Gathering**: Integrated with Tavily Search API to retrieve active, current web data about competitor startups, pricing, and product offerings.
* **Granular Parallel AI Analysis**: Employs Groq Cloud API (`llama-3.3-70b-versatile` model) with three parallel text generation calls (Competitors, Leads, and Strategic Recommendations). This bypasses the typical 4KB output limits and prevents structured schema validation failures.
* **Interactive Data Visualizations**: Built-in Recharts charts including:
  * Pricing Comparison Chart (Starter/Basic tier plans compared directly).
  * Competitor Positioning Map (Innovation Index vs. Market Share positioning).
  * Market Landscape Radar (Comparing Feature Completeness, API Reliability, Customer Success, and Data Accuracy).
  * Feature Gap Analysis (Adoption rates showing missing opportunities).
* **B2B Lead Generation & ICP Profiling**: Identifies potential target buyers, contact personas, email formulas, LinkedIn profiles, and match confidence scores.
* **Robust Exports**: Single-click PDF export for the full analysis report and CSV export for B2B leads.
* **Resiliency & Performance**: Includes input sanitization via Zod, rate limiting (10 req/min per IP), and a 2-minute local in-memory cache to prevent duplicate external API calls.

---

## 🛠️ Tech Stack

* **Frontend**: Next.js 15 (App Router), React 19, TypeScript, Lucide Icons, Recharts, html2canvas, jsPDF.
* **Backend**: Next.js Route Handlers (Serverless API).
* **AI & Search API Services**: Groq AI Cloud SDK (`llama-3.3-70b-versatile`), Tavily Web Search API.
* **Aesthetics**: Premium Dark theme using Custom CSS glassmorphism, Satoshi modern typography, HSL tailored variables, and micro-interactions.

---

## 💻 Setup & Installation Instructions

### Prerequisites
Ensure you have **Node.js (v18.x or higher)** and **npm** installed on your system.

### 1. Clone & Install Dependencies
Navigate into your workspace directory and install required npm packages:
```bash
npm install
```

### 2. Configure Environment Variables
Create a file named `.env` in the root directory (or modify the existing one) and fill in the API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
TAVILY_API_KEY=your_tavily_api_key_here
```
*(Make sure not to commit this file to version control. It is already ignored by `.gitignore`)*

### 3. Run Development Server
Start the local server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your web browser to access the dashboard.

---

## 🏛️ Architecture Overview

The application follows a clean Next.js App Router layout with clear separation of concerns:

```
├── app/
│   ├── api/
│   │   └── analyze/
│   │       └── route.ts         # Server-side API endpoint: Rate limits, cache validation & route entry
│   ├── layout.tsx               # Root layout setup & CDN font styling
│   └── page.tsx                 # Main client page (handles loading, analysis state, landing form)
├── components/
│   ├── analysis/
│   │   ├── AnalysisDashboard.tsx # Continuous vertical report, Recharts graphics & export buttons
│   └── ui/
│       └── index.tsx            # Styled atomic reusable components (Card, Button, Badge)
├── lib/
│   ├── analyzer.ts              # Analysis Orchestrator: Tavily lookup + parallel Groq API prompts
│   ├── prompts.ts               # Sectional instructions and delimiter formats
│   ├── schemas.ts               # Zod input schemas for validation
│   ├── tavily.ts                # Web search helper
│   └── types.ts                 # TypeScript type interfaces mapping the pipeline objects
```

### Key Design Decisions & Optimization
1. **Parallel Execution**: Moving away from a monolithic `generateObject` call (which regularly caused `AI_NoObjectGeneratedError` or truncation on Groq) to three parallel `generateText` requests. This improves response latency and guarantees detail-rich outputs.
2. **Text Parsing**: Delimiter parsing (`---COMPETITOR---`, `---LEAD---`) allows flexible, non-blocking string formatting and converts markdown representations into strong TypeScript objects safely.

---

## 📋 Assumptions Made

1. **Competitor Pricing**: When specific pricing is missing from a competitor's public site, the analyzer defaults to a basic subscription model estimate ($29) to populate visual comparison charts.
2. **Leads Contact Details**: If contact details are not explicitly exposed via web search indexes, email addresses are constructed using common corporate pattern guidelines (`first.last@company.com`) and marked with an AI inference indicator.
3. **Evidence Type**: Analysis fields distinguish between `verified` (retrieved from search documents), `inferred` (logical deductions made by the AI model), and `assumptions` (heuristic-based suggestions) to prevent acting as a "black box".
