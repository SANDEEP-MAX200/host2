import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { checkSsl } from "../providers/sslChecker.js";
import {
  checkRidParameter,
  checkGophishHeader,
  fetchHeaders,
} from "../providers/goPhishChecker.js";
import { URL } from "url";

// --- CONFIGURATION ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// --- CONSTANTS (Only remaining scoring factors) ---
const SCORES = {
  RID_PARAMETER: 8,
  HTTP_PROTOCOL: 4,
  SSL_ISSUE: 2,
  LONG_URL: 5, // Score for excessively long URLs
  SUSPICIOUS_CHAR: 8,
  GOPHISH_HEADER: 15,
};

const PHISHING_THRESHOLD = 10;
const URL_LENGTH_THRESHOLD = 80;

// --- CONSTANT: Patterns used for URL obfuscation or host confusion ---
const SUSPICIOUS_PATTERNS = ["@", "[", "]", "0x", "\\"];

// --- MAIN HEURISTICS FUNCTION ---
const checkHeuristics = async (url) => {
  const analysis = {
    score: 0,
    warnings: [],
    details: {},
  };

  console.log(`\nRunning Heuristics Analysis (L1) for: ${url}`);

  // Ensure protocol is present for accurate URL parsing later
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "http://" + url;
  }

  let u;
  try {
    u = new URL(url);
  } catch (e) {
    analysis.details.url_parse_error = true;
    analysis.warnings.push("URL parsing failed in H1.");
    return {
      isPhishing: false,
      verdict: false,
      score: 0,
      riskLevel: "SAFE",
      warnings: analysis.warnings,
      details: analysis.details,
    };
  }

  // 1. Rid Parameter Check
  if (checkRidParameter(url)) {
    analysis.score += SCORES.RID_PARAMETER;
    analysis.warnings.push("Suspicious tracking parameter (rid) detected.");
  }

  // 2. Protocol Check
  const protocol = u.protocol.startsWith("https") ? "https" : "http"

  analysis.details.protocol = protocol;
  if (protocol === "http") {
    analysis.score += SCORES.HTTP_PROTOCOL;
    analysis.warnings.push("Insecure HTTP protocol detected.");
  }

  // 3. SSL Certificate Check
  if (protocol === "https") {
    const sslResult = await checkSsl(url);
    analysis.details.ssl = sslResult;
    if (!sslResult.safe) {
      analysis.score += SCORES.SSL_ISSUE;
      analysis.warnings.push(`SSL Certificate Issue: ${sslResult.reason}`);
    }
  }

  // 4. GoPhish Header Check
  const headers = await fetchHeaders(url);
  if (headers && checkGophishHeader(headers)) {
    analysis.score += SCORES.GOPHISH_HEADER;
    analysis.warnings.push(
      "HIGH RISK: GoPhish server header detected in response."
    );
    analysis.details.gophish = true;
  } else {
    analysis.details.gophish = false;
  }

  // 5. URL Length Check (>80 for +5)
  if (url.length > URL_LENGTH_THRESHOLD) {
    analysis.score += SCORES.LONG_URL;
    analysis.warnings.push(
      `URL is unusually long (${url.length} chars), often used for deception.`
    );
  }

  // 6. Suspicious Character/Pattern Check
  const foundPatterns = SUSPICIOUS_PATTERNS.filter((pattern) =>
    url.includes(pattern)
  );

  if (foundPatterns.length > 0) {
    analysis.score += SCORES.SUSPICIOUS_CHAR;
    analysis.warnings.push(
      `URL contains suspicious characters or patterns: ${foundPatterns.join(
        ", "
      )} (obfuscation attempt).`
    );
  }
  // --- FINAL CALCULATION ---
  const isPhishing = analysis.score >= PHISHING_THRESHOLD;
  const riskLevel = getRiskLevel(analysis.score);
  console.log("h1 completed with score:", analysis.score);

  return {
    isPhishing,
    verdict: isPhishing,
    score: analysis.score,
    riskLevel,
    warnings: analysis.warnings,
    details: analysis.details,
  };
};

const getRiskLevel = (score) => {
  if (score >= 18) return "CRITICAL";
  if (score >= 14) return "HIGH";
  if (score >= 10) return "MEDIUM";
  if (score >= 6) return "LOW";
  return "SAFE";
};

export { checkHeuristics };
