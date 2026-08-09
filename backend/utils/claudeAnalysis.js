/**
 * utils/claudeAnalysis.js
 *
 * Generates a structured plagiarism analysis report using the Anthropic
 * Claude API (claude-sonnet-4-20250514).
 *
 * The prompt is carefully engineered to return a consistent JSON structure
 * that can be parsed and displayed in the frontend dashboard.
 */

import Anthropic from '@anthropic-ai/sdk';

let _client = null;
const getClient = () => {
  if (!_client) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set in environment variables.');
    }
    _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return _client;
};

/**
 * Build the detailed system prompt that instructs Claude to act as an
 * expert academic integrity officer.
 */
import { jsonrepair } from 'jsonrepair';
const SYSTEM_PROMPT = `You are an expert academic integrity analysis system integrated into a plagiarism detection platform. Your role is to analyse a submitted student document against matched sources and produce a structured, evidence-based plagiarism report.

You will receive:
1. The SUBMITTED TEXT from the student
2. A list of TOP MATCHED SOURCES with similarity scores
3. The COMBINED SIMILARITY SCORE (0–1 scale)

Your response MUST be a single valid JSON object — no markdown, no prose outside the JSON. Use this exact schema:

{
  "plagiarismPercentage": <integer 0-100>,
  "riskLevel": "<Low|Moderate|High|Critical>",
  "summary": "<2-3 sentence executive summary>",
  "directMatches": "<analysis of verbatim or near-verbatim copied passages>",
  "paraphrasingDetected": "<analysis of paraphrased sections, idea theft, synonym substitution>",
  "structuralSimilarity": "<analysis of structural/organisational copying>",
  "aiGeneratedPatterns": "<analysis of patterns suggesting AI-generated content>",
  "highlightedSections": [
    {
      "text": "<exact excerpt from submitted text, max 100 chars>",
      "type": "<direct_copy|paraphrase|structural|ai_generated>",
      "severity": "<low|medium|high>",
      "reason": "<brief explanation>"
    }
  ],
  "conclusion": "<final verdict and recommended action in 2-3 sentences>"
}

Risk level guidelines:
- Low: 0-20% → likely original work
- Moderate: 21-40% → some concerns, review recommended
- High: 41-70% → significant plagiarism likely
- Critical: 71-100% → severe academic integrity violation

Be objective, evidence-based, and precise. Do not speculate without evidence. Identify specific passages when possible.

CRITICAL JSON FORMATTING RULES:
- Output ONLY the raw JSON object. Do not wrap it in markdown code fences (no \`\`\`json).
- All string values must be valid JSON strings: escape any double quotes inside text with \\", and escape newlines as \\n. Do not leave literal line breaks inside a string value.
- When quoting a word, phrase, or section title inside any string value (e.g. in "summary" or "reason"), use single quotes instead of double quotes to avoid breaking the JSON.
- The "text" field in highlightedSections must not itself contain unescaped double quotes.`;
/**
 * Generate an AI plagiarism analysis report.
 *
 * @param {Object} params
 * @param {string}  params.submittedText   - The student's submission text
 * @param {Array}   params.topMatches      - Top matched documents with scores
 * @param {number}  params.combinedScore   - Weighted average similarity score (0–1)
 * @returns {Promise<Object>} parsed analysis object
 */
export async function generatePlagiarismReport({ submittedText, topMatches, combinedScore }) {
  const client = getClient();

  // Truncate submitted text if very long (Claude has generous context headroom; cost is negligible)
const truncatedText = submittedText.length > 100000
  ? submittedText.slice(0, 100000) + '\n[... text truncated for analysis ...]'
  : submittedText;

  // Format matched sources for the prompt
  const matchesSummary = topMatches.map((match, i) => `
Match ${i + 1}:
- Title: ${match.title || 'Untitled Submission'}
- TF-IDF Similarity: ${(match.tfidfScore * 100).toFixed(1)}%
- Semantic (Embedding) Similarity: ${(match.embeddingScore * 100).toFixed(1)}%
- Combined Score: ${(match.combinedScore * 100).toFixed(1)}%
- Excerpt: "${match.excerpt || 'N/A'}"
`).join('\n');

  const userPrompt = `
SUBMITTED TEXT:
"""
${truncatedText}
"""

TOP MATCHED SOURCES (from database):
${matchesSummary.length > 0 ? matchesSummary : 'No significant matches found in the database.'}

COMBINED SIMILARITY SCORE: ${(combinedScore * 100).toFixed(1)}%

Please analyse this submission and return your structured JSON report.
`.trim();

  try {
    const response = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    });

  const rawText =
    response.content.find(item => item.type === "text")?.text || "";

    // debugging logs for raw response
    console.log("Response length:", rawText.length);

  console.log(rawText.substring(0,300));

console.log("...");

console.log(rawText.substring(rawText.length-300));



    // Parse JSON, stripping any accidental markdown fences
   let parsed;

    try {

    const start = rawText.indexOf("{");
    const end = rawText.lastIndexOf("}");

    if (start === -1 || end === -1) {
        throw new Error("No JSON found.");
    }

    const jsonText = rawText.slice(start, end + 1);

    try {
  parsed = JSON.parse(jsonText); // try normal parse first
} catch (parseErr) {
  console.warn("Initial JSON.parse failed, attempting repair...");
  const repaired = jsonrepair(jsonText);
  parsed = JSON.parse(repaired); // retry with repaired text
}

    } catch (err) {

    console.error("JSON Parse Error:", err);

    return buildFallback(combinedScore, rawText);

    }

    // Validate and clamp plagiarismPercentage
    parsed.plagiarismPercentage = Math.min(100, Math.max(0, Math.round(parsed.plagiarismPercentage || 0)));
    parsed.rawReport = rawText;

    return parsed;

  } catch (err) {
    console.error('[claudeAnalysis] API error:', err.message);
    // Return a degraded report rather than crashing the whole request
    return buildFallback(combinedScore, `Analysis unavailable: ${err.message}`);
  }
}

/**
 * Build a fallback report when Claude is unavailable or returns invalid JSON.
 * @param {number} combinedScore
 * @param {string} rawReport
 * @returns {Object}
 */
function buildFallback(combinedScore, rawReport) {
  const percentage = Math.round(combinedScore * 100);
  let riskLevel = 'Low';
  if (percentage > 70) riskLevel = 'Critical';
  else if (percentage > 40) riskLevel = 'High';
  else if (percentage > 20) riskLevel = 'Moderate';

  return {
    plagiarismPercentage: percentage,
    riskLevel,
    summary: `Automated similarity score: ${percentage}%. Full AI analysis was unavailable.`,
    directMatches: 'Analysis not available.',
    paraphrasingDetected: 'Analysis not available.',
    structuralSimilarity: 'Analysis not available.',
    aiGeneratedPatterns: 'Analysis not available.',
    highlightedSections: [],
    conclusion: 'Please review the similarity scores manually.',
    rawReport,
  };
}
