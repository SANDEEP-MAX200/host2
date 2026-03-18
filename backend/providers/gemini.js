import { GoogleGenAI } from "@google/genai";
import _default from "validator";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Analyzes a URL and its webpage content for phishing intent using the Gemini API.
 * @param {string} url The URL to analyze.
 * @returns {Promise<boolean>} Returns true if the model classifies the URL as Phishing or BLOCKED_UNSAFE, otherwise returns false.
 */
export default async function isPhishing(url) {
  // Using gemini-2.5-flash for speed and cost-effectiveness in high-throughput classification
  const model = "gemini-2.5-flash";

  const systemInstruction = `
Role: Specialized Japanese Anti-Phishing Classifier.
Constraint: Output EXACTLY one word. No punctuation, no explanations.

Rules:
1. If the URL is a verified, globally recognized official domain (e.g., google.com, amazon.co.jp, line.me), respond: 'VerySafe'.
2. If the URL/content shows brand impersonation, credential theft, or suspicious urgency, respond: 'Phishing'.
3. If the URL is benign but not a major global brand, respond: 'Not'.

Goal:please Return only 'Phishing', 'Not', or 'VerySafe' in one word only.
`;

  // The user prompt instructs the model to use the URL and output only one word
  const userPrompt = `Analyze this URL and its content for phishing intent. Give only a single word verdict not more than one word(verysafe,phishing,not). URL: ${url}`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [{ text: userPrompt }],
        },
      ],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.0, // Set to 0.0 for deterministic, stable classification results
        tools: [{ urlContext: {} }], // Enable the tool to fetch and analyze the URL's content
      },
    });

    let verdict;

    // --- Output Processing to Determine Boolean Verdict ---
    if (response.text) {
      // Case 1: Model returned text (expected 'Phishing' or 'Not')
      verdict = response.text.trim().toLowerCase().replace(/[.,]/g, "");
      console.log(verdict);
    } else if (response.candidates && response.candidates.length > 0) {
      // Case 2: No text, check the reason why generation stopped
      const finishReason = response.candidates[0].finishReason;

      if (finishReason === "SAFETY") {
        // Output was blocked by Google's internal safety filter (often strong evidence of phishing)
        verdict = "blocked_unsafe";
      } else {
        verdict = "api_stop";
      }
    } else {
      verdict = "api_failure";
    }

    // Return TRUE if the model explicitly said 'phishing' or was blocked by safety filters.
    return verdict;

  } catch{
    // Return false on hard API errors (like invalid key, network timeout, or rate limit)
    return false;
  }
}
