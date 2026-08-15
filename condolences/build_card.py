import os

def read_b64(filename):
    with open(f"/home/solari/.gemini/antigravity/scratch/condolences-card/{filename}", "r") as f:
        content = f.read().strip()
        # Some files might already include data:image prefix, some might not. We assume they do based on instructions.
        return content

bg_data = read_b64("bg.b64")
gif0_data = read_b64("gif0.b64")
gif1_data = read_b64("gif1.b64")
leave_data = read_b64("leavemessage.b64")

html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Condolences</title>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400&display=swap" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        :root {{
            --bg-color: #111;
            --text-color: #d4d4d4;
            --name-color: #8a8a8a;
            --gold: #b8a47e;
            --blue: #7e9ab8;
        }}
        
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            -webkit-tap-highlight-color: transparent;
        }}

        body {{
            background-color: var(--bg-color);
            color: var(--text-color);
            font-family: 'Montserrat', sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            overflow: hidden;
            user-select: none;
        }}

        #loader {{
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: var(--bg-color);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            transition: opacity 1s ease;
        }}
        
        .dots {{
            display: flex;
            gap: 8px;
        }}
        
        .dot {{
            width: 8px;
            height: 8px;
            border-radius: 50%;
            background: #555;
            animation: pulse 1.5s infinite ease-in-out;
        }}
        
        .dot:nth-child(2) {{ animation-delay: 0.3s; }}
        .dot:nth-child(3) {{ animation-delay: 0.6s; }}
        
        @keyframes pulse {{
            0%, 100% {{ transform: scale(0.8); opacity: 0.3; }}
            50% {{ transform: scale(1.2); opacity: 1; }}
        }}

        .scene {{
            perspective: 1500px;
            width: min(85vw, 420px);
            height: min(127.5vw, 630px);
            opacity: 0;
            transition: opacity 1s ease;
        }}
        
        @media (min-width: 768px) {{
            .scene {{
                width: min(55vw, 400px);
                height: min(82.5vw, 600px);
            }}
        }}
        
        @media (min-width: 1200px) {{
            .scene {{
                width: 440px;
                height: 660px;
            }}
        }}

        .book {{
            width: 100%;
            height: 100%;
            position: relative;
            transform-style: preserve-3d;
        }}

        .page {{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            transform-origin: left center;
            transform-style: preserve-3d;
            transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
            cursor: pointer;
            box-shadow: 2px 0 5px rgba(0,0,0,0.3);
        }}

        .page.flipped {{
            transform: rotateY(-180deg);
        }}

        .face {{
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            backface-visibility: hidden;
            background-color: #1a1a1a;
            background-size: cover;
            background-position: center;
            overflow: hidden;
        }}
        
        .face.front {{
            transform: rotateY(0deg);
        }}

        .face.back {{
            transform: rotateY(180deg);
            background-color: #222;
            filter: brightness(1.15);
        }}
        
        .bg-textured {{
            background-image: url('{bg_data}');
            background-size: cover;
            background-position: center;
        }}
        
        /* Cover */
        #cover-front {{
            background-image: url('{gif1_data}');
        }}
        
        #page1-front {{
            background-image: url('{gif0_data}');
        }}

        .messages-container {{
            display: flex;
            flex-direction: column;
            justify-content: space-evenly;
            height: 100%;
            padding: 40px 30px;
        }}

        .message-item {{
            text-align: center;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.5s ease, transform 0.5s ease;
        }}
        
        .page.visible .message-item {{
            opacity: 1;
            transform: translateY(0);
        }}

        .message-text {{
            font-weight: 300;
            font-size: 14px;
            line-height: 1.6;
            margin-bottom: 8px;
            position: relative;
        }}
        
        .message-text::before, .message-text::after {{
            content: '"';
            color: #555;
        }}

        .message-sender {{
            font-weight: 400;
            font-size: 12px;
            color: var(--name-color);
        }}

        .tag {{
            display: inline-block;
            font-size: 10px;
            margin-top: 4px;
            letter-spacing: 0.5px;
        }}
        
        .tag-class2c {{ color: var(--gold); }}
        .tag-teacher {{ color: var(--blue); }}

        #leave-message-btn {{
            width: 100%;
            height: 100%;
            background-image: url('{leave_data}');
            background-size: contain;
            background-repeat: no-repeat;
            background-position: center;
            cursor: pointer;
            transition: transform 0.3s ease;
        }}
        
        #leave-message-btn:hover {{
            transform: scale(1.02);
        }}

        .nav-controls {{
            position: absolute;
            bottom: 15px;
            width: 100%;
            display: flex;
            justify-content: space-between;
            padding: 0 20px;
            pointer-events: none;
            z-index: 10;
        }}

        .nav-btn {{
            background: none;
            border: none;
            color: #666;
            font-size: 24px;
            cursor: pointer;
            pointer-events: auto;
            transition: color 0.3s ease;
            font-family: monospace;
            padding: 10px;
        }}
        
        .nav-btn:hover {{
            color: #aaa;
        }}
        
        .nav-btn:disabled {{
            opacity: 0;
            pointer-events: none;
        }}
        
        .page-indicators {{
            position: absolute;
            bottom: 25px;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: center;
            gap: 6px;
            pointer-events: none;
            z-index: 10;
        }}
        
        .indicator {{
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: #444;
            transition: background 0.3s ease;
        }}
        
        .indicator.active {{
            background: #888;
        }}

        /* Modal */
        #modal-overlay {{
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.85);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2000;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.4s ease;
        }}
        
        #modal-overlay.active {{
            opacity: 1;
            pointer-events: auto;
        }}

        .modal-content {{
            background: #1a1a1a;
            padding: 30px;
            border-radius: 8px;
            width: 90%;
            max-width: 400px;
            position: relative;
            border: 1px solid #333;
        }}

        .close-btn {{
            position: absolute;
            top: 15px;
            right: 15px;
            background: none;
            border: none;
            color: #666;
            font-size: 20px;
            cursor: pointer;
        }}
        
        .close-btn:hover {{ color: #aaa; }}

        .modal-title {{
            font-weight: 400;
            font-size: 18px;
            margin-bottom: 20px;
            text-align: center;
        }}

        .form-group {{
            margin-bottom: 20px;
        }}

        .form-input {{
            width: 100%;
            background: transparent;
            border: none;
            border-bottom: 1px solid #444;
            color: var(--text-color);
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            padding: 8px 0;
            outline: none;
            transition: border-color 0.3s ease;
        }}
        
        .form-input:focus {{
            border-color: #888;
        }}

        textarea.form-input {{
            resize: none;
            height: 80px;
        }}

        .char-counter {{
            font-size: 10px;
            color: #555;
            text-align: right;
            margin-top: 4px;
        }}

        .class2c-check {{
            display: none;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            font-size: 12px;
            color: var(--name-color);
        }}
        
        .class2c-check.visible {{
            display: flex;
        }}

        .submit-btn {{
            width: 100%;
            background: #222;
            border: 1px solid #444;
            color: #aaa;
            padding: 12px;
            font-family: 'Montserrat', sans-serif;
            font-size: 14px;
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 4px;
        }}
        
        .submit-btn:hover {{
            background: #2a2a2a;
            color: #d4d4d4;
        }}

        #feedback-msg {{
            display: none;
            text-align: center;
            font-size: 14px;
            color: #888;
            margin-top: 15px;
        }}
    </style>
