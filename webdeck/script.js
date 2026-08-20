/**
 * Web Deck Player v1.0 - script file
 * Dynamic Supabase Integration for Playlists & Themes with Local Fallbacks
 */

const SUPABASE_URL = "https://rkgzstnvmimumyuykueg.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJrZ3pzdG52bWltdW15dXlrdWVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcxMDQ0NTQsImV4cCI6MjEwMjY4MDQ1NH0.yr0GnZ-u75XT60q7tj99Xzu1QPcSFjkreM_z-7Jk6NM";

// Fallback playlists (used while fetching or if Supabase is offline)
var myPlaylists = {
    "90s HITS": 'PLZyqOyXxaVETqpHhT_c5GPmAPzhJpJ5K7',
    "real trap shit": 'PLDqxFOwX3ffE',
    "weather channel": 'PLGU74jVbtYnQ'
};

var currentPlaylist = "90s HITS";

// Fallback themes
var myThemes = {
    "DEFAULT": 'default',
    "SILVER": 'silver',
    "VIOLET": "violet",
    "MINIMAL": "minimal",
    "RED GRUNGE": "red-grunge"
};

var currentTheme = "DEFAULT";

// Set initial theme css
document.getElementById("player-theme").setAttribute("href", "./themes/" + (myThemes[currentTheme] || 'default') + "/webdeck-player.css");

// Load YouTube Iframe API
var tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
var firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

var player;
var isPlayerReady = false;
var songLabel = document.getElementById("songLabel");
var statusLabel = document.getElementById("statusLabel");
var statusLabelInterval;

var savedVolume = 50;
var volumeButton = document.getElementById("volumeButton");
var volumeBar = document.getElementById("volumeBar");
var isSlidingVolumeBar = false;
var videoButton = document.getElementById("videoButton");
var isVideoShowing = true;

var logo = document.getElementById("playerLogo");
var seekBar = document.getElementById("seekBar");
var isSlidingSeekBar = false;
var prevButton = document.getElementById("prevButton");
var playButton = document.getElementById("playButton");
var stopButton = document.getElementById("stopButton");
var nextButton = document.getElementById("nextButton");
var shuffleButton = document.getElementById("shuffleButton");
var shufflePlaylist = false;
var infoButton = document.getElementById("infoButton");

var playlistSelector = document.getElementById("playlistSelector");
var themeSelector = document.getElementById("themeSelector");

function updateThemeIcons() {
    var themeFolder = myThemes[currentTheme] || 'default';
    volumeButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/" + (volumeBar.value == 0 ? "mute.png" : "sound.png") + "' alt=''>";
    prevButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/prev.png' alt=''>";
    playButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/" + (player && typeof player.getPlayerState === 'function' && player.getPlayerState() == 1 ? "pause.png" : "play.png") + "' alt=''>";
    stopButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/stop.png' alt=''>";
    nextButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/next.png' alt=''>";
    infoButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/info.png' alt=''>";
    logo.innerHTML = "<img src='./themes/" + themeFolder + "/logo.png' alt=''>";
}

function populateSelectors() {
    playlistSelector.innerHTML = '';
    for (var key in myPlaylists) {
        var option = document.createElement('option');
        option.value = key;
        option.innerHTML = key;
        playlistSelector.appendChild(option);
    }
    playlistSelector.value = currentPlaylist;

    themeSelector.innerHTML = '';
    for (var tKey in myThemes) {
        var tOption = document.createElement('option');
        tOption.value = tKey;
        tOption.innerHTML = tKey;
        themeSelector.appendChild(tOption);
    }
    themeSelector.value = currentTheme;
}

// Initial populate
populateSelectors();
updateThemeIcons();

