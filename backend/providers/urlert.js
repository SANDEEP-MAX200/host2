import fetch from "node-fetch";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const CREATE_SCAN_ENDPOINT = "https://api.urlert.com/v1/scans";
const POLL_SCAN_ENDPOINT = "https://api.urlert.com/v1/scans";
const API_TOKEN = process.env.URLLERT_BEARER_TOKEN;

const POLL_INTERVAL_MS = 9000; // (9 seconds), as per documentation best practices

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default async function urllert_api(url) {
  if (!API_TOKEN) {
    console.error("URLLERT_BEARER_TOKEN is not set in environment variables.");
    return false; // Fail safe
  }

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_TOKEN}`,
  };

  try {
    console.log("Urllert: Step 1 - Creating scan...");

    // --- STEP 1: CREATE SCAN ---
    let res = await fetch(CREATE_SCAN_ENDPOINT, {
      method: "POST",
      headers: headers,
      body: JSON.stringify({ url: url }),
    });

    let data = await res.json();

    if (res.status !== 201) {
      console.error(`Urllert: Scan creation failed. Status: ${res.status}`, data.error || data.message);
      return false;
    }

    const scanId = data.scan_id;
    console.log(`Urllert: Scan started successfully. ID: ${scanId}. Status: ${data.status}`);

    // --- STEP 2: POLL FOR STATUS ---
    while (data.status === 'pending' || data.status === 'processing') {
      await sleep(POLL_INTERVAL_MS);

      console.log(`Urllert: Polling for results. Current Status: ${data.status}`);

      res = await fetch(`${POLL_SCAN_ENDPOINT}/${scanId}`, {
        method: "GET",
        headers: headers,
      });

      data = await res.json();

      if (res.status === 429) {
          const retryAfter = res.headers.get('Retry-After') || 5;
          console.warn(`Urllert: Rate limit hit. Waiting ${retryAfter} seconds.`);
          await sleep(retryAfter * 1000);
          continue;
      }
    }

    // --- STEP 3: PROCESS FINAL RESULT ---
    if (data.status === 'completed' && data.report) {
        const finalAssessment = data.report.final_assessment; // e.g., 'Malicious', 'Suspicious', 'Benign'
        console.log(`Urllert: Scan Completed. Final Assessment: ${finalAssessment}`);

        // Treat 'Malicious' or 'Suspicious' as a threat (true)
        const isThreat = finalAssessment === 'Malicious' || finalAssessment === 'Suspicious';
        return isThreat;
    }

    if (data.status === 'failed') {
        console.error("Urllert: Scan failed to complete.", data.error);
        return false; // Fail safe on processing error
    }

    return false; // Default safe if status is completed but assessment is not malicious/suspicious (i.e. 'Benign')

  } catch (err) {
    console.error("🔥 Urllert API error:", err);
    return false; // Fallback to safe on network/API failure
  }
}