</head>
<body>

<div id="loader">
    <div class="dots">
        <div class="dot"></div>
        <div class="dot"></div>
        <div class="dot"></div>
    </div>
</div>

<div class="scene" id="scene">
    <div class="book" id="book">
        <!-- Pages will be injected here -->
    </div>
    
    <div class="nav-controls" id="nav-controls" style="display: none;">
        <button class="nav-btn" id="prev-btn" disabled>&#x2039;</button>
        <button class="nav-btn" id="next-btn">&#x203A;</button>
    </div>
    
    <div class="page-indicators" id="page-indicators" style="display: none;">
        <!-- Indicators will be injected here -->
    </div>
</div>

<div id="modal-overlay">
    <div class="modal-content">
        <button class="close-btn" id="close-modal">&times;</button>
        <h2 class="modal-title">Leave a condolence</h2>
        
        <form id="condolence-form">
            <div class="form-group">
                <input type="text" id="sender-name" class="form-input" placeholder="Your Name" required>
            </div>
            
            <div class="class2c-check" id="class2c-group">
                <input type="checkbox" id="is-class2c">
                <label for="is-class2c">Are you from Class 2C?</label>
            </div>
            
            <div class="form-group">
                <textarea id="sender-msg" class="form-input" placeholder="Your Message" maxlength="500" required></textarea>
                <div class="char-counter"><span id="char-count">0</span>/500</div>
            </div>
            
            <button type="submit" class="submit-btn" id="submit-btn">Send</button>
            <div id="feedback-msg">Thank you. Your message will appear after review.</div>
        </form>
    </div>
