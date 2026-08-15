const SUPABASE_URL = 'https://rszdrkzpokrysnrkzwfy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzemRya3pwb2tyeXNucmt6d2Z5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODY3NjA5NzEsImV4cCI6MjEwMjMzNjk3MX0.jiu1pnrJvy-9npglcoLphSWS9bMjCHCP8iXYJaspG-0';
let sb = null;

const CLASS_2C_NAMES = [
    'Cecily Bejerano', 'Khaleigh Bevans', 'Carlisle Bol', 'Skaiy Dawson', 'Elsworth Hendy',
    'Jaazielle Jacobs', 'Breah Lanza', 'Joshua Malic', 'Kathryn Martinez', 'Sabrina Nowlin',
    'Michaiah Peters', 'Glory Salazar', 'Aron Stephen', 'Trajhean Vivas', 'Aiden Williams', "D'mauri Williams"
];

let messages = [];
let currentPageIndex = -1;
let totalSpreads = 0;
const messagesPerPage = 3; 

function setCookie(name, value, days) {
    let expires = "";
    if (days) {
        let date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}

function getCookie(name) {
    let nameEQ = name + "=";
    let ca = document.cookie.split(';');
    for(let i=0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

async function init() {
    try {
        sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch(e) {
        console.warn('Supabase init failed:', e);
    }
    await fetchMessages();
    buildBook();
    
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('loader').style.display = 'none';
            document.querySelector('.scene').style.opacity = '1';
        }, 1000);
    }, 500);
}

async function fetchMessages() {
    if (!sb) { messages = []; return; }
    try {
        const { data, error } = await sb
            .from('messages')
            .select('*')
            .eq('status', 'approved')
            .order('created_at', { ascending: true });
            
        if (error) throw error;
        messages = data || [];
    } catch (e) {
        console.error("Error fetching messages:", e);
        messages = [];
    }
}

function buildBook() {
    const book = document.getElementById('book');
    const messagePages = Math.ceil(messages.length / messagesPerPage);
    
    // Z-indexes: highest for cover, lowest for last page
    let z = 100;
    
    // Cover
    const coverHTML = `
    <div class="page" id="page-0" style="z-index: ${z--}">
        <div class="face front" id="cover-front"></div>
        <div class="face back bg-textured"></div>
    </div>`;
    book.insertAdjacentHTML('beforeend', coverHTML);
    
    // Page 1
    const p1HTML = `
    <div class="page" id="page-1" style="z-index: ${z--}">
        <div class="face front bg-textured" id="page1-front">
            <div class="inside-message-container">
                <p class="inside-paragraph">Sending our deepest condolences to you and your family.</p>
                <p class="inside-paragraph">We know how much your dad meant to you and how deeply he'll be missed.</p>
                <p class="inside-paragraph">Please remember you don't have to go through this alone.</p>
                <div class="inside-signature">&ndash; Alejandro, Jayden, Stoney, Class 2C and ISA Staff &#x2764;</div>
            </div>
        </div>
        <div class="face back bg-textured"></div>
    </div>`;
    book.insertAdjacentHTML('beforeend', p1HTML);
    
    // Message Pages
    for (let i = 0; i < messagePages; i++) {
        const pageMsgs = messages.slice(i * messagesPerPage, (i + 1) * messagesPerPage);
        let msgsHTML = '';
        pageMsgs.forEach((msg) => {
            let tag = '';
            if (msg.is_class_2c) tag = '<div class="tag tag-class2c">Class 2C &hearts;</div>';
            else if (msg.is_teacher) tag = '<div class="tag tag-teacher">Teacher</div>';
            
            msgsHTML += `
            <div class="message-item">
                <div class="message-text">${msg.message}</div>
                <div class="message-sender">&mdash; ${msg.name}</div>
                ${tag}
            </div>`;
        });
        
        const pHTML = `
        <div class="page msg-page" id="page-${i+2}" style="z-index: ${z--}">
            <div class="face front bg-textured">
                <div class="messages-container">${msgsHTML}</div>
            </div>
            <div class="face back bg-textured"></div>
        </div>`;
        book.insertAdjacentHTML('beforeend', pHTML);
    }
    
    // Last Page (Leave Message)
    const hasSubmitted = getCookie('condolence_submitted');
    
    const lastHTML = `
    <div class="page" id="page-last" style="z-index: ${z--}">
        <div class="face front bg-textured">
            <div class="form-page-content">
                ${hasSubmitted ? 
                    `<div id="thank-you-msg" class="active">thank you<div class="heart">♡</div></div>` 
                    : 
                    `<img src="assets/leavemessage.png" id="leave-message-img" alt="Leave a message">
                    <form id="inline-form">
                        <div class="form-group">
                            <input type="text" id="fname" class="inline-input" placeholder="your name" required maxlength="50">
                        </div>
                        <div class="form-group">
                            <textarea id="fmessage" class="inline-input" placeholder="your message" required maxlength="500" rows="4"></textarea>
                            <span id="char-count">0/500</span>
                        </div>
                        <div class="checkbox-group" id="class2c-group">
                            <input type="checkbox" id="fclass2c">
                            <label for="fclass2c">I am from Class 2C</label>
                        </div>
                        <button type="submit" id="submit-btn">send</button>
                    </form>
                    <div id="thank-you-msg">thank you<div class="heart">♡</div></div>`
                }
            </div>
        </div>
        <div class="face back bg-textured"></div>
    </div>`;
    book.insertAdjacentHTML('beforeend', lastHTML);
    
    totalSpreads = document.querySelectorAll('.page').length - 1;
    
    // Indicators
    const indContainer = document.getElementById('page-indicators');
    for (let i = 0; i < totalSpreads; i++) {
        indContainer.insertAdjacentHTML('beforeend', `<div class="indicator" id="ind-${i}"></div>`);
    }
    
    setupInteractions();
    updateNav();
}

