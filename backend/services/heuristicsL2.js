import whois from "whois-json";
import { parse as parseTLD } from "tldts";
import { URL } from "url";

// --- UTILITY FUNCTIONS ---

function normalizeUrl(url) {
  try {
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "http://" + url;
    }
    return new URL(url);
  } catch {
    return new URL("http://malformed.url");
  }
}

function getRootDomain(urlString) {
    try {
        const u = normalizeUrl(urlString);
        const parsed = parseTLD(u.hostname);
        return parsed.domain;
    } catch (e) {
        return null;
    }
}

//---------------------- WHITELISTED DOMAINS ----------------------
const WHITELISTED_DOMAINS = [
    // --- Global Tech, Search, Social, and Essential Services ---
    "google.com", "youtube.com", "microsoft.com", "apple.com", "facebook.com",
    "instagram.com", "x.com", "linkedin.com", "pinterest.com","amazon.com",
    "wikipedia.org", "bing.com", "chatgpt.com", "openai.com", "github.com",
    "canva.com", "adobe.com", "discord.com", "imdb.com",
    "yahoo.com", "naver.com", "live.com", "netflix.com", "twitch.tv", "sharepoint.com",
    "office.com", "microsoftonline.com", "weather.com", "paypal.com",

    // --- Major Japanese Internet, Retail, and Media ---
    "yahoo.co.jp", "rakuten.co.jp", "amazon.co.jp", "google.co.jp",
    "mercari.com", "zozo.jp", "dmm.co.jp", "kakaku.com", "tabelog.com", "cookpad.com",
    "mynavi.jp", "livedoor.jp", "ameblo.jp", "note.com", "cybozu.com", "chatwork.com",
    "nikkei.com", "yomiuri.co.jp", "oricon.co.jp", "tenki.jp", "weathernews.jp",

    // --- Japanese Technology and Electronics ---
    "sony.com", "hitachi.com", "panasonic.com", "canon.com", "fujitsu.com",
    "toshiba.com", "nec.com", "keyence.com", "mitsubishielectric.com", "denso.com",

    // --- Japanese Automotive and Transportation ---
    "toyota.jp", "honda.co.jp", "nissan.co.jp", "mazda.com", "suzuki.co.jp",
    "subaru.com", "mitsubishi-motors.com", "bridgestone.com",
    "japanairlines.com", "ana.co.jp", "jreast.co.jp",

    // --- Japanese Finance, Banking, and Insurance ---
    "mufg.jp", "smbc.co.jp", "mizuho-fg.co.jp",
    "tokiomarine.co.jp", "dai-ichi-life.co.jp", "nippon-life.co.jp",
    "sbigroup.co.jp", "nomura.com", "resona-gr.co.jp",

    // --- Japanese Conglomerates, Trading, and Retail ---
    "itochu.co.jp", "mitsui.com", "marubeni.com", "sumitomocorp.com",
    "mitsubishicorp.com", "softbank.jp", "fastretailing.com",
    "sevenandi.com", "aeon.info", "muji.com", "nitori-net.jp", "chiyoda.co.jp",

    // --- Pharmaceuticals, Food, and Others ---
    "takeda.com", "daiichisankyo.com", "ajinomoto.co.jp", "kikkoman.co.jp",
    "line.me", "docomo.ne.jp",
];

//---------------------- BAD TLDs ----------------------
const BAD_TLDS_GENERAL = [
  "xyz", "top", "icu", "rest", "fun", "fit", "tk", "ml", "ga",
  "cf", "gq", "work", "zip", "review", "bid", "loan", "download",
  "click", "country", "buzz", "kim", "win", "men", "date", "party",
  "stream", "mom", "bar", "monster", "cyou", "casa", "surf", "lol",
  "quest", "info", "shop", "live", "online", "site", "cam", "today",
  "press", "link", "pics", "photo", "help", "hosting", "space",
  "pro", "trade", "uno", "accountant", "faith", "science",
];
const BAD_TLDS_JAPAN = [
  "xyz","top","online","site","shop","work","live","fun","fit","info","biz",
];
const BAD_TLDS = new Set([...BAD_TLDS_GENERAL, ...BAD_TLDS_JAPAN]);

//---------------------- JAPANESE CONTENT & Scoring ----------------------
const PHISHING_KEYWORDS = new Set([
  "login", "log in", "signin", "sign in", "verify", "verification", "authenticate", "authentication",
  "confirm", "account", "myaccount", "recover", "update", "reset", "password", "passcode",
  "security", "safe", "identity", "userinfo", "urgent", "urgent action", "immediately", "now",
  "attention", "alert", "warning", "danger", "locked", "lock", "disabled", "blocked", "freeze",
  "suspended", "suspicious", "unusual activity", "expire", "expire soon", "deadline", "verify now",
  "payment", "billing", "invoice", "charge", "refund", "credit card", "debit", "card update",
  "claim", "renew", "subscription", "order", "checkout", "delivery", "redelivery", "resend", "tracking",
  "parcel", "package", "shipment", "shipping", "failed delivery", "customer support",
  "ログイン", "サインイン", "アカウント", "本人認証", "本人確認", "暗証番号",
  "パスワード", "安全", "セキュリティ", "確認", "更新", "検証",
  "有効化", "再認証", "再登録", "支払い", "支払方法", "請求", "ご請求",
  "未払い", "返金", "銀行", "クレジット", "カード", "危険", "停止",
  "凍結", "制限", "緊急", "至急", "今すぐ", "期限", "不正", "詐欺",
  "カスタマーセンター", "再配達", "配達", "配達予定", "発送", "追跡",
  "不在通知", "荷物", "配送", "送り状",
  "wallet", "withdraw", "deposit", "btc", "token", "metamask", "airdrop", "private key",
  "tax", "national id", "social security", "license", "my number", "public service",
  "insurance", "pension", "id verification",
]);

