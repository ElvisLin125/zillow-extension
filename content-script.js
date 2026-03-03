const ROOT_ID = "zillow-feature-floater-root";
const STORAGE_KEY = "zillow-feature-floater-settings-v1";

const FEATURES = [
  {
    key: "laundry",
    label: "In-Unit Laundry",
    icon: "🧺",
    positive: [
      "laundry: in unit",
      "laundry in unit",
      "in-unit laundry",
      "washer/dryer",
      "washer dryer",
      "w/d in unit",
      "inside",
    ],
    negative: [
      "laundry: shared",
      "shared laundry",
      "common area laundry",
      "community laundry",
      "coin laundry",
      "laundry on site",
    ],
  },
  {
    key: "centralAir",
    label: "Central Air",
    icon: "❄️",
    positive: ["central air", "central a/c", "central ac", "forced air"],
    negative: ["no central air", "no ac", "no a/c", "window unit"],
  },
  {
    key: "dishwasher",
    label: "Dishwasher",
    icon: "🍽️",
    positive: ["dishwasher"],
    negative: ["no dishwasher", "without dishwasher"],
  },
  {
    key: "parking",
    label: "Dedicated Parking",
    icon: "🚗",
    positive: [
      "garage",
      "attached garage",
      "detached garage",
      "assigned parking",
      "off street parking",
      "covered parking",
      "carport",
      "parking available",
    ],
    negative: ["no parking", "street parking only"],
  },
  {
    key: "pets",
    label: "Pet Friendly",
    icon: "🐾",
    positive: ["pet friendly", "pets allowed", "cats allowed", "dogs allowed"],
    negative: ["no pets", "pets not allowed"],
  },
];

const DEFAULT_SETTINGS = {
  selectedFeatureKeys: FEATURES.map((feature) => feature.key),
  collapsed: false,
  activeTab: "results",
};

let settings = loadSettings();
let root;
let shadow;
let refreshTimer;
let isInitialScanPending = true;

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    const allowedKeys = new Set(FEATURES.map((feature) => feature.key));
    const selectedFeatureKeys = Array.isArray(parsed.selectedFeatureKeys)
      ? parsed.selectedFeatureKeys.filter((key) => allowedKeys.has(key))
      : DEFAULT_SETTINGS.selectedFeatureKeys;

    return {
      selectedFeatureKeys:
        selectedFeatureKeys.length > 0
          ? selectedFeatureKeys
          : DEFAULT_SETTINGS.selectedFeatureKeys,
      collapsed: Boolean(parsed.collapsed),
      activeTab: parsed.activeTab === "settings" ? "settings" : "results",
    };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

function includesAny(text, list) {
  return list.some((phrase) => text.includes(phrase));
}

