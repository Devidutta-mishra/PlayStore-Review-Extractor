(async () => {
    const defaultOptions = {
        maxReviews: 1000,
        countValue: "1000",
        format: "csv"
    };

    const options = {
        ...defaultOptions,
        ...(window.__PSRE_EXPORT_OPTIONS__ || {})
    };

    const targetReviews = Number(options.maxReviews) || defaultOptions.maxReviews;
    const isAllReviews = options.countValue === "all";
    const exportFormat = options.format === "json" ? "json" : "csv";

    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    function sendMessage(payload) {
        try {
            chrome.runtime.sendMessage({
                source: "play-store-review-exporter",
                ...payload
            });
        } catch (error) {
            console.log("Popup message skipped:", error);
        }
    }

    function progress(status, loaded = 0, progressValue = 0) {
        sendMessage({
            type: "progress",
            status,
            loaded,
            progress: progressValue
        });
    }

    function convertToCSV(data) {
        const headers = [
            "username",
            "rating",
            "date",
            "reviewText"
        ];

        const rows = [headers.join(",")];

        data.forEach(row => {
            rows.push([
                `"${(row.username || "").replace(/"/g, '""')}"`,
                `"${row.rating || ""}"`,
                `"${(row.date || "").replace(/"/g, '""')}"`,
                `"${(row.reviewText || "").replace(/"/g, '""')}"`
            ].join(","));
        });

        return rows.join("\n");
    }

    function getLoadedReviewCount() {
        return document.querySelectorAll(".RHo1pe").length;
    }

    function getProgressPercent(loadedCount) {
        if (isAllReviews) {
            return Math.min(88, 22 + Math.floor(loadedCount / 40));
        }

        return Math.min(88, 22 + Math.floor((loadedCount / targetReviews) * 60));
    }

    async function openReviewsPopup() {
        progress("Opening reviews...", 0, 12);

        const reviewButton = document.querySelector(
            'button[aria-label*="Ratings and reviews"]'
        );

        if (!reviewButton) {
            throw new Error("Reviews popup not found");
        }

        reviewButton.click();

        await sleep(2000);

        return true;
    }

    async function autoLoadReviews(maxReviews) {
        const container = document.querySelector(".fysCi");

        if (!container) {
            throw new Error("Review container not found");
        }

        let previousCount = 0;
        let noGrowthCount = 0;

        while (true) {
            const currentCount = getLoadedReviewCount();

            progress(
                currentCount > 0 ? "Loading reviews..." : "Finding reviews...",
                currentCount,
                getProgressPercent(currentCount)
            );

            console.log(`Loaded Reviews: ${currentCount}`);

            if (!isAllReviews && currentCount >= maxReviews) {
                console.log(`Reached ${maxReviews} reviews`);
                break;
            }

            if (currentCount === previousCount) {
                noGrowthCount++;
            } else {
                noGrowthCount = 0;
            }

            if (noGrowthCount >= 5) {
                console.log("No more reviews available");
                break;
            }

            previousCount = currentCount;

            container.scrollBy(0, 5000);

            const oldCount = currentCount;
            let loaded = false;

            for (let i = 0; i < 10; i++) {
                await sleep(300);

                const newCount = getLoadedReviewCount();

                if (newCount > oldCount) {
                    loaded = true;
                    break;
                }
            }

            if (!loaded) {
                await sleep(500);
            }
        }
    }

    function extractReviews() {
        progress("Extracting reviews...", getLoadedReviewCount(), 92);

        const reviewCards = document.querySelectorAll(".RHo1pe");
        const reviews = [];

        reviewCards.forEach(card => {
            if (!isAllReviews && reviews.length >= targetReviews) {
                return;
            }

            const username = card.querySelector(".X5PpBb")?.innerText || "";
            const reviewText = card.querySelector(".h3YV2d")?.innerText || "";
            const date = card.querySelector(".bp9Aid")?.innerText || "";
            const ratingLabel = card.querySelector('div[role="img"]')?.getAttribute("aria-label") || "";
            const rating = ratingLabel.match(/\d+/)?.[0] || "";

            reviews.push({
                username,
                rating,
                date,
                reviewText
            });
        });

        return reviews;
    }

    function downloadFile(reviews) {
        progress("Preparing file...", reviews.length, 96);

        const isJson = exportFormat === "json";
        const fileData = isJson ? JSON.stringify(reviews, null, 2) : convertToCSV(reviews);
        const blob = new Blob(
            [fileData],
            { type: isJson ? "application/json" : "text/csv" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `playstore_reviews.${exportFormat}`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    try {
        console.clear();
        console.log("Starting Play Store Review Export...");

        await openReviewsPopup();
        await autoLoadReviews(targetReviews);

        const reviews = extractReviews();

        console.log(`Extracted ${reviews.length} reviews`);

        downloadFile(reviews);

        sendMessage({
            type: "success",
            count: reviews.length,
            format: exportFormat
        });

        console.log(`${exportFormat.toUpperCase()} Downloaded`);
    } catch (error) {
        sendMessage({
            type: "error",
            message: error?.message || "Unable to export reviews"
        });

        console.error(error);
    }
})();
