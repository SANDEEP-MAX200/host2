window.addEventListener("message", (event) => {
  if (event.origin === "http://localhost:5173") {
    if (event.data && event.data.type === "SET_TOKEN") {
      chrome.runtime.sendMessage({ type: "SAVE_TOKEN", token: event.data.token });
    }
  }
});