function updateOverlay() {
  const container = document.querySelector(".ds-data-view-list");
  if (!container) return;

  const spans = container.querySelectorAll("span");
  let hasLaundry = false;
  let hasCentralAir = false;

  spans.forEach((span) => {
    const text = span.textContent.toLowerCase();
    if (text.includes("laundry:")) {
      if (text.includes("common area") || text.includes("community")) {
        hasLaundry = false;
      } else {
        hasLaundry = true;
      }
    }

    if (text.includes("central air") || text.includes("central a/c")) {
      hasCentralAir = true;
    }
  });

  let overlay = container.querySelector("#zillow-feature-overlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "zillow-feature-overlay";
    Object.assign(overlay.style, {
      backgroundColor: "#f0f4f8cc",
      color: "#333",
      padding: "10px 14px",
      borderRadius: "10px",
      fontWeight: "bold",
      fontSize: "14px",
      marginBottom: "12px",
      border: "1px solid #ccc",
    });

    // Insert as first child
    container.insertBefore(overlay, container.firstChild);
  }

  overlay.textContent = `🧺 Laundry: ${
    hasLaundry ? "✅ In Unit" : "❌ Common Area"
  }   ❄️ Central Air: ${hasCentralAir ? "✅ Yes" : "❌ No"}`;
}

// Check regularly (can be optimized with MutationObserver later)
updateOverlay();
setInterval(updateOverlay, 1000);