</div>

<script>
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
let supabase = null;
try {{
    supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}} catch(e) {{}}

const MOCK_MESSAGES = [
  {{ name: 'Maria L.', message: 'Thinking of you and your family during this difficult time. Your dad was a wonderful person.', is_class_2c: false, is_teacher: false }},
  {{ name: 'Joshua Malic', message: 'We are all here for you. Your dad always made us laugh, and we will never forget that.', is_class_2c: true, is_teacher: false }},
  {{ name: 'Ms. Rodriguez', message: 'Your father raised an incredible person. We see his kindness reflected in you every day.', is_class_2c: false, is_teacher: true }},
  {{ name: 'Sabrina Nowlin', message: 'Sending so much love your way. Class 2C is with you through this.', is_class_2c: true, is_teacher: false }},
  {{ name: 'Coach Thompson', message: 'Your dad never missed a game. That kind of dedication showed us all what it means to be a great father.', is_class_2c: false, is_teacher: true }},
  {{ name: 'David K.', message: 'No words can take away the pain, but please know you are in our thoughts and prayers.', is_class_2c: false, is_teacher: false }},
];

const CLASS_2C_NAMES = [
    "Cecily Bejerano", "Khaleigh Bevans", "Carlisle Bol", "Skaiy Dawson", "Elsworth Hendy", 
    "Jaazielle Jacobs", "Breah Lanza", "Joshua Malic", "Kathryn Martinez", "Sabrina Nowlin", 
    "Michaiah Peters", "Glory Salazar", "Aron Stephen", "Trajhean Vivas", "Aiden Williams", "D'mauri Williams"
];

let messages = [];
let currentPageIndex = -1; // -1 is closed cover, 0 is first spread, etc.
let totalSpreads = 0;
const messagesPerPage = 3;

async function fetchMessages() {{
    try {{
        if(supabase) {{
            const {{ data, error }} = await supabase.from('messages').select('*').eq('status', 'approved').order('created_at', {{ ascending: true }});
            if (error) throw error;
            return data && data.length > 0 ? data : MOCK_MESSAGES;
        }}
    }} catch(e) {{
        console.warn("Supabase fetch failed, using mock data");
    }}
    return MOCK_MESSAGES;
}}

async function init() {{
    messages = await fetchMessages();
    buildBook();
    
    // Wait for images to load (simulated)
    setTimeout(() => {{
        document.getElementById('loader').style.opacity = '0';
        setTimeout(() => {{
            document.getElementById('loader').style.display = 'none';
            document.getElementById('scene').style.opacity = '1';
        }}, 1000);
    }}, 500);
    
    setupInteractions();
}}