function updateNav() {
    const pages = document.querySelectorAll('.page');
    pages.forEach((p, i) => {
        if (i <= currentPageIndex) {
            p.classList.add('flipped');
        } else {
            p.classList.remove('flipped');
        }
    });
    
    // Update indicators
    document.querySelectorAll('.indicator').forEach((ind, i) => {
        ind.classList.toggle('active', i === Math.max(0, currentPageIndex));
    });
    
    // Hide indicators and arrows on cover
    const indContainer = document.getElementById('page-indicators');
    if (currentPageIndex === -1) {
        indContainer.classList.remove('visible');
        document.getElementById('prev-btn').classList.add('hidden');
        document.getElementById('next-btn').classList.add('hidden');
    } else {
        indContainer.classList.add('visible');
        document.getElementById('prev-btn').classList.remove('hidden');
        
        if (currentPageIndex < totalSpreads - 1) {
            document.getElementById('next-btn').classList.remove('hidden');
        } else {
            document.getElementById('next-btn').classList.add('hidden');
        }
    }
}

function turnNext() {
    if (currentPageIndex < totalSpreads - 1) {
        currentPageIndex++;
        updateNav();
    }
}

function turnPrev() {
    if (currentPageIndex > -1) {
        currentPageIndex--;
        updateNav();
    }
}

function setupInteractions() {
    document.getElementById('prev-btn').addEventListener('click', turnPrev);
    document.getElementById('next-btn').addEventListener('click', turnNext);
    
    // Swipe gestures
    let touchStartX = 0;
    document.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; });
    document.addEventListener('touchend', e => {
        const diff = e.changedTouches[0].screenX - touchStartX;
        if (diff < -50) turnNext();
        if (diff > 50) turnPrev();
    });
    
    const pages = document.querySelectorAll('.page');
    pages.forEach((page, index) => {
        page.addEventListener('click', (e) => {
            if (e.target.closest('#inline-form') || e.target.closest('#leave-message-img')) {
                return;
            }
            
            if (index === currentPageIndex + 1) {
                turnNext();
            } else if (index === currentPageIndex) {
                turnPrev();
            }
        });
    });

    const envImg = document.getElementById('leave-message-img');
    const form = document.getElementById('inline-form');
    
    if (envImg && form) {
        envImg.addEventListener('click', () => {
            envImg.style.opacity = '0';
            setTimeout(() => {
                envImg.style.display = 'none';
                form.classList.add('active');
            }, 400);
        });

        const nameInput = document.getElementById('fname');
        const class2cGroup = document.getElementById('class2c-group');
        const fclass2c = document.getElementById('fclass2c');
        const messageInput = document.getElementById('fmessage');
        const charCount = document.getElementById('char-count');
        
        function normalize(str) {
            return str.toLowerCase().replace(/[^a-z0-9]/g, '');
        }
        
        nameInput.addEventListener('input', () => {
            const val = normalize(nameInput.value);
            if (val.length < 3) {
                class2cGroup.classList.remove('visible');
                fclass2c.checked = false;
                return;
            }
            const isMatch = CLASS_2C_NAMES.some(n => normalize(n).includes(val) || val.includes(normalize(n)));
            if (isMatch) {
                class2cGroup.classList.add('visible');
            } else {
                class2cGroup.classList.remove('visible');
                fclass2c.checked = false;
            }
        });

        messageInput.addEventListener('input', () => {
            charCount.textContent = `${messageInput.value.length}/500`;
        });

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('submit-btn');
            btn.disabled = true;
            btn.textContent = '...';
            
            const name = nameInput.value.trim();
            const message = messageInput.value.trim();
            const is_class_2c = fclass2c.checked;
            
            try {
                const { error } = await sb
                    .from('messages')
                    .insert({ name, message, is_class_2c, status: 'pending' });
                    
                if (error) throw error;
                
                setCookie('condolence_submitted', 'true', 365);
                
                form.style.opacity = '0';
                setTimeout(() => {
                    form.style.display = 'none';
                    document.getElementById('thank-you-msg').classList.add('active');
                }, 400);
                
            } catch (err) {
                console.error("Submission error:", err);
                alert("Something went wrong. Please try again.");
                btn.disabled = false;
                btn.textContent = 'send';
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', init);
