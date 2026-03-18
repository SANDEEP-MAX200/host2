import jwt from "jsonwebtoken";
import { checkHeuristics } from "../services/heuristicsL1.js";
import { checkPhishing } from "../services/heuristicsL2.js";
import { google_scan, gemini_scan, urllert_scan } from "./scanController.js";
import { expandShortUrl } from "../services/urlExpander.js";
import User from "../models/User.js";
import GlobalScan from "../models/GlobalScan.js";

import scans_log from "../models/ScanHistory.js";
import TokenWallet from "../models/TokenWallet.js";
import TokenLog from "../models/TokenTransaction.js";

var h1 = 1;
var h2 = 1;
var google = 1;
var gemini = 1;
var urllert = 0;

const dbupdate = async (email, verdict, url, rating) => {
  try {
    // Log scan to history so it reflects on the Dashboard
    await scans_log.create({
      email: email,
      url: url,
      verdict: verdict,
      score: rating
    });

    const cost = verdict === "Safe" ? 8 : verdict === "Potentially_risky" ? 10 : 14;

    // Resolve parent email in case of Business-User
    const user = await User.findOne({ email });
    const walletEmail = user?.parent ? user.parent : email;

    const wallet = await TokenWallet.findOne({ email: walletEmail });

    if (wallet) {
      wallet.allotedTokens = wallet.allotedTokens || 0;
      wallet.premiumTokens = wallet.premiumTokens || 0;

      if (wallet.allotedTokens > 0) {
        if (wallet.allotedTokens >= cost) {
           wallet.allotedTokens -= cost;
        } else {
           const remainder = cost - wallet.allotedTokens;
           wallet.allotedTokens = 0;
           wallet.premiumTokens -= remainder;
        }
      } else {
        wallet.premiumTokens -= cost;
      }

      await wallet.save();

      await TokenLog.create({
        email: walletEmail,
        type: "scan",
        amount: -cost,
        balanceAfter: wallet.balance
      });
    }

  } catch (error) {
    console.error("Error updating scan log and deducting tokens:", error);
  }
};

const handleWebext = async (req, res) => {
  try {
    let { url } = req.body;
    if (!url) return res.status(400).json({ message: "URL required" });

    const expansion = await expandShortUrl(url);
    const expandedUrl = expansion.expandedUrl;
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided" });
    }

    let email;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      email = decoded.email;
    } catch (err) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    const user = await User.findOne({ email });
    const parentEmail = user?.parent;
    const checkemail = parentEmail ? parentEmail : email;

    const walletCheck = await TokenWallet.findOne({ email: checkemail }, { balance: 1, _id: 0 }).lean();
    if (!walletCheck || walletCheck.balance <= 0) {
      return res.status(402).json({
        result: false,
        message: "Insufficient tokens",
        Verdict: "Error",
        Score: 0,
        rating: 0,
        threatType: ["Insufficient Tokens. Please recharge in the dashboard."]
      });
    }

    const cachedScan = await GlobalScan.findOne({ url: expandedUrl });
    if (cachedScan) {
      console.log(`[CACHE HIT] Found stored result for: ${expandedUrl}. Verdict: ${cachedScan.verdict}, Score: ${cachedScan.score}`);
      await dbupdate(email, cachedScan.verdict, expandedUrl, cachedScan.score);
      return res.status(200).json({
        result: cachedScan.verdict !== "Safe",
        message: cachedScan.verdict,
        Verdict: cachedScan.verdict,
        Score: cachedScan.score,
        source: "database_cache"
      });
    }

    console.log(`[CACHE MISS] No stored result for: ${expandedUrl}. Starting live scan...`);

    let h1_res = 0, h2_res = 0, google_res = 0, gemini_res = 0, urllert_res = 0;
    let warnings = [];
    let rating = 2;

    if (h2) {
      const h2Result = await checkPhishing(expandedUrl);
      if (h2Result.details?.whitelisted) {
        await dbupdate(email, "Safe", expandedUrl, 0);
        return res.json({ result: false, message: "Safe", Verdict: "Safe", Score: 0, rating: 0 });
      }
      if (h2Result.details?.blacklist) {
        await dbupdate(email, "Unsafe", expandedUrl, 10);
        return res.json({ result: true, message: "Blacklisted", Verdict: "Unsafe", Score: 10, rating: 10 });
      }
      if (h2Result.verdict) {
        h2_res = 1;
        warnings.push("Heuristics L2 Flag");
      }
    }

    if (h1) {
      const h1Result = await checkHeuristics(expandedUrl);
      if (h1Result.verdict) {
        h1_res = 1;
        warnings.push("Heuristics L1 Flag");
      }
    }

    if (google) {
      const google_result = await google_scan(expandedUrl, email);
      if (google_result) {
        google_res = 1;
        warnings.push("Google Web Risk");
      }
    }

    if (gemini) {
      const gemini_result = await gemini_scan(expandedUrl);
      if (gemini_result === 'phishing') {
        gemini_res = 1;
        warnings.push("Gemini AI Analysis");
      } else if (gemini_result === 'verysafe') {
        rating = 1.8;
      }
    }

    if (urllert && (!h1_res || !h2_res)) {
      const urllert_result = await urllert_scan(expandedUrl);
      if (urllert_result) {
        urllert_res = 1;
        warnings.push("Urllert Security Flag");
      }
    }

    if (rating !== 1.8) {
      if ((h1_res || h2_res) && google_res && gemini_res) {
        rating = Math.max(rating, 9.7);
      } else if ((h1_res || h2_res) && google_res) {
        rating = Math.max(rating, 8.3);
      } else if ((h1_res || h2_res) && gemini_res) {
        rating = Math.max(rating, 7.7);
      } else if (h1_res || h2_res) {
        rating = Math.max(rating, 7);
      }

      if (google_res && gemini_res && urllert_res) {
        rating = Math.max(rating, 9.5);
      } else if (google_res && gemini_res) {
        rating = Math.max(rating, 8.7);
      } else if (google_res && urllert_res) {
        rating = Math.max(rating, 9);
      } else if (gemini_res && urllert_res) {
        rating = Math.max(rating, 8);
      } else if (google_res) {
        rating = Math.max(rating, 9);
      } else if (gemini_res) {
        rating = Math.max(rating, 6);
      } else if (urllert_res) {
        rating = Math.max(rating, 7);
      }
    }

    const finalVerdict = rating <= 4 ? "Safe" : rating <= 7 ? "Potentially_risky" : "Unsafe";
    const isUnsafe = rating > 4;

    await GlobalScan.findOneAndUpdate(
      { url: expandedUrl },
      { verdict: finalVerdict, score: rating, lastScanned: new Date() },
      { upsert: true, new: true }
    );
    await dbupdate(email, finalVerdict, expandedUrl, rating);

    return res.json({
      result: isUnsafe,
      message: finalVerdict,
      Verdict: finalVerdict,
      Score: rating,
      rating: rating,
      threatType: warnings
    });

  } catch (e) {
    console.error("Extension Scan Error:", e);
    return res.status(500).json({ result: false, message: "Internal Scan Error" });
  }
};

export default handleWebext;