function buildBook() {{
    const book = document.getElementById('book');
    const messagePages = Math.ceil(messages.length / messagesPerPage);
    totalSpreads = messagePages + 1; // +1 for the last page
    
    // Z-indexes: highest for cover, lowest for last page
    
    // Cover page (Index 0 in DOM, represents Page 0)
    let z = 100;
    
    // Create Cover
    const coverHTML = `
    <div class="page" id="page-cover" style="z-index: ${{z--}}">
        <div class="face front" id="cover-front"></div>
        <div class="face back bg-textured"></div>
    </div>`;
    
    book.insertAdjacentHTML('beforeend', coverHTML);
    
    // Create Inside First Page (Message GIF on left, first messages on right... wait, book logic)
    // Actually, flipping cover reveals back of cover (left) and front of Page 1 (right).
    // Let's structure it as individual physical pages turning right to left.
    // Page 0: Cover (Front: Cover GIF, Back: bg texture)
    // Page 1: (Front: Inside GIF, Back: bg texture)
    // Page 2: (Front: Msgs 1-3, Back: bg texture)
    // Page 3: (Front: Msgs 4-6, Back: bg texture)
    // Page N: (Front: Leave Message, Back: bg texture)
    
    // We want the cover to open and reveal the inside GIF.
    // When cover flips, we see back of cover (left) and Front of Page 1 (right).
    // Let's make back of cover the left side, and Front of Page 1 the right side.
    
    // Create Page 1 (Inside GIF)
    const p1HTML = `
    <div class="page" id="page-1" style="z-index: ${{z--}}">
        <div class="face front" id="page1-front"></div>
        <div class="face back bg-textured"></div>
    </div>`;
    book.insertAdjacentHTML('beforeend', p1HTML);
    
    // Create Message Pages
    for (let i = 0; i < messagePages; i++) {{
        const pageMsgs = messages.slice(i * messagesPerPage, (i + 1) * messagesPerPage);
        let msgsHTML = '';
        pageMsgs.forEach((msg, idx) => {{
            let tag = '';
            if (msg.is_class_2c) tag = '<div class="tag tag-class2c">Class 2C &hearts;</div>';
            else if (msg.is_teacher) tag = '<div class="tag tag-teacher">Teacher</div>';
            
            msgsHTML += `
            <div class="message-item" style="transition-delay: ${{idx * 0.2}}s">
                <div class="message-text">${{msg.message}}</div>
                <div class="message-sender">&mdash; ${{msg.name}}</div>
                ${{tag}}
            </div>`;
        }});
        
        const pHTML = `
        <div class="page msg-page" id="page-${{i+2}}" style="z-index: ${{z--}}">
            <div class="face front bg-textured">
                <div class="messages-container">${{msgsHTML}}</div>
            </div>
            <div class="face back bg-textured"></div>
        </div>`;
        book.insertAdjacentHTML('beforeend', pHTML);
    }}
    
    // Create Last Page
    const lastHTML = `
    <div class="page" id="page-last" style="z-index: ${{z--}}">
        <div class="face front bg-textured">
            <div id="leave-message-btn"></div>
        </div>
        <div class="face back bg-textured"></div>
    </div>`;
    book.insertAdjacentHTML('beforeend', lastHTML);
    
    totalSpreads = document.querySelectorAll('.page').length - 1; // Number of flippable pages
    
    // Build indicators
    const indContainer = document.getElementById('page-indicators');
    for (let i = 0; i < totalSpreads; i++) {{
        indContainer.insertAdjacentHTML('beforeend', `<div class="indicator" id="ind-${{i}}"></div>`);
    }}
    updateNav();
}}

function updateNav() {{
    const pages = document.querySelectorAll('.page');
    pages.forEach((p, i) => {{
        if (i <= currentPageIndex) {{
            p.classList.add('flipped');
        }} else {{
            p.classList.remove('flipped');
        }}
        
        // Trigger animations for visible messages
        if (i === currentPageIndex + 1) {{
            p.classList.add('visible');
        }} else {{
            p.classList.remove('visible');
        }}
    }});
    
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const navControls = document.getElementById('nav-controls');
    const indicators = document.getElementById('page-indicators');
    
    if (currentPageIndex === -1) {{
        navControls.style.display = 'none';
        indicators.style.display = 'none';
    }} else {{
        navControls.style.display = 'flex';
        indicators.style.display = 'flex';
        prevBtn.disabled = currentPageIndex === 0;
        nextBtn.disabled = currentPageIndex === totalSpreads - 1;
        
        document.querySelectorAll('.indicator').forEach((ind, i) => {{
            if (i === currentPageIndex) ind.classList.add('active');
            else ind.classList.remove('active');
        }});
    }}
}}

