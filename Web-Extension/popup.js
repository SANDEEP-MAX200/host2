/* popup.js */
document.addEventListener('DOMContentLoaded', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) return;

    const statusHeader = document.getElementById('status-header');
    const statusText = document.getElementById('status-text');
    const statusIcon = document.getElementById('status-icon');
    const warningsList = document.getElementById('warnings-list');

    const getResultByScore = (score) => {
        const numScore = Number(score);
        if (numScore >= 1 && numScore <= 4) {
            return {
                class: 'status-safe',
                icon: "✅",
                title: "Safe",
                risk: "Low Risk"
            };
        } else if (numScore >= 5 && numScore <= 7) {
            return {
                class: 'status-warning',
                icon: "⚠️",
                title: "Caution",
                risk: "Medium Risk"
            };
        } else {
            return {
                class: 'status-unsafe',
                icon: "🚫",
                title: "Danger",
                risk: "High Risk"
            };
        }
    };
    // Check Auth
    const cookie = await chrome.cookies.get({ url: "http://localhost:5000", name: "token" });
    
    if (!cookie) {
        document.getElementById('status-header').className = 'status-header';
        statusIcon.textContent = "🔒";
        statusText.textContent = "Logged Out";
        warningsList.innerHTML = "<li>Please login to the web dashboard to enable protection.</li>";
        return;
    }

    const currentUrl = tab.url.replace(/\/$/, "");
    document.getElementById('url-display').textContent = currentUrl;
    
    const data = await chrome.storage.local.get("scanResults");
    const result = (data.scanResults || {})[currentUrl];

    if (!result) {
        statusText.textContent = "Scanning...";
        return;
    }

    if (result.rating !== undefined) {
        const ui = getResultByScore(result.rating);
        statusHeader.className = `status-header ${ui.class}`;
        statusIcon.textContent = ui.icon;
        statusText.textContent = `${ui.title} • Score ${result.rating}/10`;
        
        // Show score and threat types in the details section
        let detailsHtml = `<li>Security Score: ${result.rating}/10</li>`;
        if (result.threatType && result.threatType.length > 0) {
            detailsHtml += result.threatType.map(t => `<li>Threat: ${t}</li>`).join('');
        } else if (ui.class === 'status-safe') {
            detailsHtml += "<li>No critical threats found on this page.</li>";
        }
        warningsList.innerHTML = detailsHtml;

    } else {
        // Fallback for non-numeric results (Whitelists/Blacklists)
        if (result.safe || result.message?.toLowerCase().includes("whitelisted")) {
            statusHeader.className = 'status-header status-safe';
            statusIcon.textContent = "✅";
            statusText.textContent = "Safe";
            warningsList.innerHTML = "<li>URL is whitelisted or verified safe.</li>";
        } else {
            statusHeader.className = 'status-header status-unsafe';
            statusIcon.textContent = "⚠️";
            statusText.textContent = "Unsafe";
            warningsList.innerHTML = result.threatType?.map(t => `<li>${t}</li>`).join('') || `<li>Threat Detected</li>`;
        }
    }


//    const displayScore = result.rating !== undefined ? ` (Score: ${result.rating}/10)` : "";
//        if (result.safe) {
//         document.getElementById('status-header').className = 'status-header status-safe';
//         statusIcon.textContent = "✅";
//         statusText.textContent = "Safe" + displayScore;// Shows "Safe (Security Rating: 2/10)"
//         warningsList.innerHTML = "<li>No critical threats found on this page.</li>";
//     } else {
//         document.getElementById('status-header').className = 'status-header status-unsafe';
//         statusIcon.textContent = "⚠️";
//         statusText.textContent = "Unsafe" + displayScore; // Shows "Unsafe (Security Rating: 9/10)"
//         warningsList.innerHTML = result.threatType.map(t => `<li>${t}</li>`).join('') || `<li>Threat Detected</li>`;
//     }
});