function getListingText() {
  const priorityContainer =
    document.querySelector(".ds-home-facts-and-features") ||
    document.querySelector(".ds-data-view-list") ||
    document.querySelector("main") ||
    document.body;

  return (priorityContainer?.innerText || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function evaluateFeature(feature, listingText) {
  const hasPositive = includesAny(listingText, feature.positive);
  const hasNegative = includesAny(listingText, feature.negative);

  if (hasPositive && !hasNegative) {
    return { status: "yes", text: "Found" };
  }

  if (hasNegative && !hasPositive) {
    return { status: "no", text: "Not found" };
  }

  if (hasPositive && hasNegative) {
    return { status: "mixed", text: "Mixed signals" };
  }

  return { status: "unknown", text: "No clear signal" };
}

function getResults() {
  const listingText = getListingText();
  return FEATURES.filter((feature) =>
    settings.selectedFeatureKeys.includes(feature.key),
  ).map((feature) => ({
    ...feature,
    ...evaluateFeature(feature, listingText),
  }));
}

function isHomeDetailsPage() {
  return window.location.pathname.toLowerCase().includes("/homedetails/");
}

function ensureRoot() {
  if (root && shadow) {
    return;
  }

  root = document.getElementById(ROOT_ID);
  if (!root) {
    root = document.createElement("div");
    root.id = ROOT_ID;
    document.documentElement.appendChild(root);
  }

  shadow = root.shadowRoot || root.attachShadow({ mode: "open" });
}

function badgeClass(status) {
  if (status === "yes") return "badge yes";
  if (status === "no") return "badge no";
  if (status === "mixed") return "badge mixed";
  return "badge unknown";
}

function badgeText(status) {
  if (status === "yes") return "Yes";
  if (status === "no") return "No";
  if (status === "mixed") return "Mixed";
  return "Unknown";
}

function render() {
  ensureRoot();
  const onHomeDetailsPage = isHomeDetailsPage();
  const results = onHomeDetailsPage ? getResults() : [];
  const displayedResults =
    onHomeDetailsPage && isInitialScanPending
      ? FEATURES.filter((feature) =>
          settings.selectedFeatureKeys.includes(feature.key),
        ).map((feature) => ({
          ...feature,
          status: "unknown",
          text: "Scanning...",
        }))
      : results;

  const rowsHtml = displayedResults
    .map(
      (result) => `
        <div class="row">
          <div class="feature-meta">
            <span class="icon">${result.icon}</span>
            <span class="feature-label">${result.label}</span>
          </div>
          <div class="status-wrap">
            <span class="${badgeClass(result.status)}">${badgeText(result.status)}</span>
            <span class="hint">${result.text}</span>
          </div>
        </div>
      `,
    )
    .join("");

  const controlsHtml = FEATURES.map(
    (feature) => `
      <label class="switch-row" data-feature-key="${feature.key}">
        <input type="checkbox" ${
          settings.selectedFeatureKeys.includes(feature.key) ? "checked" : ""
        } />
        <span>${feature.icon} ${feature.label}</span>
      </label>
    `,
  ).join("");

  shadow.innerHTML = `
    <style>
      .floating {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 2147483647;
        width: max-content;
        font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #eaf0ff;
      }
      .panel {
        border-radius: 16px;
        border: 1px solid rgba(255, 255, 255, 0.14);
        background: linear-gradient(160deg, rgba(22, 28, 45, 0.95), rgba(12, 16, 29, 0.95));
        box-shadow: 0 18px 45px rgba(5, 10, 28, 0.45);
        backdrop-filter: blur(10px);
        overflow: hidden;
        width: 330px;
      }
      .header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 12px 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }
      .title {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.2px;
      }
      .sub {
        margin: 2px 0 0;
        font-size: 11px;
        color: rgba(223, 232, 255, 0.72);
      }
      .header-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      button {
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
        color: #eaf0ff;
        border-radius: 10px;
        padding: 6px 10px;
        font-size: 11px;
        font-weight: 600;
        cursor: pointer;
      }
      button:hover {
        background: rgb(0,0,0);
      }
      .tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
        padding: 10px 12px 0;
      }
      .tab {
        background: transparent;
        border-color: rgba(255, 255, 255, 0.1);
      }
      .tab.active {
        background: rgba(73, 143, 255, 0.26);
        border-color: rgba(124, 173, 255, 0.48);
      }
      .section {
        padding: 12px;
      }
      .section.hidden {
        display: none;
      }
      .rows {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 10px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.05);
      }
      .feature-meta {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }
      .icon {
        font-size: 15px;
      }
      .feature-label {
        font-size: 13px;
        font-weight: 600;
        color: #f0f5ff;
      }
      .status-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }
      .badge {
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.3px;
        text-transform: uppercase;
        padding: 5px 9px;
      }
      .badge.yes { background: rgba(79, 217, 148, 0.2); color: #6bf4b0; }
      .badge.no { background: rgba(255, 107, 127, 0.2); color: #ff9aab; }
      .badge.mixed { background: rgba(255, 200, 87, 0.2); color: #ffdc84; }
      .badge.unknown { background: rgba(167, 185, 215, 0.2); color: #d6e1ff; }
      .hint {
        font-size: 11px;
        color: rgba(217, 227, 252, 0.72);
      }
      .switches {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .switch-row {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 9px 10px;
        border-radius: 11px;
        background: rgba(255, 255, 255, 0.05);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .switch-row input {
        accent-color: #73a8ff;
        width: 16px;
        height: 16px;
      }
      .footer {
        padding: 0 12px 12px;
        color: rgba(217, 227, 252, 0.66);
        font-size: 10px;
      }
      .collapsed-tab {
        width: fit-content;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        background: linear-gradient(150deg, rgba(22, 28, 45, 0.95), rgba(12, 16, 29, 0.95));
        box-shadow: 0 18px 36px rgba(5, 10, 28, 0.45);
        color: #eaf0ff;
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
    </style>
    <div class="floating">
      ${
        settings.collapsed
          ? `<button class="collapsed-tab" id="expandPanel">◂ Feature Scan</button>`
          : `
            <div class="panel">
              <div class="header">
                <div>
                  <p class="title">Listing Quick Scan</p>
                  <p class="sub">${
                    onHomeDetailsPage
                      ? "Live results from listing details"
                      : "Open a listing for features"
                  }</p>
                </div>
                <div class="header-actions">
                  <button id="manualRefresh">Refresh</button>
                  <button id="collapsePanel">Hide</button>
                </div>
              </div>
              <div class="tabs">
                <button class="tab ${
                  settings.activeTab === "results" ? "active" : ""
                }" id="showResults">Results</button>
                <button class="tab ${
                  settings.activeTab === "settings" ? "active" : ""
                }" id="showSettings">Settings</button>
              </div>
              <div class="section ${
                settings.activeTab === "results" ? "" : "hidden"
              }" id="resultsSection">
                <div class="rows">
                  ${
                    onHomeDetailsPage
                      ? rowsHtml ||
                        `<div class="row"><span class="feature-label">No features selected</span></div>`
                      : `<div class="row"><span class="feature-label">Click onto a home to see feature results.</span></div>`
                  }
                </div>
              </div>
              <div class="section ${
                settings.activeTab === "settings" ? "" : "hidden"
              }" id="settingsSection">
                <div class="switches">${controlsHtml}</div>
              </div>
              <div class="footer">Tip: uncheck features you don't care about.</div>
            </div>
          `
      }
    </div>
  `;

  wireEvents();
}

