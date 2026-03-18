import fetch from "node-fetch";
import { v4 as uuid } from "uuid";
import dotenv from "dotenv";
dotenv.config();

const api_url = "https://ping.arya.ai/api/v1/phishing-detection";

export default async function arya_api(url) {
  try {
    console.log("AI scanning started...");

    const res = await fetch(api_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "token": process.env.ARYA_API_TOKEN
      },
      body: JSON.stringify({
        input_data: url,
        input_type: "url",
        req_id: uuid(),  // unique each request
      }),
    });

    const data = await res.json();
    console.log("ARYA:", data);

    if (data?.data?.prediction === "Legitimate URL") {
      return false; // safe
    }
    return true; // phishing
  } catch (err) {
    console.error("ARYA error:", err);
    return false; // fallback safe
  }
}