// Fetch dynamic data from Supabase
async function loadSupabaseWebdeck() {
    try {
        // 1. Fetch Playlists
        const plRes = await fetch(`${SUPABASE_URL}/rest/v1/webdeck_playlists?select=*&is_active=eq.true&order=sort_order.asc`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        if (plRes.ok) {
            const plData = await plRes.json();
            if (plData && plData.length > 0) {
                myPlaylists = {};
                plData.forEach((p, idx) => {
                    myPlaylists[p.name] = p.playlist_id;
                    if (idx === 0) currentPlaylist = p.name;
                });
            }
        }

        // 2. Fetch Themes
        const thRes = await fetch(`${SUPABASE_URL}/rest/v1/webdeck_themes?select=*&is_active=eq.true&order=sort_order.asc`, {
            headers: {
                "apikey": SUPABASE_KEY,
                "Authorization": `Bearer ${SUPABASE_KEY}`
            }
        });

        if (thRes.ok) {
            const thData = await thRes.json();
            if (thData && thData.length > 0) {
                myThemes = {};
                thData.forEach((t, idx) => {
                    myThemes[t.name] = t.folder;
                    if (idx === 0) currentTheme = t.name;
                });
            }
        }

        // Re-render selectors with fresh Supabase data
        populateSelectors();
        applyTheme(currentTheme);

        if (isPlayerReady && player && myPlaylists[currentPlaylist]) {
            player.loadPlaylist({ list: myPlaylists[currentPlaylist] });
        }
    } catch (err) {
        console.warn("Supabase WebDeck fetch error, using fallbacks:", err);
    }
}

function applyTheme(themeName) {
    currentTheme = themeName;
    var themeFolder = myThemes[currentTheme] || 'default';
    document.getElementById("player-theme").setAttribute("href", "./themes/" + themeFolder + "/webdeck-player.css");
    updateThemeIcons();
}

function onYouTubeIframeAPIReady() {
    player = new YT.Player('youtube-player', {
        height: '100%',
        width: '100%',
        playerVars: {
            'controls': 0,
            'autoplay': 0,
            'playsinline': 1,
            'loop': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

function updateSongLabel() {
    if (player && typeof player.getVideoData === 'function' && player.getVideoData() && player.getVideoData().title != undefined) {
        if (player.getVideoData().title == "") {
            songLabel.innerHTML = "<b>READY</b>";
        } else {
            songLabel.innerHTML = "<marquee><b>" + player.getVideoData().title + " - " + player.getVideoData().author + "</b></marquee>";
        }
    } else {
        songLabel.innerHTML = "<b>Loading...</b>";
    }
}

function updateStatusLabel() {
    if (!player || typeof player.getPlayerState !== 'function') return;

    let statusLabelText = "";
    let playlistArr = (typeof player.getPlaylist === 'function' ? player.getPlaylist() : null) || [];
    let listText = playlistArr.length > 0 ? " " + (player.getPlaylistIndex() + 1) + "/" + playlistArr.length : "";
    let timeText = "0:00/0:00";

    seekBar.setAttribute("max", player.getDuration() || 0);
    if (!isSlidingSeekBar) {
        seekBar.value = player.getCurrentTime() || 0;
    }
    if (!isSlidingVolumeBar) {
        volumeBar.value = player.getVolume() || 0;
    }

    switch (player.getPlayerState()) {
        case -1:
            statusLabelText = "Stopped";
            break;
        case 0:
            statusLabelText = "Ended";
            break;
        case 1:
            statusLabelText = "Playing";
            break;
        case 2:
            statusLabelText = "Paused";
            break;
        case 3:
            statusLabelText = "Loading... ";
            break;
        case 5:
            statusLabelText = "Video Cued";
            break;
    }
    timeText = formatTime(player.getCurrentTime() || 0) + "/" + formatTime(player.getDuration() || 0);
    statusLabel.innerHTML = statusLabelText + listText + " " + timeText;

    if (player.getPlayerState() == 2 /* Paused */) {
        statusLabel.setAttribute('class', 'blink');
    } else {
        statusLabel.removeAttribute('class');
    }
}

function formatTime(input) {
    var minutes = Math.trunc(input / 60);
    var seconds = Math.trunc(input - minutes * 60);
    if (seconds < 10) {
        return minutes + ":0" + seconds;
    } else {
        return minutes + ":" + seconds;
    }
}

volumeButton.addEventListener("click", function () {
    if (volumeBar.value != 0) {
        savedVolume = volumeBar.value;
        player.setVolume(0);
        volumeBar.value = 0;
        var themeFolder = myThemes[currentTheme] || 'default';
        volumeButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/mute.png' alt=''>";
    } else {
        player.setVolume(savedVolume);
        volumeBar.value = savedVolume;
        var themeFolder2 = myThemes[currentTheme] || 'default';
        volumeButton.innerHTML = "<img src='./themes/" + themeFolder2 + "/images/sound.png' alt=''>";
    }
});

volumeBar.addEventListener("input", function () {
    isSlidingVolumeBar = true;
    player.setVolume(this.value);
    var themeFolder = myThemes[currentTheme] || 'default';
    if (volumeBar.value == 0) {
        volumeButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/mute.png' alt=''>";
    } else {
        volumeButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/sound.png' alt=''>";
    }
});

volumeBar.addEventListener("mouseup", function () {
    isSlidingVolumeBar = false;
});

videoButton.addEventListener("click", function () {
    if (isVideoShowing) {
        document.getElementById("youtube-player").hidden = true;
        isVideoShowing = false;
        videoButton.setAttribute('state', 'off');
    } else {
        document.getElementById("youtube-player").hidden = false;
        isVideoShowing = true;
        videoButton.setAttribute('state', 'on');
    }
});

seekBar.addEventListener("input", function () {
    isSlidingSeekBar = true;
    player.seekTo(this.value);
});

seekBar.addEventListener("mouseup", function () {
    isSlidingSeekBar = false;
});

playButton.addEventListener("click", function () {
    if (player.getPlayerState() == 1) {
        player.pauseVideo();
    } else {
        player.playVideo();
    }
});

stopButton.addEventListener("click", function () {
    if (player.getPlayerState() == 1 || player.getPlayerState() == 2) {
        player.stopVideo();
    }
});

nextButton.addEventListener("click", function () {
    player.nextVideo();
});

prevButton.addEventListener("click", function () {
    player.previousVideo();
});

shuffleButton.addEventListener("click", function () {
    if (shufflePlaylist == false) {
        shufflePlaylist = true;
        shuffleButton.setAttribute('state', 'on');
    } else {
        shufflePlaylist = false;
        shuffleButton.setAttribute('state', 'off');
    }
    player.setShuffle(shufflePlaylist);
});

infoButton.addEventListener("click", function () {
    alert("Webdeck Player - created by Chris\ngithub.com/cristiancfm/webdeck-player\n(c) MIT License");
});

playlistSelector.addEventListener("change", function () {
    currentPlaylist = playlistSelector.value;
    player.stopVideo();
    if (myPlaylists[currentPlaylist]) {
        player.loadPlaylist({ list: myPlaylists[currentPlaylist] });
    }
});

themeSelector.addEventListener("change", function () {
    applyTheme(themeSelector.value);
});

function onPlayerReady(event) {
    isPlayerReady = true;
    if (myPlaylists[currentPlaylist]) {
        player.loadPlaylist({ list: myPlaylists[currentPlaylist] });
    }
    player.setVolume(50);
    player.setLoop(true);
}

function onPlayerStateChange(event) {
    var themeFolder = myThemes[currentTheme] || 'default';
    if (player.getPlayerState() == 1 /* Playing */) {
        playButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/pause.png' alt=''>";
    } else {
        playButton.innerHTML = "<img src='./themes/" + themeFolder + "/images/play.png' alt=''>";
    }

    if (event.data == YT.PlayerState.ENDED) {
        player.nextVideo();
    }
    updateSongLabel();
    clearInterval(statusLabelInterval);
    statusLabelInterval = setInterval(updateStatusLabel, 100);
}

// Start loading Supabase data
loadSupabaseWebdeck();