function turnNext() {{
    if (currentPageIndex < totalSpreads - 1) {{
        currentPageIndex++;
        updateNav();
    }}
}}

function turnPrev() {{
    if (currentPageIndex > -1) {{
        currentPageIndex--;
        updateNav();
    }}
}}

function setupInteractions() {{
    // Cover click to open
    document.getElementById('page-cover').addEventListener('click', () => {{
        if (currentPageIndex === -1) turnNext();
    }});
    
    document.getElementById('next-btn').addEventListener('click', turnNext);
    document.getElementById('prev-btn').addEventListener('click', turnPrev);
    
    // Swipe
    let touchStartX = 0;
    let touchEndX = 0;
    document.addEventListener('touchstart', e => {{
        touchStartX = e.changedTouches[0].screenX;
    }});
    document.addEventListener('touchend', e => {{
        touchEndX = e.changedTouches[0].screenX;
        if (currentPageIndex > -1) {{
            if (touchEndX < touchStartX - 50) turnNext();
            if (touchEndX > touchStartX + 50) turnPrev();
        }}
    }});
    
    // Modal
    const modal = document.getElementById('modal-overlay');
    const closeBtn = document.getElementById('close-modal');
    
    // Delegation for leave message btn because it's dynamically inserted
    document.addEventListener('click', e => {{
        if (e.target && e.target.id === 'leave-message-btn') {{
            modal.classList.add('active');
            document.getElementById('feedback-msg').style.display = 'none';
            document.getElementById('condolence-form').style.display = 'block';
            document.getElementById('condolence-form').reset();
            document.getElementById('class2c-group').classList.remove('visible');
            document.getElementById('char-count').innerText = '0';
        }}
    }});
    
    closeBtn.addEventListener('click', () => modal.classList.remove('active'));
    
    // Form logic
    const nameInput = document.getElementById('sender-name');
    const msgInput = document.getElementById('sender-msg');
    const class2cGroup = document.getElementById('class2c-group');
    const charCount = document.getElementById('char-count');
    
    nameInput.addEventListener('input', (e) => {{
        const val = e.target.value.trim().toLowerCase();
        const isMatch = CLASS_2C_NAMES.some(n => n.toLowerCase().includes(val) && val.length > 2);
        if (isMatch) {{
            class2cGroup.classList.add('visible');
        }} else {{
            class2cGroup.classList.remove('visible');
            document.getElementById('is-class2c').checked = false;
        }}
    }});
    
    msgInput.addEventListener('input', (e) => {{
        charCount.innerText = e.target.value.length;
    }});
    
    document.getElementById('condolence-form').addEventListener('submit', async (e) => {{
        e.preventDefault();
        const msg = msgInput.value.trim();
        if (msg.length < 5) return;
        
        const btn = document.getElementById('submit-btn');
        btn.disabled = true;
        btn.innerText = 'Sending...';
        
        try {{
            // Supabase call placeholder
            // await supabase.functions.invoke('moderate-message', {{ body: {{ ... }} }})
            setTimeout(() => {{
                document.getElementById('condolence-form').style.display = 'none';
                document.getElementById('feedback-msg').style.display = 'block';
                setTimeout(() => {{
                    modal.classList.remove('active');
                    btn.disabled = false;
                    btn.innerText = 'Send';
                }}, 2000);
            }}, 1000);
        }} catch (err) {{
            console.error(err);
            btn.disabled = false;
            btn.innerText = 'Send';
        }}
    }});
}}

init();
</script>
</body>
</html>
"""

with open("/home/solari/.gemini/antigravity/scratch/condolences-card/card.html", "w") as f:
    f.write(html)
print("done")
