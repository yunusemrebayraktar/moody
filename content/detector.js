// Allegedly — silent search detector.
// No UI on the page. Ever. We just tell the background a search happened.
// The background decides if the popup should appear.

(() => {
  if (window.top !== window.self) return;
  if (window.__allegedlyDetectorWired) return;
  window.__allegedlyDetectorWired = true;

  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target;
      if (!form || form.tagName !== "FORM") return;
      const action = (form.action || "").toLowerCase();
      const looksLikeSearch =
        action.includes("/search") ||
        form.querySelector('input[type="search"], input[name="q"]');
      if (!looksLikeSearch) return;
      try {
        chrome.runtime.sendMessage({ type: "allegedly:search" });
      } catch (_) {
        // Service worker may be asleep; that's fine. Allegedly.
      }
    },
    true // capture, but never preventDefault — we are silent
  );
})();
