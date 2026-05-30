const exportBtn = document.getElementById("exportBtn");
const exportBtnText = document.getElementById("exportBtnText");
const emptyState = document.getElementById("emptyState");
const appCard = document.getElementById("appCard");
const controls = document.getElementById("controls");
const pageStateBadge = document.getElementById("pageStateBadge");
const currentAppName = document.getElementById("currentAppName");
const statusText = document.getElementById("statusText");
const progressLabel = document.getElementById("progressLabel");
const progressBar = document.getElementById("progressBar");
const progressTrack = document.querySelector(".progress-track");
const reviewCounter = document.getElementById("reviewCounter");
const targetStat = document.getElementById("targetStat");
const formatStat = document.getElementById("formatStat");
const exportedStat = document.getElementById("exportedStat");

let activeTab = null;
let isExporting = false;

const countLabels = {
    100: "100",
    500: "500",
    1000: "1000",
    5000: "5000",
    all: "All"
};

function getSelectedOptions() {
    const countValue = document.querySelector('input[name="reviewCount"]:checked').value;
    const format = document.querySelector('input[name="exportFormat"]:checked').value;

    return {
        countValue,
        maxReviews: countValue === "all" ? Number.MAX_SAFE_INTEGER : Number(countValue),
        format
    };
}

function setButtonLoading(loading) {
    isExporting = loading;
    exportBtn.disabled = loading || !activeTab;
    exportBtn.classList.toggle("is-loading", loading);
    exportBtnText.textContent = loading ? "Exporting Reviews..." : "Export Reviews";
}

function setBadge(text, tone = "") {
    pageStateBadge.textContent = text;
    pageStateBadge.className = `badge ${tone}`.trim();
}

function setProgress(percent, label, loadedCount) {
    const safePercent = Math.max(0, Math.min(100, percent));

    progressBar.style.width = `${safePercent}%`;
    progressTrack.setAttribute("aria-valuenow", String(Math.round(safePercent)));

    if (label) {
        progressLabel.textContent = label;
    }

    if (typeof loadedCount === "number") {
        reviewCounter.textContent = `${loadedCount.toLocaleString()} loaded`;
    }
}

function syncStats() {
    const options = getSelectedOptions();

    targetStat.textContent = countLabels[options.countValue];
    formatStat.textContent = options.format.toUpperCase();
}

function showEmptyState() {
    emptyState.hidden = false;
    controls.hidden = true;
    appCard.hidden = false;
    currentAppName.textContent = "No Play Store app detected";
    statusText.textContent = "Open a Google Play Store app page to begin.";
    setBadge("Not ready", "warning");
    activeTab = null;
    exportBtn.disabled = true;
}

function showReadyState(tab, appName) {
    activeTab = tab;
    emptyState.hidden = true;
    controls.hidden = false;
    appCard.hidden = false;
    currentAppName.textContent = appName || "Google Play app page";
    statusText.textContent = "Choose your export settings.";
    exportedStat.textContent = "-";
    setBadge("Ready", "success");
    setButtonLoading(false);
    syncStats();
}

function isPlayStoreAppPage(url = "") {
    return url.startsWith("https://play.google.com/store/apps/details");
}

async function detectCurrentPage() {
    const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    if (!tab || !isPlayStoreAppPage(tab.url)) {
        showEmptyState();
        return;
    }

    try {
        const [result] = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            func: () => document.querySelector("h1")?.innerText?.trim() || document.title.replace(" - Apps on Google Play", "").trim()
        });

        showReadyState(tab, result?.result);
    } catch (error) {
        showReadyState(tab, "Google Play app page");
    }
}

async function injectExportOptions(tabId, options) {
    await chrome.scripting.executeScript({
        target: { tabId },
        func: injectedOptions => {
            window.__PSRE_EXPORT_OPTIONS__ = injectedOptions;
        },
        args: [options]
    });
}

async function runExport() {
    if (!activeTab || isExporting) {
        return;
    }

    const options = getSelectedOptions();

    setButtonLoading(true);
    exportedStat.textContent = "-";
    statusText.textContent = "Opening reviews...";
    setBadge("Working");
    setProgress(8, "Opening reviews...", 0);
    syncStats();

    try {
        await injectExportOptions(activeTab.id, options);
        await chrome.scripting.executeScript({
            target: { tabId: activeTab.id },
            files: ["content.js"]
        });
    } catch (error) {
        setButtonLoading(false);
        setBadge("Error", "danger");
        statusText.textContent = error?.message || "Unable to start export.";
        setProgress(0, "Export failed", 0);
    }
}

chrome.runtime.onMessage.addListener(message => {
    if (!message || message.source !== "play-store-review-exporter") {
        return;
    }

    if (message.type === "progress") {
        setProgress(message.progress, message.status, message.loaded);
        statusText.textContent = message.status;
    }

    if (message.type === "success") {
        setButtonLoading(false);
        setProgress(100, "Download ready", message.count);
        exportedStat.textContent = message.count.toLocaleString();
        setBadge("Complete", "success");
        statusText.textContent = `${message.count.toLocaleString()} reviews exported as ${message.format.toUpperCase()}.`;
    }

    if (message.type === "error") {
        setButtonLoading(false);
        setBadge("Error", "danger");
        statusText.textContent = message.message;
        setProgress(0, "Export failed", 0);
    }
});

document.querySelectorAll('input[name="reviewCount"], input[name="exportFormat"]').forEach(input => {
    input.addEventListener("change", syncStats);
});

exportBtn.addEventListener("click", runExport);

detectCurrentPage();