const WEIGHTS = {
  ipHost: 20,
  jpChars: 3,
  jpKeyword: 7,
  base64Param: 15,
  domainAge: 10,
};

const THRESHOLD = 25;

//--------------------------------------------------
// Helpers
//--------------------------------------------------
function containsJapaneseChars(s) {
  return /[\u3040-\u30ff\u4e00-\u9faf]/.test(s);
}

function looksLikeBase64(s) {
  return /^(?:[A-Za-z0-9+/]{20,}={0,2})$/.test(s);
}

// WHOIS domain age return days
async function getDomainAge(domain) {
  try {
    const info = await whois(domain);
    const fields = ["creationDate","created","domainCreateDate","Creation Date",];
    for (const f of fields) {
      if (info[f]) {
        const d = new Date(info[f]);
        if (!isNaN(d)) {
          return Math.floor((Date.now()-d.getTime())/(1000*60*60*24));
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export async function checkPhishing(url) {

  const u = normalizeUrl(url);
  const hostname = u.hostname.toLowerCase();
  const pathQuery = (u.pathname + u.search).toLowerCase();

  const parsed = parseTLD(hostname);
  const domain = parsed.domain || hostname;
  const tld = parsed.publicSuffix || "";
  const rootDomain = getRootDomain(url);

  const analysis = {
    score: 0,
    verdict: false, // true for UNSAFE, false for SAFE
    warnings: [],
    details: {},
  };

  // 1. --- WHITELIST CHECK (IMMEDIATE EXIT - SAFE) ---
  if (rootDomain && WHITELISTED_DOMAINS.includes(rootDomain)) {
      analysis.details.whitelisted = true;
      analysis.warnings.push("Whitelisted trusted domain (Global List).");
      analysis.verdict = false;
      analysis.score = 0;
      console.log("H2: Whitelisted. Returning safe immediately.");
      return analysis;
  }

  // 2. --- Structural Checks (IMMEDIATE EXIT - UNSAFE) ---

  // Bad TLD
  if (BAD_TLDS.has(tld)) {
    analysis.details.blacklist = true;
    analysis.warnings.push(`Domain uses a TLD (${tld}) associated with high scam activity.`);
    analysis.verdict = true;
    analysis.score = 100;
    return analysis;
  }

  // Punycode (IDN Homograph)
  if (hostname.startsWith("xn--")) {
     analysis.warnings.push("URL uses Punycode (high risk of homoglyph attack).");
     analysis.verdict = true;
     analysis.score = 100;
     return analysis;
  }

  // Excessive Subdomain (parts > 4 is considered excessive)
  const parts = hostname.split(".");
  if (parts.length > 4) {
    analysis.warnings.push("Excessive subdomains detected (may hide true host).");
    analysis.verdict = true;
    analysis.score = 100;
    return analysis;
  }

  // IP Host
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
    analysis.warnings.push("Host is an IP address (highly suspicious).");
    analysis.verdict = true;
    analysis.score = 100;
    return analysis;
  }

  // --- Scoring Checks for Sophistication ---

  // Japanese text (for path/query)
  if (containsJapaneseChars(pathQuery)) {
    analysis.score += WEIGHTS.jpChars;
    analysis.warnings.push("Japanese characters in URL path/query.");
  }

  // Japanese phishing keywords
  for (const kw of PHISHING_KEYWORDS) {
    if (pathQuery.includes(kw)) {
      analysis.score += WEIGHTS.jpKeyword;
      analysis.warnings.push(`Phishing keyword found: ${kw.substring(0, 10)}...`);
    }
  }

  // Suspicious Params (Base64/long)
  try {
    const searchParams = u.searchParams;
    for (const [k,v] of searchParams.entries()) {
      if (looksLikeBase64(v) || v.length > 25) {
        analysis.score += WEIGHTS.base64Param;
        analysis.warnings.push("Suspiciously long or Base64-like parameter found.");
        break;
      }
    }
  } catch (e) {
      console.log(e);
  }

  // Domain Age
  const age = await getDomainAge(domain);
  analysis.details.domain_age_days = age;
  if (age === null) {
    analysis.score += WEIGHTS.domainAge;
    analysis.warnings.push("WHOIS data missing/invalid (possible new domain).");
  } else if (age < 7) {
    analysis.score += WEIGHTS.domainAge;
    analysis.warnings.push(`Domain is very young (${age} days).`);
  } else if (age < 60) {
    analysis.score += (WEIGHTS.domainAge / 2);
    analysis.warnings.push(`Domain is relatively young (${age} days).`);
  }

  // Final Verdict for Scoring Checks
  if (analysis.score >= THRESHOLD) {
    analysis.verdict = true;
  }

  return analysis;
}
