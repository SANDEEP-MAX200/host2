import fetch from "node-fetch";
import dotenv from "dotenv";
dotenv.config();

const API_KEY = process.env.GOOGLE_WEBRISK_KEY;

export default async function checkUrlSafe(url) {
  const endpoint =
  "https://webrisk.googleapis.com/v1/uris:search?" +
  "threatTypes=SOCIAL_ENGINEERING&" +
  "threatTypes=MALWARE&" +
  "threatTypes=UNWANTED_SOFTWARE&" +
  `uri=${encodeURIComponent(url)}&key=${API_KEY}`;
  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    console.log("🔍 Checking URL:", url);
    console.log("API Response:", data);

    if (data?.threat?.threatTypes?.length > 0) {
      console.log(`⚠️ GOOGLE: Threat detected for URL → ${url}`);
      console.log("Detected types:", data.threat.threatTypes);
      return true;
    }

    console.log("✅ Google didn't flag anything suspicious.");
    return false;

  } catch (err) {
    console.log("🔥 Google API error:", err);
    return false;
  }
}
