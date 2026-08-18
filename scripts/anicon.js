(function initAnimatedFavicon() {
    const frames = 12;
    const delay = 500;
    const BASE_PATH = 'assets/frames/';
    const FILE_EXTENSION = '.png';

    const frameUrls = Array.from({ length: frames }, (_, index) => {
        return `${BASE_PATH}${index + 1}${FILE_EXTENSION}`;
    });
    frameUrls.forEach((url) => {
        const img = new Image();
        img.src = url;
    });

    function getFaviconElement() {
        let link = document.querySelector("link[rel*='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        return link;
    }

    let currentFrameIndex = 1;
    let intervalId = null;
    const faviconLink = getFaviconElement();

    function updateFavicon() {
        faviconLink.href = frameUrls[currentFrameIndex];
        currentFrameIndex = (currentFrameIndex + 1) % frameUrls.length;
    }


    function startAnimation() {
        if (!intervalId) {
            intervalId = setInterval(updateFavicon, delay);
        }
    }

    function stopAnimation() {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopAnimation();
        } else {
            startAnimation();
        }
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startAnimation);
    } else {
        startAnimation();
    }
})();