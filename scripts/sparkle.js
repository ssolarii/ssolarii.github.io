/**
 * Tinkerbell Magic Sparkle Cursor
 * Custom vintage theme matching sol's paradise (electric blue / cobalt / monochrome sparkles)
 */

(function () {
    const colours = ["#0040ff", "#002080", "#111111", "#4a154b", "#0066ff"];
    const sparkles = 80;

    let x = 400, ox = 400;
    let y = 300, oy = 300;
    let swide = 800, shigh = 600;
    let sleft = 0, sdown = 0;

    const tiny = [];
    const star = [];
    const starv = [];
    const starx = [];
    const stary = [];
    const tinyx = [];
    const tinyy = [];
    const tinyv = [];

    function initSparkles() {
        for (let i = 0; i < sparkles; i++) {
            const colour = colours[i % colours.length];

            const t = createDiv(3, 3, colour);
            t.style.visibility = "hidden";
            t.style.zIndex = "9999";
            t.style.pointerEvents = "none";
            document.body.appendChild(tiny[i] = t);
            starv[i] = 0;
            tinyv[i] = 0;

            const s = createDiv(5, 5, "transparent");
            s.style.visibility = "hidden";
            s.style.zIndex = "9999";
            s.style.pointerEvents = "none";

            const rlef = createDiv(1, 5, colour);
            const rdow = createDiv(5, 1, colour);
            rlef.style.pointerEvents = "none";
            rdow.style.pointerEvents = "none";
            s.appendChild(rlef);
            s.appendChild(rdow);
            rlef.style.top = "2px";
            rlef.style.left = "0px";
            rdow.style.top = "0px";
            rdow.style.left = "2px";
            document.body.appendChild(star[i] = s);
        }
        set_width();
        sparkle();
    }

    function sparkle() {
        if (x !== ox || y !== oy) {
            ox = x;
            oy = y;
            for (let c = 0; c < sparkles; c++) {
                if (!starv[c]) {
                    star[c].style.left = (starx[c] = x) + "px";
                    star[c].style.top = (stary[c] = y) + "px";
                    star[c].style.clip = "rect(0px, 5px, 5px, 0px)";
                    star[c].style.visibility = "visible";
                    starv[c] = 50;
                    break;
                }
            }
        }
        for (let c = 0; c < sparkles; c++) {
            if (starv[c]) update_star(c);
            if (tinyv[c]) update_tiny(c);
        }
        requestAnimationFrame(sparkle);
    }

    function update_star(i) {
        if (--starv[i] === 25) star[i].style.clip = "rect(1px, 4px, 4px, 1px)";
        if (starv[i]) {
            stary[i] += 1 + Math.random() * 2;
            if (stary[i] < shigh + sdown) {
                star[i].style.top = stary[i] + "px";
                starx[i] += (i % 5 - 2) / 5;
                star[i].style.left = starx[i] + "px";
            } else {
                star[i].style.visibility = "hidden";
                starv[i] = 0;
            }
        } else {
            tinyv[i] = 50;
            tiny[i].style.top = (tinyy[i] = stary[i]) + "px";
            tiny[i].style.left = (tinyx[i] = starx[i]) + "px";
            tiny[i].style.width = "2px";
            tiny[i].style.height = "2px";
            star[i].style.visibility = "hidden";
            tiny[i].style.visibility = "visible";
        }
    }

    function update_tiny(i) {
        if (--tinyv[i] === 25) {
            tiny[i].style.width = "1px";
            tiny[i].style.height = "1px";
        }
        if (tinyv[i]) {
            tinyy[i] += 1 + Math.random() * 2;
            if (tinyy[i] < shigh + sdown) {
                tiny[i].style.top = tinyy[i] + "px";
                tinyx[i] += (i % 5 - 2) / 5;
                tiny[i].style.left = tinyx[i] + "px";
            } else {
                tiny[i].style.visibility = "hidden";
                tinyv[i] = 0;
            }
        } else {
            tiny[i].style.visibility = "hidden";
        }
    }

    function mouse(e) {
        set_scroll();
        y = e ? e.pageY : (window.event ? window.event.y + sdown : 0);
        x = e ? e.pageX : (window.event ? window.event.x + sleft : 0);
    }

    function set_scroll() {
        if (typeof window.pageYOffset === "number") {
            sdown = window.pageYOffset;
            sleft = window.pageXOffset;
        } else if (document.body && (document.body.scrollTop || document.body.scrollLeft)) {
            sdown = document.body.scrollTop;
            sleft = document.body.scrollLeft;
        } else if (document.documentElement && (document.documentElement.scrollTop || document.documentElement.scrollLeft)) {
            sleft = document.documentElement.scrollLeft;
            sdown = document.documentElement.scrollTop;
        } else {
            sdown = 0;
            sleft = 0;
        }
    }

    function set_width() {
        if (typeof window.innerWidth === "number") {
            swide = window.innerWidth;
            shigh = window.innerHeight;
        } else if (document.documentElement && document.documentElement.clientWidth) {
            swide = document.documentElement.clientWidth;
            shigh = document.documentElement.clientHeight;
        } else if (document.body && document.body.clientWidth) {
            swide = document.body.clientWidth;
            shigh = document.body.clientHeight;
        }
    }

    function createDiv(height, width, bgColour) {
        const div = document.createElement("div");
        div.style.position = "absolute";
        div.style.height = height + "px";
        div.style.width = width + "px";
        div.style.overflow = "hidden";
        div.style.backgroundColor = bgColour;
        div.style.imageRendering = "pixelated";
        return div;
    }

    document.addEventListener("mousemove", mouse);
    window.addEventListener("resize", set_width);
    window.addEventListener("scroll", set_scroll);

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initSparkles);
    } else {
        initSparkles();
    }
})();