function queueRender() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(render, 180);
}

function wireEvents() {
  const expandPanel = shadow.getElementById("expandPanel");
  if (expandPanel) {
    expandPanel.addEventListener("click", () => {
      settings.collapsed = false;
      saveSettings();
      render();
    });
  }

  const collapsePanel = shadow.getElementById("collapsePanel");
  if (collapsePanel) {
    collapsePanel.addEventListener("click", () => {
      settings.collapsed = true;
      saveSettings();
      render();
    });
  }

  const showResults = shadow.getElementById("showResults");
  if (showResults) {
    showResults.addEventListener("click", () => {
      settings.activeTab = "results";
      saveSettings();
      render();
    });
  }

  const showSettings = shadow.getElementById("showSettings");
  if (showSettings) {
    showSettings.addEventListener("click", () => {
      settings.activeTab = "settings";
      saveSettings();
      render();
    });
  }

  const manualRefresh = shadow.getElementById("manualRefresh");
  if (manualRefresh) {
    manualRefresh.addEventListener("click", () => {
      render();
    });
  }

  shadow.querySelectorAll(".switch-row").forEach((row) => {
    const input = row.querySelector("input");
    const key = row.getAttribute("data-feature-key");
    if (!input || !key) return;

    input.addEventListener("change", () => {
      if (input.checked) {
        if (!settings.selectedFeatureKeys.includes(key)) {
          settings.selectedFeatureKeys.push(key);
        }
      } else {
        settings.selectedFeatureKeys = settings.selectedFeatureKeys.filter(
          (currentKey) => currentKey !== key,
        );
      }

      if (settings.selectedFeatureKeys.length === 0) {
        settings.selectedFeatureKeys = [FEATURES[0].key];
      }

      saveSettings();
      render();
    });
  });
}

function attachObservers() {
  const observer = new MutationObserver(() => {
    queueRender();
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });

  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function pushStateWrapper(...args) {
    originalPushState.apply(this, args);
    queueRender();
  };

  history.replaceState = function replaceStateWrapper(...args) {
    originalReplaceState.apply(this, args);
    queueRender();
  };

  window.addEventListener("popstate", queueRender);
}

render();
attachObservers();
setTimeout(() => {
  isInitialScanPending = false;
  render();
}, 220);
setInterval(queueRender, 4000);
