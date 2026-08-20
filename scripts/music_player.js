(function () {
    const PLAYLIST = [
        { title: "Back to Chronos", artist: "Nekomata Master", src: "assets/music/back_to_chronos.mp3" },
        { title: "Bee Lobby", artist: "nicopatty", src: "assets/music/bee_lobby.mp3" },
        { title: "Little Big Lobby", artist: "nicopatty", src: "assets/music/little_big_lobby.mp3" },
        { title: "Lucid Lobby", artist: "nicopatty feat. PR1SVX", src: "assets/music/lucid_lobby.mp3" },
        { title: "Nextbob Lobby", artist: "nicopatty feat. toastywav", src: "assets/music/nextbob_lobby.mp3" },
        { title: "Safe Room", artist: "nicopatty", src: "assets/music/safe_room.mp3" },
        { title: "Sherbet Lobby", artist: "nicopatty feat. bxnji", src: "assets/music/sherbet_lobby.mp3" },
        { title: "Thoughtbody Lobby", artist: "nicopatty feat. deet", src: "assets/music/thoughtbody_lobby.mp3" }
    ];

    const COOKIE_PREFIX = "sol_music_";

    const ICONS = {
        note: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style="image-rendering: pixelated;"><path d="M4 1h4v2H4V1zm3 2h1v4H7V3zM3 6h3v1H3V6zM2 7h4v2H2V7zm-1 1h2v1H1V8z"/></svg>`,
        prev: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style="image-rendering: pixelated;"><path d="M1 1h2v8H1V1zm7 0v1H7v1H6v1H5v2h1v1h1v1h1v1h1V1H8zm-3 4V4H4v2h1V5z"/></svg>`,
        play: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style="image-rendering: pixelated;"><path d="M2 1h2v1H3v1h1v1h1v1h1v1H5v1H4v1H3v1H2V1zm3 3v2h1V4H5z"/></svg>`,
        pause: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style="image-rendering: pixelated;"><path d="M2 1h2v8H2V1zm4 0h2v8H6V1z"/></svg>`,
        next: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style="image-rendering: pixelated;"><path d="M7 1h2v8H7V1zM1 1h1v1h1v1h1v1h1v2H4v1H3v1H2v1H1V1zm3 4V4H3v2h1V5z"/></svg>`,
        sound: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style="image-rendering: pixelated;"><path d="M1 3h2v4H1V3zm2-1h1v6H3V2zm1-1h1v8H4V1zm3 1h1v1H7V2zm1 2h1v2H8V4zm-1 3h1v1H7V7z"/></svg>`,
        mute: `<svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" style="image-rendering: pixelated;"><path d="M1 3h2v4H1V3zm2-1h1v6H3V2zm1-1h1v8H4V1zm3 2h1v1H7V4zm2 0h1v1H9V4zm-1 1h1v1H8V5zm-1 1h1v1H7V6zm2 0h1v1H9V6z"/></svg>`
    };

    function getStorage(key, fallback) {
        try {
            const v = localStorage.getItem(COOKIE_PREFIX + key);
            return v !== null ? v : fallback;
        } catch (e) {
            return fallback;
        }
    }

    function setStorage(key, val) {
        try {
            localStorage.setItem(COOKIE_PREFIX + key, val);
            document.cookie = `${COOKIE_PREFIX}${key}=${encodeURIComponent(val)}; path=/; max-age=31536000; SameSite=Lax`;
        } catch (e) {}
    }

    function formatTime(secs) {
        if (isNaN(secs) || secs < 0) return "00:00";
        const m = Math.floor(secs / 60);
        const s = Math.floor(secs % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    let currentIndex = parseInt(getStorage("track_index", "0"), 10);
    if (isNaN(currentIndex) || currentIndex < 0 || currentIndex >= PLAYLIST.length) {
        currentIndex = 0;
    }
    let savedTime = parseFloat(getStorage("track_time", "0")) || 0;
    let savedVolume = parseFloat(getStorage("volume", "0.6"));
    if (isNaN(savedVolume) || savedVolume < 0 || savedVolume > 1) savedVolume = 0.6;
    let wasPlaying = getStorage("is_playing", "false") === "true";

    const audio = new Audio();
    audio.preload = "metadata";
    audio.crossOrigin = "anonymous";
    audio.volume = savedVolume;
    let autoPlayPending = wasPlaying;
    let isSeeking = false;

    let audioCtx = null;
    let analyser = null;
    let audioSrcNode = null;
    let isVisEnabled = localStorage.getItem("sol_vis_enabled") !== "off";
    let canvas = null;
    let ctx = null;
    let animationId = null;

    function initAudioContext() {
        if (audioCtx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
            analyser = audioCtx.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.8;

            audioSrcNode = audioCtx.createMediaElementSource(audio);
            audioSrcNode.connect(analyser);
            analyser.connect(audioCtx.destination);
        } catch (err) {}
    }

    function setupVisualizerCanvas() {
        if (document.getElementById("cava-canvas")) return;

        canvas = document.createElement("canvas");
        canvas.id = "cava-canvas";
        canvas.style.cssText = `
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100vw;
            height: 120px;
            pointer-events: none;
            z-index: 0;
            mix-blend-mode: darken;
            opacity: ${isVisEnabled ? '0.65' : '0'};
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(canvas);
        ctx = canvas.getContext("2d");

        function resizeCanvas() {
            if (!canvas) return;
            canvas.width = window.innerWidth;
            canvas.height = 120;
        }

        window.addEventListener("resize", resizeCanvas);
        resizeCanvas();
        startVisualizerLoop();
    }

    function startVisualizerLoop() {
        if (!analyser || !ctx || !canvas) {
            animationId = requestAnimationFrame(startVisualizerLoop);
            return;
        }

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);

        function draw() {
            animationId = requestAnimationFrame(draw);
            if (!isVisEnabled || audio.paused) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                return;
            }

            analyser.getByteFrequencyData(dataArray);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            const numBars = 36;
            const totalWidth = canvas.width;
            const barWidth = Math.max(3, Math.floor((totalWidth / numBars) - 3));
            const gap = Math.floor((totalWidth - (numBars * barWidth)) / numBars);

            for (let i = 0; i < numBars; i++) {
                const sampleIdx = Math.floor((i / numBars) * (bufferLength * 0.75));
                const value = dataArray[sampleIdx] || 0;
                const percent = value / 255;
                const barHeight = Math.max(2, percent * (canvas.height - 10));

                const x = i * (barWidth + gap) + gap;
                const y = canvas.height - barHeight;

                ctx.fillStyle = i % 2 === 0 ? "#1a3b6b" : "#2d528f";
                ctx.fillRect(x, y, barWidth, barHeight);

                if (barHeight > 6) {
                    ctx.fillStyle = "#ff2a7a";
                    ctx.fillRect(x, y, barWidth, 2);
                }
            }
        }

        draw();
    }

    function initVisualizerToggle() {
        const btn = document.getElementById("vis-toggle");
        if (btn) {
            btn.textContent = isVisEnabled ? "vis: on" : "vis: off";
            if (!isVisEnabled) btn.classList.add("off");

            btn.addEventListener("click", () => {
                isVisEnabled = !isVisEnabled;
                localStorage.setItem("sol_vis_enabled", isVisEnabled ? "on" : "off");
                btn.textContent = isVisEnabled ? "vis: on" : "vis: off";
                btn.classList.toggle("off", !isVisEnabled);
                if (canvas) {
                    canvas.style.opacity = isVisEnabled ? "0.65" : "0";
                }
            });
        }
    }

    function renderUI(container) {
        const style = document.createElement('style');
        style.textContent = `
            .sidebar-player {
                display: flex;
                flex-direction: column;
                gap: 6px;
                font-family: inherit;
                color: #000;
                user-select: none;
                width: 100%;
                box-sizing: border-box;
            }

            .sb-screen {
                background: #ffffff;
                border: 1px solid #777;
                padding: 3px 5px;
                display: flex;
                align-items: center;
                gap: 5px;
                height: 22px;
                box-sizing: border-box;
                overflow: hidden;
            }

            .sb-screen-icon {
                color: #0040ff;
                display: flex;
                align-items: center;
                flex-shrink: 0;
            }

            .sb-marquee-wrap {
                flex: 1;
                overflow: hidden;
                white-space: nowrap;
                position: relative;
            }

            .sb-marquee {
                display: inline-block;
                white-space: nowrap;
                animation: sb-scroll 14s linear infinite;
                font-size: 11px;
                line-height: 14px;
            }

            .sb-marquee:hover {
                animation-play-state: paused;
            }

            @keyframes sb-scroll {
                0% { transform: translateX(100%); }
                100% { transform: translateX(-100%); }
            }

            .sb-time {
                font-size: 10px;
                color: #555;
                flex-shrink: 0;
            }

            .sb-slider {
                width: 100%;
                -webkit-appearance: none;
                appearance: none;
                height: 4px;
                background: #e0e0e0;
                border: 1px solid #999;
                outline: none;
                cursor: pointer;
                margin: 2px 0;
            }

            .sb-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 8px;
                height: 10px;
                background: #ffffff;
                border: 1px solid #000;
                cursor: pointer;
            }

            .sb-slider::-moz-range-thumb {
                width: 8px;
                height: 10px;
                background: #ffffff;
                border: 1px solid #000;
                cursor: pointer;
            }

            .sb-controls-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 3px;
            }

            .sb-btn-group {
                display: flex;
                align-items: center;
                gap: 2px;
            }

            .sb-btn {
                background: #ffffff;
                color: #000000;
                font-family: inherit;
                font-size: 10px;
                line-height: 1;
                padding: 3px 5px;
                border: 1px solid;
                border-color: #ffffff #808080 #808080 #ffffff;
                box-shadow: 1px 1px 0px #000000;
                cursor: pointer;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 20px;
                height: 20px;
                box-sizing: border-box;
            }

            .sb-btn:active, .sb-btn.active {
                border-color: #808080 #ffffff #ffffff #808080;
                box-shadow: none;
                padding: 4px 4px 2px 6px;
                background: #ececec;
            }

            .sb-select {
                width: 100%;
                background: #ffffff;
                color: #000000;
                font-family: inherit;
                font-size: 10px;
                padding: 2px 3px;
                border: 1px solid;
                border-color: #808080 #ffffff #ffffff #808080;
                outline: none;
                margin-top: 2px;
                cursor: pointer;
            }
        `;
        document.head.appendChild(style);

        container.innerHTML = `
            <div class="sidebar-player">
                <div class="sb-screen" title="Now Playing">
                    <span class="sb-screen-icon">${ICONS.note}</span>
                    <div class="sb-marquee-wrap">
                        <span class="sb-marquee" id="sb-title">loading track...</span>
                    </div>
                    <span class="sb-time" id="sb-time">00:00</span>
                </div>

                <input type="range" class="sb-slider" id="sb-seek" min="0" max="100" value="0" step="0.1" title="Seek">

                <div class="sb-controls-row">
                    <div class="sb-btn-group">
                        <button type="button" class="sb-btn" id="sb-prev" title="Previous Track">${ICONS.prev}</button>
                        <button type="button" class="sb-btn" id="sb-play" title="Play / Pause">${ICONS.play}</button>
                        <button type="button" class="sb-btn" id="sb-next" title="Next Track">${ICONS.next}</button>
                    </div>

                    <div class="sb-btn-group">
                        <button type="button" class="sb-btn" id="sb-vol-btn" title="Mute / Unmute">${ICONS.sound}</button>
                    </div>
                </div>

                <select class="sb-select" id="sb-select" title="Choose Track">
                    ${PLAYLIST.map((t, i) => `<option value="${i}">[${i + 1}/${PLAYLIST.length}] ${t.title} - ${t.artist}</option>`).join('')}
                </select>
            </div>
        `;
    }

    function initPlayer() {
        const container = document.getElementById("sol-music-player") || document.getElementById("sol-player");
        if (!container) return;

        renderUI(container);
        setupVisualizerCanvas();
        initVisualizerToggle();

        const titleEl = document.getElementById("sb-title");
        const timeEl = document.getElementById("sb-time");
        const playBtn = document.getElementById("sb-play");
        const prevBtn = document.getElementById("sb-prev");
        const nextBtn = document.getElementById("sb-next");
        const volBtn = document.getElementById("sb-vol-btn");
        const seekSlider = document.getElementById("sb-seek");
        const trackSelect = document.getElementById("sb-select");

        function loadTrack(index, resumeTime = 0, shouldPlay = false) {
            currentIndex = index;
            if (currentIndex < 0) currentIndex = PLAYLIST.length - 1;
            if (currentIndex >= PLAYLIST.length) currentIndex = 0;

            setStorage("track_index", currentIndex);
            const track = PLAYLIST[currentIndex];
            audio.src = track.src;

            titleEl.textContent = `[${currentIndex + 1}/${PLAYLIST.length}] ${track.title} — ${track.artist}`;
            trackSelect.value = currentIndex;
            timeEl.textContent = `00:00`;
            seekSlider.value = 0;

            audio.onloadedmetadata = () => {
                if (resumeTime > 0 && resumeTime < audio.duration) {
                    audio.currentTime = resumeTime;
                }
                updateTime();
                if (shouldPlay) {
                    playAudio();
                }
            };
        }

        function playAudio() {
            initAudioContext();
            if (audioCtx && audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            audio.play().then(() => {
                setStorage("is_playing", "true");
                playBtn.innerHTML = ICONS.pause;
                playBtn.classList.add("active");
            }).catch(() => {
                playBtn.innerHTML = ICONS.play;
                playBtn.classList.remove("active");
                setStorage("is_playing", "false");
            });
        }

        function pauseAudio() {
            audio.pause();
            setStorage("is_playing", "false");
            playBtn.innerHTML = ICONS.play;
            playBtn.classList.remove("active");
        }

        function togglePlay() {
            if (audio.paused) {
                playAudio();
            } else {
                pauseAudio();
            }
        }

        function nextTrack() {
            const nextIdx = (currentIndex + 1) % PLAYLIST.length;
            loadTrack(nextIdx, 0, !audio.paused || wasPlaying);
        }

        function prevTrack() {
            if (audio.currentTime > 3) {
                audio.currentTime = 0;
            } else {
                const prevIdx = (currentIndex - 1 + PLAYLIST.length) % PLAYLIST.length;
                loadTrack(prevIdx, 0, !audio.paused || wasPlaying);
            }
        }

        function updateTime() {
            if (!isSeeking && audio.duration) {
                const cur = audio.currentTime || 0;
                const dur = audio.duration || 0;
                seekSlider.value = (cur / dur) * 100;
                timeEl.textContent = `${formatTime(cur)}`;
                setStorage("track_time", cur.toFixed(1));
            }
        }

        playBtn.addEventListener("click", togglePlay);
        prevBtn.addEventListener("click", prevTrack);
        nextBtn.addEventListener("click", nextTrack);

        volBtn.addEventListener("click", () => {
            audio.muted = !audio.muted;
            volBtn.innerHTML = audio.muted ? ICONS.mute : ICONS.sound;
            volBtn.classList.toggle("active", audio.muted);
        });

        trackSelect.addEventListener("change", (e) => {
            const idx = parseInt(e.target.value, 10);
            loadTrack(idx, 0, true);
        });

        seekSlider.addEventListener("input", () => {
            isSeeking = true;
            if (audio.duration) {
                const cur = (seekSlider.value / 100) * audio.duration;
                timeEl.textContent = `${formatTime(cur)}`;
            }
        });

        seekSlider.addEventListener("change", () => {
            if (audio.duration) {
                audio.currentTime = (seekSlider.value / 100) * audio.duration;
                setStorage("track_time", audio.currentTime.toFixed(1));
            }
            isSeeking = false;
        });

        audio.addEventListener("timeupdate", updateTime);
        audio.addEventListener("ended", nextTrack);

        loadTrack(currentIndex, savedTime, autoPlayPending);

        if (autoPlayPending) {
            const resumeOnInteraction = () => {
                if (audio.paused) {
                    playAudio();
                }
                window.removeEventListener("click", resumeOnInteraction);
                window.removeEventListener("keydown", resumeOnInteraction);
            };
            window.addEventListener("click", resumeOnInteraction);
            window.addEventListener("keydown", resumeOnInteraction);
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", initPlayer);
    } else {
        initPlayer();
    }
})();
