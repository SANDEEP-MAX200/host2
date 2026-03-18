import User from "../models/User.js";
import { checkHeuristics } from "../services/heuristicsL1.js";
import jwt from "jsonwebtoken";
import { checkPhishing } from "../services/heuristicsL2.js";
import arya_api from "../providers/arya.js";
import checkUrlSafe from "../providers/googleWebRisk.js";
import detectPhishing from "../providers/gemini.js";
import urllert_api from "../providers/urlert.js";
import { expandShortUrl } from "../services/urlExpander.js";
import GlobalScan from "../models/GlobalScan.js";
import scans_log from "../models/ScanHistory.js";
import list from "../models/UrlMarker.js";
import TokenWallet from "../models/TokenWallet.js";
import TokenLog from "../models/TokenTransaction.js";


//temp for testing only make sure to remove during production
//true->phishing
//false->no phishing
var h1 = 1;
var h2 = 1;
var google = 0
var gemini = 0;
var urllert = 0;
var globali = 1;
var arya = 0;

var h1_res = 0;
var h2_res = 0;
var google_res = 0;
var gemini_res = 0;
var urllert_res = 0;



const dbupdate = async (email, verdict, url, rating) => {
  try {
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

export const urllert_scan = async (url) => {
  const urllert_result = await urllert_api(url);
  return urllert_result;
};

export const gemini_scan = async (url) => {
  const gemini_result = await detectPhishing(url);
  return gemini_result;
};

export const google_scan = async (url) => {
  const google_result = await checkUrlSafe(url);
  return google_result;
};

export const arya_scan = async (url) => {
  const arya_result = await arya_api(url);
  return arya_result;
};

export const scanUrlController = async (req, res, next) => {
  if (!req.cookies?.token)
    return res.status(400).json({ message: "no cookie" });

  const key = process.env.JWT_SECRET;
  const token = req.cookies.token;
  const decoded = jwt.verify(token, key);
  const email = decoded.email;

  let { url } = req.body;
  if (!url) {
    return res.status(200).json({
      message: "URL is required.",
      result: null,
      threatType: null,
    });
  }
  const user = await User.findOne({ email });
  const parentEmail = user.parent;

  const checkemail = parentEmail? parentEmail : email;

  const wallet = await TokenWallet.findOne({ email: checkemail },{balance:1,_id:0}).lean();
    if (!wallet || wallet.balance <= 14) {
      return res.status(402).json({ message: "Insufficient tokens. Please purchase more tokens to continue scanning." });
    }



  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "http://" + url;
  }


  if (user.role === "Business-User" && parentEmail) {
    // Only check parent if parent exists
    const parentCheck = await list.findOne({
      email: parentEmail,
      url: url
    }, { verdict: 1, _id: 0 }).lean();

    if (parentCheck) {
      if (parentCheck.verdict === "whitelist") {
        return res.status(200).json({ message: "whitelisted", type: "whitelist", Score: 0 });
      } else if (parentCheck.verdict === "blacklist") {
        return res.status(200).json({ message: "blacklisted", type: "blacklist", Score: 10 });
      }
    }
  }


  const check_list = await list.findOne({
    email,
    url: url
  }, { verdict: 1, _id: 0 }).lean();

  if (check_list) {
    if (check_list.verdict === "whitelist") {
      return res.status(200).json({ message: "Admin whitelisted this URL", type: "whitelist", Score: 0 });
    } else if (check_list.verdict === "blacklist") {
      return res.status(200).json({ message: "Admin blacklisted this URL", type: "blacklist", Score: 10 });
    }
  }



  try {
    let h1Result = { verdict: false, warnings: [], score: 0 };
    let h2Result = { verdict: false, warnings: [], details: {}, score: 0 };

    const expansion = await expandShortUrl(url);
    url = expansion.expandedUrl;

    console.log(`Scanning URL: ${url} (Redirects: ${expansion.redirectCount})`);



    if (globali) {
      const cachedScan = await GlobalScan.findOne({ url},{verdict:1,score:1,_id:0}).lean();
      if (cachedScan) {
        console.log(`Cache hit: ${url}`);
        await dbupdate(email, cachedScan.verdict, url, cachedScan.score);
        return res.status(200).json({
          Score: cachedScan.score,
          Verdict: cachedScan.verdict,
          source: "database_cache"
        });
      }
    }

    console.log(`Cache miss: Performing full API scan for ${url}`);

    if (h2) {
      h2Result = await checkPhishing(url);
      console.log("heuristics l2", h2Result);

      if (h2Result.details?.whitelisted) {
        const rating = 0;
        const verdict = "Safe";

        await dbupdate(email, verdict, url, rating);
        return res.status(200).json({
          message: `URL is whitelisted and safe. All further scanning skipped.`,
          type: "whitelist",
          result: false,
        });
      }

      if (h2Result.details?.blacklist) {
        const rating = 10;
        const verdict = "Unsafe";
        await dbupdate(email, verdict, url, rating);

        return res.status(200).json({
          message: `URL tld is blacklisted. All further scanning skipped.`,
          result: true,
          type: "blacklist",
        });
      }

      if (h2Result.verdict) {
        h2_res = 1;
        console.log("Heuristics L2 flagged this URL as phishing. Score:", h2Result.score);
      }

    }

    if (h1) {
      h1Result = await checkHeuristics(url);
      console.log("heuristics 1", h1Result);
      if (h1Result.verdict) {
        h1_res = 1;
        console.log("Heuristics L1 flagged this URL as phishing. Score:", h1Result.score);
      }
    }

    console.log("Heuristics safe. Proceeding to Google and ai scanning");
    if (google) {
      const google_result = await google_scan(url, email);
      console.log(google_result);
      if (google_result) {
        google_res = 1;
      }
    }

    if (arya) {
      const arya_result = await arya_scan(url, email);

      if (arya_result) {
        return res.status(200).json({
          message: "messsage from arya",
          result: true,
        });
      }
    }
    let rating = 2;
    if (gemini) {
      const gemini_result = await gemini_scan(url);
      if (gemini_result == 'phishing') gemini_res = 1;
      else if (gemini_result == 'verysafe') {
        urllert = 0;
        rating = 1.8;
      }

    }

    if (urllert && (!h1_res || !h2_res)) {
      const urllert_result = await urllert_scan(url);

      if (urllert_result) {
        urllert_res = 1;
      }
    }

    if (rating !== 1.8) {
      if ((h1_res || h2_res) && google_res && gemini_res) {
        rating = Math.max(rating, 9.7);
      } else if ((h1_res || h2_res) && google_res) {
        rating = Math.max(rating, 8.3);
      }
      else if ((h1_res || h2_res) && gemini_res) {
        rating = Math.max(rating, 7.7);
      }
      else if (h1_res || h2_res) {
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

    const finalVerdict = rating <= 4 ? "Safe" : rating <= 7 ? "Potentially_risky" : "Unsafe"
    if (rating <= 4) {
      await dbupdate(email, "Safe", url, rating);
    }
    else if (rating <= 7) {
      await dbupdate(email, "Potentially_risky", url, rating);
    }
    else {
      await dbupdate(email, "Unsafe", url, rating);
    }

    await GlobalScan.updateOne(
      { url },
      { verdict: finalVerdict, score: rating, lastScanned: new Date() },
      { upsert: true, new: true }
    );

    return res.status(200).json({
      message: rating,
      Score: rating,
      Verdict: finalVerdict
    });
  } catch (err) {
    console.log("Error in scanUrlController:", err);
    next(err);
  }
};
