/* background.js */
const BACKEND_URL = "http://localhost:5000/webextension";
const AWARENESS_PAGE = "http://localhost:5173/awareness"; // Your local awareness page
const RESULT_STORAGE_KEY = "scanResults";

// Helper function to check if the user is logged in via cookies
async function checkAuth() {
  return new Promise((resolve) => {
    chrome.cookies.get({ url: "http://localhost:5000", name: "token" }, (cookie) => {
      resolve(!!cookie);
    });
  });
}

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only handle top-level frame navigation
  if (details.frameId !== 0) return;

  const url = details.url;
  if (!url.startsWith("http")) return;

  // 1. Skip scanning for the awareness page itself to avoid infinite loops
  if (url.startsWith(AWARENESS_PAGE)) return;

  if (url.startsWith("http://localhost:5173")) {
    console.log("Internal site detected. Skipping scan:", url);
    updateBadge(details.tabId, "", ""); // Clear any existing badges
    return; // Exit early so no fetch request is sent to the backend
  }

  const storageKey = url.replace(/\/$/, "");

  // 2. Check if this specific URL was already marked as "trusted" by the user
   if (url.includes("#trusted=1")) {
    await chrome.storage.session.set({ trustedUrl: url.split("#")[0] });
    console.log("User marked trusted:", url);
    return;
  }

  // 3. Auth Check
  const isLoggedIn = await checkAuth();
  if (!isLoggedIn) {
    updateBadge(details.tabId, "OFF", "#6c757d");
    return; 
  }

  // 4. Visual feedback: show "Scanning" in the UI and badge
  chrome.tabs.sendMessage(details.tabId, { type: "SHOW_SCANNING", url: url }).catch(() => {});
  updateBadge(details.tabId, "...", "#ffa500");

  try {
    const response = await fetch(BACKEND_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: storageKey }),
      credentials: 'include'
    });

    const data = await response.json();
    
    // In your backend, result: true means UNSAFE
    const isUnsafe = data.result === true; 

    const scanEntry = {
      url:url,
      safe: !isUnsafe,
      message: data.message || "Safe",
      rating: data.rating || 2,
      threatType: data.threatType || [],
      timestamp: Date.now()
    };

    // Save result for the popup to read
    const storage = await chrome.storage.local.get(RESULT_STORAGE_KEY);
    const currentResults = storage[RESULT_STORAGE_KEY] || {};
    currentResults[storageKey] = scanEntry; 
    await chrome.storage.local.set({ [RESULT_STORAGE_KEY]: currentResults });

    if (isUnsafe) {
      updateBadge(details.tabId, "!", "#dc3545");
      
      // 5. REDIRECT logic: Send user to awareness page with the original URL as a parameter
      const redirectUrl = `${AWARENESS_PAGE}?target=${encodeURIComponent(url)}&rating=${data.rating}`;
      chrome.tabs.update(details.tabId, { url: redirectUrl });
    } else {
      updateBadge(details.tabId, "OK", "#28a745");
      chrome.tabs.sendMessage(details.tabId, { type: "SHOW_RESULT", data: scanEntry }).catch(() => {});
    }

  } catch (err) {
    console.error("Scan Error:", err);
    updateBadge(details.tabId, "ERR", "#555");
  }
});

// Helper for badge updates
function updateBadge(tabId, text, color) {
  chrome.action.setBadgeText({ text, tabId });
  if (color) chrome.action.setBadgeBackgroundColor({ color, tabId });
}

// 6. Listener to allow the Awareness page to "Trust" a URL
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "TRUST_URL") {
    chrome.storage.local.get("trustedUrls", (data) => {
      const trustedUrls = data.trustedUrls || {};
      trustedUrls[request.url] = true;
      chrome.storage.local.set({ trustedUrls }, () => {
        // Redirect them back to the original (now trusted) site
        chrome.tabs.update(sender.tab.id, { url: request.url });
      });
    });
  }
});