(function initScrollingTitle() {
    const delay = 500;
    const dividerlength = 6;
    const dividerchar = "\u2800".repeat(dividerlength);

    function getScrollText() {
        const metaTag = document.querySelector('meta[name="scroll-title"]');
        if (metaTag && metaTag.content) {
            return metaTag.content;
        }

        const dataAttr = document.documentElement.dataset.scrollTitle || document.body?.dataset.scrollTitle;
        if (dataAttr) {
            return dataAttr;
        }
        return document.title || "";
    }

    function splitGraphemes(str) {
        if (typeof Intl !== "undefined" && Intl.Segmenter) {
            const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });
            return Array.from(segmenter.segment(str), (item) => item.segment);
        }
        return Array.from(str);
    }

    function startScrolling() {
        const rawText = getScrollText().trim();
        if (!rawText) {
            return;
        }

        const chars = splitGraphemes(rawText + dividerchar);
        let intervalId = null;

        function step() {
            document.title = chars.join("");
            const first = chars.shift();
            if (first !== undefined) {
                chars.push(first);
            }
        }

        function start() {
            if (!intervalId) {
                intervalId = setInterval(step, delay);
            }
        }

        function stop() {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
            }
        }

        document.addEventListener("visibilitychange", () => {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        });

        start();
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startScrolling);
    } else {
        startScrolling();
    }
})();