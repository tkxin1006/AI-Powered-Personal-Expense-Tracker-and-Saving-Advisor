// Global variables
let categoryDetector;
let chatHistory = [];
let chatMessages;
let chatInput;
let sendBtn;
let welcomeMessage;
let voiceBtn;         
let recognition;      

window.pendingTransactionText = null;

const CHAT_HISTORY_KEY = 'finance_tracker_chat_history';
const MAX_HISTORY_MESSAGES = 50;

// ─────────────────────────────────────────────────────────────────
// Confidence thresholds
// ─────────────────────────────────────────────────────────────────
const CONFIDENCE_AUTO_SAVE  = 88;   // ≥88% → save silently, no prompt
const CONFIDENCE_CONFIRM    = 60;   // 60–87% → show confirm buttons
// <60% → show full manual category picker

// ─────────────────────────────────────────────────────────────────
// Chat history helpers
// ─────────────────────────────────────────────────────────────────
function saveChatHistory() {
    try {
        localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatHistory.slice(-MAX_HISTORY_MESSAGES)));
    } catch (e) {}
}

function loadChatHistory() {
    try {
        const saved = localStorage.getItem(CHAT_HISTORY_KEY);
        if (saved) { chatHistory = JSON.parse(saved); return chatHistory; }
    } catch (e) {}
    return [];
}

function clearChatHistory() {
    chatHistory = [];
    localStorage.removeItem(CHAT_HISTORY_KEY);
}

function restoreChatMessages() {
    if (!chatMessages) return;
    if (chatHistory.length > 0 && welcomeMessage) welcomeMessage.style.display = 'none';
    chatHistory.forEach(msg => {
        if (msg.type === 'user') addUserMessage(msg.text, false);
        else if (msg.type === 'ai') addAIMessage(msg.text, msg.transaction, false);
    });
}

// ─────────────────────────────────────────────────────────────────
// Global onclick handlers
// ─────────────────────────────────────────────────────────────────
window.sendExample = function(text) {
    if (!chatInput) return;
    chatInput.value = text;
    sendMessage();
};

window.sendQuickAction = function(action) {
    if (!chatInput) return;
    chatInput.value = action;
    sendMessage();
};

window.clearChatConversation = function() {
    if (confirm('Clear entire chat history? This cannot be undone.')) {
        clearChatHistory();
        chatMessages.innerHTML = '';
        if (welcomeMessage) welcomeMessage.style.display = 'block';
    }
};

// ─────────────────────────────────────────────────────────────────
// "No — let me pick" handler
// Replaces the confirm area with BOTH expense and income categories,
// so the user can correct a wrong type detection (e.g. AI said income
// but it was actually an expense, or vice versa).
// ─────────────────────────────────────────────────────────────────
window.showAllCategoriesFor = function(btn) {
    const allCategories = JSON.parse(btn.getAttribute('data-all-categories'));
    const confirmArea   = btn.closest('[data-confirm-area]');
    if (!confirmArea) return;

    const expenseCats = allCategories.filter(c => c.type === 'expense');
    const incomeCats  = allCategories.filter(c => c.type === 'income');

    let html = `<div style="margin-top:12px;">
        <p style="margin-bottom:10px;font-weight:600;color:#333;">Choose the correct category:</p>`;

    if (expenseCats.length > 0) {
        html += `<p style="font-size:12px;color:#666;margin-bottom:6px;font-weight:600;">💸 EXPENSE</p>
                 <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">`;
        expenseCats.forEach(cat => {
            html += `<button onclick="selectCategory('${cat.id}','${cat.name}')"
                style="background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:white;border:none;
                       border-radius:20px;padding:8px 15px;font-size:13px;cursor:pointer;font-weight:500;">
                ${cat.name}</button>`;
        });
        html += `</div>`;
    }

    if (incomeCats.length > 0) {
        html += `<p style="font-size:12px;color:#666;margin-bottom:6px;font-weight:600;">💰 INCOME</p>
                 <div style="display:flex;flex-wrap:wrap;gap:6px;">`;
        incomeCats.forEach(cat => {
            html += `<button onclick="selectCategory('${cat.id}','${cat.name}')"
                style="background:linear-gradient(135deg,#38a169 0%,#276749 100%);color:white;border:none;
                       border-radius:20px;padding:8px 15px;font-size:13px;cursor:pointer;font-weight:500;">
                ${cat.name}</button>`;
        });
        html += `</div>`;
    }

    html += `</div>`;
    confirmArea.outerHTML = html;
};

// ─────────────────────────────────────────────────────────────────
// DATE EXTRACTION
// Parses natural-language date expressions from a message.
// Returns:
//   dateStr        – 'YYYY-MM-DD' to store in the DB
//   dateLabel      – friendly label shown to user (null = today, no label)
//   cleanedMessage – original message with the date phrase removed
//
// Supported inputs (examples):
//   "yesterday kfc 25"           → yesterday
//   "last monday grab 50"        → most recent past Monday
//   "tuesday salary 3000"        → most recent past Tuesday
//   "2 days ago watson 45"       → 2 days ago
//   "3/6 grab 50"                → 3 June current year
//   "03/06/2025 kfc 25"          → 3 June 2025
//   "3 june kfc 15"              → 3 June current year
//   (no date) "kfc 25"           → today (dateLabel = null)
// ─────────────────────────────────────────────────────────────────
function extractDate(message) {
    const lower = message.toLowerCase();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Helper – format Date → 'YYYY-MM-DD' using LOCAL time (not UTC)
    function fmt(d) {
        const y   = d.getFullYear();
        const mon = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${mon}-${day}`;
    }

    // Helper – friendly label e.g. 'Mon, 2 Jun'
    function friendlyLabel(d) {
        return d.toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    // Helper – clone today and subtract N days
    function daysAgo(n) {
        const d = new Date(today);
        d.setDate(d.getDate() - n);
        return d;
    }

    // Helper – most-recent past occurrence of weekday (0=Sun…6=Sat)
    function lastWeekday(targetDay) {
        const d = new Date(today);
        const diff = (d.getDay() - targetDay + 7) % 7 || 7;
        d.setDate(d.getDate() - diff);
        return d;
    }

    const WEEKDAY_MAP = {
        monday: 1, tuesday: 2, wednesday: 3,
        thursday: 4, friday: 5, saturday: 6, sunday: 0
    };

    const MONTH_MAP = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const MONTH_RE = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
    const WEEKDAY_RE = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday';

    const patterns = [
        // ISO date: 2025-06-03
        {
            re: /\b(\d{4})-(\d{1,2})-(\d{1,2})\b/,
            fn: (m) => new Date(`${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`)
        },
        // DD/MM/YYYY or DD-MM-YYYY
        {
            re: /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/,
            fn: (m) => new Date(`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`)
        },
        // "3 june 2025" / "3 jun"
        {
            re: new RegExp(`\\b(\\d{1,2})\\s+(${MONTH_RE})\\s*(\\d{4})?\\b`, 'i'),
            fn: (m) => {
                const mKey = m[2].slice(0, 3).toLowerCase();
                const yr   = m[3] ? parseInt(m[3]) : today.getFullYear();
                return new Date(yr, MONTH_MAP[mKey], parseInt(m[1]));
            }
        },
        // DD/MM (assume current year)
        {
            re: /\b(\d{1,2})\/(\d{1,2})\b/,
            fn: (m) => new Date(today.getFullYear(), parseInt(m[2]) - 1, parseInt(m[1]))
        },
        // "last monday"
        {
            re: new RegExp(`\\blast\\s+(${WEEKDAY_RE})\\b`, 'i'),
            fn: (m) => lastWeekday(WEEKDAY_MAP[m[1].toLowerCase()])
        },
        // "this monday"
        {
            re: new RegExp(`\\bthis\\s+(${WEEKDAY_RE})\\b`, 'i'),
            fn: (m) => lastWeekday(WEEKDAY_MAP[m[1].toLowerCase()])
        },
        // plain weekday
        {
            re: new RegExp(`\\b(${WEEKDAY_RE})\\b`, 'i'),
            fn: (m) => lastWeekday(WEEKDAY_MAP[m[1].toLowerCase()])
        },
        // "N days ago"
        {
            re: /\b(\d+)\s*days?\s*ago\b/i,
            fn: (m) => daysAgo(parseInt(m[1]))
        },
        { re: /\byesterday\b/i,    fn: () => daysAgo(1)  },
        { re: /\blast\s*week\b/i,  fn: () => daysAgo(7)  },
        { re: /\btoday\b/i,        fn: () => today       },
        { re: /\bjust\s*now\b/i,   fn: () => today       },
    ];

    for (const { re, fn } of patterns) {
        const m = lower.match(re);
        if (m) {
            const parsed = fn(m);
            if (!isNaN(parsed.getTime())) {
                const cleaned = message.replace(re, '').replace(/\s+/g, ' ').trim();
                const diffDays = Math.round((today - parsed) / 86400000);
                const lbl = diffDays === 0 ? null : friendlyLabel(parsed);
                return { dateStr: fmt(parsed), dateLabel: lbl, cleanedMessage: cleaned };
            }
        }
    }

    return { dateStr: fmt(today), dateLabel: null, cleanedMessage: message };
}

// ─────────────────────────────────────────────────────────────────
// selectCategory — saves the transaction to the DB
// ─────────────────────────────────────────────────────────────────
window.selectCategory = function(categoryId, categoryName, isAuto = false) {
    if (!isAuto) addUserMessage(`I'll use the category: ${categoryName}`);

    const parsed = window.pendingParsed || parseTransactionFallback(window.pendingTransactionText || '');

    if (!parsed) {
        addAIMessage('❌ Sorry, there was an error processing your transaction. Please try again.');
        return;
    }

    const txDate = parsed.date || (() => {
        const n = new Date();
        return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
    })();

    const formData = new FormData();
    formData.append('type',             parsed.type);
    formData.append('amount',           parsed.amount);
    formData.append('description',      parsed.description);
    formData.append('category_id',      categoryId);
    formData.append('transaction_date', txDate);
    formData.append('save_to_db',       '1');

    fetch('api.php?action=add_transaction', {
        method: 'POST',
        body: formData
    })
    .then(r => r.json())
    .then(data => {
        if (data.success) {
            categoryDetector.learnFromTransaction(parsed.description, categoryName);

            const icon     = parsed.type === 'income' ? '💰' : '✅';
            const typeText = parsed.type === 'income' ? 'income' : 'expense';

            const savedDate = new Date(txDate + 'T00:00:00');
            const todayMid  = new Date(); todayMid.setHours(0, 0, 0, 0);
            const diffDays  = Math.round((todayMid - savedDate) / 86400000);
            let dateDisplay;
            if      (diffDays === 0) dateDisplay = 'Today';
            else if (diffDays === 1) dateDisplay = 'Yesterday';
            else                     dateDisplay = savedDate.toLocaleDateString('en-MY',
                                                       { weekday: 'short', day: 'numeric', month: 'short' });

            addAIMessage(
                `${icon} Done! I've saved your ${typeText}.`,
                {
                    type:        parsed.type,
                    amount:      parsed.amount.toFixed(2),
                    description: parsed.description,
                    category:    categoryName,
                    date:        dateDisplay
                }
            );

            window.dispatchEvent(new CustomEvent('transaction_added', {
                detail: { type: parsed.type, amount: parsed.amount, category_name: categoryName }
            }));

            if (window.location.href.includes('transactions.php')) {
                setTimeout(() => window.location.reload(), 1000);
            }

            window.pendingTransactionText = null;
            window.pendingParsed = null;

            setTimeout(() => giveSmartAdviceAfterTransaction(parsed.amount, categoryName, parsed.type), 1200);
        } else {
            addAIMessage(`❌ Error: ${data.message || 'Failed to save. Please check your XAMPP configuration.'}`);
        }
    })
    .catch(() => {
        addAIMessage('❌ Database connection error. Please make sure XAMPP is running.');
    });
};

// ─────────────────────────────────────────────────────────────────
// DOM ready
// ─────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
    categoryDetector = new CategoryDetector();

    chatMessages   = document.getElementById('chat-messages');
    chatInput      = document.getElementById('chat-input');
    sendBtn        = document.getElementById('send-btn');
    welcomeMessage = document.getElementById('welcome-message');
    voiceBtn       = document.getElementById('voice-btn'); 

    loadChatHistory();
    restoreChatMessages();
    setupVoiceRecognition(); 

    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });

    if (chatInput) chatInput.focus();
    setTimeout(testDatabaseConnection, 2000);
});

// ─────────────────────────────────────────────────────────────────
// Send message
// ─────────────────────────────────────────────────────────────────
function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;

    if (welcomeMessage) welcomeMessage.style.display = 'none';

    addUserMessage(message);
    chatInput.value = '';
    sendBtn.disabled = true;
    showTypingIndicator();

    setTimeout(async () => {
        await processMessage(message);
        hideTypingIndicator();
        sendBtn.disabled = false;
        chatInput.focus();
    }, 600);
}

// ─────────────────────────────────────────────────────────────────
// Message rendering
// ─────────────────────────────────────────────────────────────────
function addUserMessage(message, shouldSave = true) {
    const div = document.createElement('div');
    div.className = 'message message-user';
    div.innerHTML = `
        <div class="message-avatar"><i class="fas fa-user"></i></div>
        <div class="message-content">
            ${escapeHtml(message)}
            <div class="message-time">${getCurrentTime()}</div>
        </div>`;
    chatMessages.appendChild(div);
    scrollToBottom();
    if (shouldSave) {
        chatHistory.push({ type: 'user', text: message, timestamp: new Date().toISOString() });
        saveChatHistory();
    }
}

function addAIMessage(message, transaction = null, shouldSave = true) {
    const div = document.createElement('div');
    div.className = 'message message-ai';

    let content = `<div>${message}</div>`;

    if (transaction) {
        const typeIcon  = transaction.type === 'income' ? '💰' : '💸';
        const typeText  = transaction.type === 'income' ? 'Income' : 'Expense';
        const amtClass  = transaction.type === 'income' ? 'income-color' : 'expense-color';
        content += `
            <div class="transaction-preview">
                <strong>${typeIcon} ${typeText} Added</strong><br>
                <span style="color:#666">Amount:</span> <span class="${amtClass}">$${transaction.amount}</span><br>
                <span style="color:#666">Description:</span> ${transaction.description}<br>
                <span style="color:#666">Category:</span> ${transaction.category}<br>
                <span style="color:#666">Date:</span> ${transaction.date}
            </div>`;
    }

    // Unique ID for this message (used to link button → utterance)
    const msgId = 'ai-msg-' + Date.now() + '-' + Math.floor(Math.random() * 1000);

    div.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content" id="${msgId}">
            ${content}
            <div class="message-footer">
                <span class="message-time">${getCurrentTime()}</span>
                <button class="tts-btn" title="Read aloud" onclick="toggleTTS(this, '${msgId}')">
                    <i class="fas fa-volume-up"></i>
                </button>
            </div>
        </div>`;
    chatMessages.appendChild(div);
    scrollToBottom();

    if (shouldSave) {
        chatHistory.push({ type: 'ai', text: message, transaction, timestamp: new Date().toISOString() });
        saveChatHistory();
    }
}

// ─────────────────────────────────────────────────────────────────
// Text-to-Speech Engine
// ─────────────────────────────────────────────────────────────────
let currentUtterance = null;
let currentTTSBtn    = null;

function stripHtml(html) {
    // Parse HTML into a temporary element
    const tmp = document.createElement('div');
    tmp.innerHTML = html;

    // Replace <br> with a space for natural pausing
    tmp.querySelectorAll('br').forEach(br => br.replaceWith(' '));
    // Unwrap bold/strong so their text is still read
    tmp.querySelectorAll('strong, b').forEach(el => el.replaceWith(el.textContent + ' '));

    let text = tmp.textContent;

    // ── Strip all emoji & symbols ──────────────────────────────────
    // Unicode ranges covering: emoticons, misc symbols, dingbats,
    // supplemental symbols, transport/map symbols, enclosed chars,
    // currency symbols like RM kept — only pictographs removed.
    text = text.replace(
        /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|[\u{2B00}-\u{2BFF}]|[\u{FE00}-\u{FEFF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]/gu,
        ''
    );

    // Also strip leftover bullet symbols, arrows, checkmarks, stars etc.
    text = text.replace(/[•·▪▸▹►◆◇○●★☆✓✔✗✘→←↑↓⇒⇐]/g, '');

    // Collapse multiple spaces left behind by removals
    return text.replace(/\s+/g, ' ').trim();
}

function resetTTSBtn(btn) {
    if (!btn) return;
    btn.classList.remove('tts-speaking');
    btn.innerHTML = '<i class="fas fa-volume-up"></i>';
    btn.title = 'Read aloud';
}

window.toggleTTS = function(btn, msgId) {
    const synth = window.speechSynthesis;
    if (!synth) {
        alert('Text-to-speech is not supported in your browser.');
        return;
    }

    // If this button is currently speaking → stop it
    if (btn.classList.contains('tts-speaking')) {
        synth.cancel();
        resetTTSBtn(btn);
        currentTTSBtn    = null;
        currentUtterance = null;
        return;
    }

    // Stop any other ongoing speech first
    if (synth.speaking) {
        synth.cancel();
        resetTTSBtn(currentTTSBtn);
    }

    // Extract plain text from the message bubble
    const msgEl  = document.getElementById(msgId);
    const rawText = msgEl ? stripHtml(msgEl.innerHTML) : '';
    // Remove the time/footer text that we don't want read aloud
    const cleanText = rawText.replace(/\d{1,2}:\d{2}\s*(AM|PM)?/gi, '').trim();

    if (!cleanText) return;

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang  = 'en-MY';   // Malaysian English accent preference
    utterance.rate  = 0.95;      // Slightly slower for clarity
    utterance.pitch = 1.05;

    // Pick a natural-sounding voice if available
    const voices = synth.getVoices();
    const preferred = voices.find(v =>
        v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
    ) || voices.find(v => v.lang.startsWith('en'));
    if (preferred) utterance.voice = preferred;

    // Button → speaking state
    btn.classList.add('tts-speaking');
    btn.innerHTML = '<i class="fas fa-stop"></i>';
    btn.title = 'Stop reading';
    currentTTSBtn    = btn;
    currentUtterance = utterance;

    utterance.onend = () => {
        resetTTSBtn(btn);
        currentTTSBtn    = null;
        currentUtterance = null;
    };

    utterance.onerror = () => {
        resetTTSBtn(btn);
        currentTTSBtn    = null;
        currentUtterance = null;
    };

    synth.speak(utterance);
};

// Stop any speech when user navigates away
window.addEventListener('beforeunload', () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
});

function showTypingIndicator() {
    const div = document.createElement('div');
    div.className = 'message message-ai';
    div.id = 'typing-indicator';
    div.innerHTML = `
        <div class="message-avatar"><i class="fas fa-robot"></i></div>
        <div class="message-content">
            <div class="typing-indicator active"><span></span><span></span><span></span></div>
        </div>`;
    chatMessages.appendChild(div);
    scrollToBottom();
}

function hideTypingIndicator() {
    const el = document.getElementById('typing-indicator');
    if (el) el.remove();
}

// ─────────────────────────────────────────────────────────────────
// Core message processing
// ─────────────────────────────────────────────────────────────────
async function processMessage(message) {
    const lower = message.toLowerCase().trim();

    // Does the message contain an amount? Covers: 12, rm12, rm 12, $12, 12.50
    const hasAmount = /(?:rm|myr|usd|\$)\s*\d+(\.\d+)?|\d+(\.\d+)?/i.test(message);

    // ── Commands — only run when NO number is present ──────────────
    if (!hasAmount) {
        if (['help', 'how to use', '?'].includes(lower)) {
            showHelp(); return;
        }
        if (lower.includes('balance') || lower.includes('total'))            { await showBalance();             return; }
        if (lower.includes('recent') || lower.includes('transaction') ||
            lower.includes('history'))                                        { await showRecentTransactions(); return; }
        if (lower.includes('analyz') || lower.includes('spending habits'))   { await analyzeSpending();         return; }
        if (lower.includes('overspend') || lower.includes('over budget') ||
            lower.includes('budget check'))                                   { await checkBudgetStatus();       return; }
        if (lower.includes('suggest daily meals') || lower.includes('meal plan') ||
            lower.includes('suggest daily'))                                  { await suggestDailyMeals();       return; }
        if (lower.includes('advice') || lower.includes('tip') ||
            lower.includes('how can i save'))                                 { await giveFinancialAdvice();     return; }
        if (lower.includes('food spending') || lower.includes('spent on food')) {
            await analyzeCategorySpending('food'); return;
        }

        addAIMessage(`
            I'm not sure what you mean. 😕<br><br>
            <strong>To add a transaction, include an amount:</strong><br>
            • <strong>"kfc 25"</strong> → expense today<br>
            • <strong>"yesterday grab 50"</strong> → expense, yesterday<br>
            • <strong>"last monday salary 3000"</strong> → income, last Monday<br><br>
            Type <strong>"help"</strong> for all date formats and examples.
        `);
        return;
    }

    // ── STEP 1: Extract date from message ─────────────────────────
    const { dateStr, dateLabel, cleanedMessage } = extractDate(message);

    // ── STEP 2: Extract amount from the date-cleaned message ───────
    const amount = extractAmount(cleanedMessage);
    if (!amount) {
        addAIMessage(`
            I couldn't find an amount in your message. 😕<br><br>
            <strong>Try these formats:</strong><br>
            • <strong>"kfc 25"</strong> — expense today<br>
            • <strong>"yesterday grab 50"</strong> — expense, yesterday<br>
            • <strong>"last monday salary 3000"</strong> — income, last Monday<br>
            • <strong>"3/6 watson 45"</strong> — expense, 3 June<br><br>
            Type <strong>"help"</strong> for more examples.
        `);
        return;
    }

    // ── STEP 3: Load ALL categories from DB (both types) ───────────
    window.pendingTransactionText = cleanedMessage;
    window.pendingAmount = amount;

    let allCategories = [];
    try {
        const res  = await fetch('api.php?action=get_categories');
        const data = await res.json();
        if (data.success) allCategories = data.data;
    } catch (e) {
        addAIMessage('❌ Could not load categories. Please check your connection.');
        return;
    }

    // ── STEP 4: Detect category from the cleaned message ───────────
    const match = categoryDetector.detectCategoryAndType(cleanedMessage);

    if (match) {
        const detectedType   = match.isIncome ? 'income' : 'expense';
        const typeCategories = allCategories.filter(c => c.type === detectedType);
        const dbCategory     = findDbCategory(match.category, typeCategories);

        if (dbCategory) {
            const desc = cleanDescription(cleanedMessage);
            window.pendingParsed = { amount, description: desc, type: detectedType, date: dateStr };

            if (match.confidence >= CONFIDENCE_AUTO_SAVE) {
                if (dateLabel) {
                    addAIMessage(`📅 Saving this for <strong>${dateLabel}</strong>…`);
                }
                selectCategory(dbCategory.id, dbCategory.name, true);
            } else if (match.confidence >= CONFIDENCE_CONFIRM) {
                showConfirmPrompt(dbCategory, allCategories, detectedType, desc, match.confidence, dateLabel);
            } else {
                showManualCategoryPicker(allCategories, amount, cleanedMessage, dateLabel);
            }
            return;
        }
    }

    // ── STEP 5: No category match → full manual picker ─────────────
    const desc = cleanDescription(cleanedMessage);
    window.pendingParsed = { amount, description: desc, type: 'expense', date: dateStr };
    showManualCategoryPicker(allCategories, amount, cleanedMessage, dateLabel);
}

// ─────────────────────────────────────────────────────────────────
// Find the matching DB category for a detected category name.
// ─────────────────────────────────────────────────────────────────
function findDbCategory(detectedName, dbCategories) {
    if (!detectedName || !dbCategories.length) return null;

    const s = detectedName.toLowerCase();
    const detectedTokens = s.split(/[\s&,]+/).filter(w => w.length >= 3);

    let bestMatch = null;
    let bestScore = -1;

    dbCategories.forEach(cat => {
        const catName   = cat.name.toLowerCase();
        const catTokens = catName.split(/[\s&,]+/).filter(w => w.length >= 3);
        let score = 0;

        if      (catName === s)           score = 100;
        else if (s.includes(catName))     score = 85;
        else if (catName.includes(s))     score = 80;
        else {
            const overlap = detectedTokens.filter(t => catTokens.includes(t)).length;
            if (overlap > 0) {
                const coverage = overlap / Math.min(detectedTokens.length || 1, catTokens.length || 1);
                score = Math.round(65 * coverage);
            }
        }

        if (score > bestScore) { bestScore = score; bestMatch = cat; }
    });

    return bestScore >= 30 ? bestMatch : null;
}

// ─────────────────────────────────────────────────────────────────
// Show confirm prompt (medium confidence)
// ─────────────────────────────────────────────────────────────────
function showConfirmPrompt(dbCategory, allCategories, detectedType, desc, confidence, dateLabel) {
    const typeIcon      = detectedType === 'income' ? '💰' : '💸';
    const typeLabel     = detectedType === 'income' ? 'income' : 'expense';
    const confidenceBar = confidence >= 80 ? '🟢' : confidence >= 65 ? '🟡' : '🟠';
    const dateHint      = dateLabel
        ? `<br>📅 Date: <strong>${dateLabel}</strong>`
        : '<br>📅 Date: <strong>Today</strong>';

    const allCatsJson = JSON.stringify(
        allCategories.map(c => ({ id: c.id, name: c.name, type: c.type }))
    ).replace(/'/g, '&#39;');

    addAIMessage(`
        ${typeIcon} I think <strong>"${desc}"</strong> is a <strong>${typeLabel}</strong>
        under <strong>${dbCategory.name}</strong>. ${confidenceBar} (${confidence}% confident)${dateHint}<br><br>
        <div data-confirm-area style="display:flex;gap:10px;margin:12px 0;flex-wrap:wrap;">
            <button onclick="selectCategory('${dbCategory.id}','${dbCategory.name}',true)"
                style="background:#38a169;color:white;border:none;border-radius:20px;padding:10px 22px;
                       font-size:14px;cursor:pointer;font-weight:600;box-shadow:0 3px 8px rgba(56,161,105,0.3);">
                ✅ Yes — save as ${dbCategory.name}
            </button>
            <button onclick="showAllCategoriesFor(this)"
                data-all-categories='${allCatsJson}'
                style="background:white;color:#667eea;border:2px solid #667eea;border-radius:20px;
                       padding:10px 22px;font-size:14px;cursor:pointer;font-weight:600;">
                🔄 No — let me pick
            </button>
        </div>
    `);
}

// ─────────────────────────────────────────────────────────────────
// Show full manual category picker
// ─────────────────────────────────────────────────────────────────
function showManualCategoryPicker(categories, amount, message, dateLabel) {
    const expenseCats = categories.filter(c => c.type === 'expense');
    const incomeCats  = categories.filter(c => c.type === 'income');
    const dateHint    = dateLabel
        ? `<p style="font-size:12px;color:#555;margin-bottom:10px;">📅 Will be saved as: <strong>${dateLabel}</strong></p>`
        : '<p style="font-size:12px;color:#555;margin-bottom:10px;">📅 Will be saved as: <strong>Today</strong></p>';

    let html = `
        <div style="background:rgba(102,126,234,0.08);border-radius:10px;padding:15px;border-left:4px solid #667eea;">
            <p style="margin-bottom:6px;font-weight:600;">🤔 I'm not sure how to categorize this. Please pick:</p>
            ${dateHint}`;

    if (expenseCats.length > 0) {
        html += `<p style="font-size:12px;color:#666;margin-bottom:6px;font-weight:600;">💸 EXPENSE</p>
                 <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">`;
        expenseCats.forEach(cat => {
            html += `<button onclick="selectCategory('${cat.id}','${cat.name}')"
                style="background:linear-gradient(135deg,#667eea,#764ba2);color:white;border:none;
                       border-radius:20px;padding:7px 14px;font-size:12px;cursor:pointer;font-weight:500;">
                ${cat.name}</button>`;
        });
        html += `</div>`;
    }

    if (incomeCats.length > 0) {
        html += `<p style="font-size:12px;color:#666;margin-bottom:6px;font-weight:600;">💰 INCOME</p>
                 <div style="display:flex;flex-wrap:wrap;gap:6px;">`;
        incomeCats.forEach(cat => {
            html += `<button onclick="selectCategory('${cat.id}','${cat.name}')"
                style="background:linear-gradient(135deg,#38a169,#276749);color:white;border:none;
                       border-radius:20px;padding:7px 14px;font-size:12px;cursor:pointer;font-weight:500;">
                ${cat.name}</button>`;
        });
        html += `</div>`;
    }

    html += `</div>`;
    addAIMessage(html);
}

// ─────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────
function extractAmount(message) {
    // Normalise: strip currency symbols/words so they don't confuse the regex.
    // Handles: rm12, rm 12, rm12.50, RM 12, $12, usd 12, myr 12
    const normalised = message
        .replace(/\brm\s*/gi,  '')   // rm12 → 12  |  rm 12 → 12
        .replace(/\$\s*/g,     '')   // $12  → 12
        .replace(/\busd\s*/gi, '')
        .replace(/\bmyr\s*/gi, '');

    const match = normalised.match(/\d+(\.\d+)?/);
    return match ? parseFloat(match[0]) : null;
}

function cleanDescription(message) {
    return message
        .replace(/\b(rm|myr|usd)\s*\d+(\.\d+)?/gi, '')  // rm12 / rm 12.50
        .replace(/\$\s*\d+(\.\d+)?/g, '')                 // $12
        .replace(/\d+(\.\d+)?\s*(rm|myr|usd)\b/gi, '')    // 12rm  (rare but seen)
        .replace(/\d+(\.\d+)?/g, '')                       // bare number fallback
        .replace(/\s+/g, ' ')
        .trim() || message.trim();
}

function parseTransactionFallback(message) {
    if (window.pendingParsed && message === window.pendingTransactionText) {
        return window.pendingParsed;
    }
    // Strip currency prefix before extracting the number
    const normalised = message.replace(/\b(rm|myr|usd)\s*/gi, '').replace(/\$\s*/g, '');
    const amountMatch = normalised.match(/\d+(\.\d+)?/);
    if (!amountMatch) return null;
    const amount      = parseFloat(amountMatch[0]);
    const description = cleanDescription(message) || 'Transaction';
    const lower       = message.toLowerCase();
    const isIncome    = lower.includes('income') || lower.includes('salary') ||
                        lower.includes('gaji')   || lower.includes('freelance');
    return {
        amount,
        description,
        type: isIncome ? 'income' : 'expense',
        date: (() => { const n = new Date(); return `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`; })()
    };
}

// ─────────────────────────────────────────────────────────────────
// Help message
// ─────────────────────────────────────────────────────────────────
function showHelp() {
    addAIMessage(`
        <strong>📖 How to use me:</strong><br><br>

        <strong>Add Expense:</strong> description + amount (+ optional date)<br>
        • <code>grab 50</code> → Transportation, today<br>
        • <code>yesterday kfc 25</code> → Food, yesterday<br>
        • <code>last monday unifi 89</code> → Bills, last Monday<br>
        • <code>tuesday watson 30</code> → Healthcare, last Tuesday<br>
        • <code>3/6 madam yap 15</code> → Food, 3 Jun<br>
        • <code>2 days ago starbucks 18</code> → Food, 2 days ago<br><br>

        <strong>Add Income:</strong><br>
        • <code>salary 3000</code> → Salary, today<br>
        • <code>last friday lalamove driver 200</code> → Freelance, last Friday<br>
        • <code>freelance 500</code> → Freelance, today<br><br>

        <strong>Supported date formats:</strong><br>
        • <code>today</code>, <code>yesterday</code><br>
        • <code>last monday</code> … <code>last sunday</code><br>
        • <code>2 days ago</code>, <code>5 days ago</code><br>
        • <code>3/6</code>, <code>03/06/2025</code>, <code>3 june</code><br>
        • <em>(no date)</em> → saved as <strong>today</strong><br><br>

        <strong>View & Analyze:</strong><br>
        • <code>show balance</code> — current balance<br>
        • <code>recent transactions</code> — recent history<br>
        • <code>analyze my spending</code> — spending breakdown<br>
        • <code>am I overspending?</code> — budget check<br>
        • <code>suggest daily meals</code> — money-saving meal plan<br>
        • <code>advice</code> — financial tips<br>
    `);
}

// ─────────────────────────────────────────────────────────────────
// Smart post-transaction advice
// ─────────────────────────────────────────────────────────────────
async function giveSmartAdviceAfterTransaction(amount, category, type) {
    if (type === 'income') return;
    try {
        const res  = await fetch('api.php?action=get_transactions&limit=100');
        const data = await res.json();
        if (!data.success) return;

        const n = new Date();
        const today = `${n.getFullYear()}-${String(n.getMonth()+1).padStart(2,'0')}-${String(n.getDate()).padStart(2,'0')}`;
        const todayExpenses = data.data.filter(t => t.transaction_date === today && t.type === 'expense');
        const todayTotal    = todayExpenses.reduce((sum, t) => sum + parseFloat(t.amount), 0);

        if (todayTotal > 100 && todayExpenses.length > 3) {
            setTimeout(() => {
                addAIMessage(`💡 <strong>Heads up:</strong> You've spent <strong>$${todayTotal.toFixed(2)}</strong> today across ${todayExpenses.length} transactions. Consider cooling down for the rest of the day!`);
            }, 2000);
        }
    } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────
// Balance
// ─────────────────────────────────────────────────────────────────
async function showBalance() {
    try {
        const res  = await fetch('api.php?action=get_transactions&limit=1000');
        const data = await res.json();
        if (!data.success) return;

        let income = 0, expense = 0;
        data.data.forEach(t => t.type === 'income'
            ? income  += parseFloat(t.amount)
            : expense += parseFloat(t.amount));
        const balance = income - expense;

        addAIMessage(`
            <strong>💰 Your Balance</strong><br><br>
            Total Income: <span class="income-color">$${income.toFixed(2)}</span><br>
            Total Expenses: <span class="expense-color">$${expense.toFixed(2)}</span><br><br>
            <strong>Balance: <span class="${balance >= 0 ? 'income-color' : 'expense-color'}">$${balance.toFixed(2)}</span></strong>
            ${balance < 0 ? '<br><br>⚠️ You are spending more than you earn this period.' : ''}
        `);
    } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────
// Recent transactions
// ─────────────────────────────────────────────────────────────────
async function showRecentTransactions() {
    try {
        const res  = await fetch('api.php?action=get_transactions&limit=10');
        const data = await res.json();
        if (!data.success || data.data.length === 0) { addAIMessage('No transactions found yet.'); return; }

        let msg = '<strong>🧾 Recent Transactions</strong><br><br>';
        data.data.forEach((t, i) => {
            const date = new Date(t.transaction_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const icon = t.type === 'income' ? '💰' : '💸';
            const cls  = t.type === 'income' ? 'income-color' : 'expense-color';
            msg += `${i + 1}. ${icon} <strong>${t.description}</strong> — <span class="${cls}">$${parseFloat(t.amount).toFixed(2)}</span> <span style="color:#999">(${t.category_name}, ${date})</span><br>`;
        });
        addAIMessage(msg);
    } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────
// Spending analysis
// ─────────────────────────────────────────────────────────────────
async function analyzeSpending() {
    try {
        const res  = await fetch('api.php?action=get_transactions&limit=1000');
        const data = await res.json();
        if (!data.success || data.data.length < 3) {
            addAIMessage('📊 Not enough data yet. Add a few transactions first!'); return;
        }

        const now          = new Date();
        const thisM        = now.getMonth();
        const thisY        = now.getFullYear();
        const daysInMonth  = new Date(thisY, thisM + 1, 0).getDate();
        const daysElapsed  = Math.max(now.getDate(), 1);
        const daysLeft     = daysInMonth - daysElapsed;
        const monthName    = now.toLocaleString('en-MY', { month: 'long' });

        // ── Partition transactions ────────────────────────────────
        const thisMonthTx = data.data.filter(t => {
            const d = new Date(t.transaction_date);
            return d.getMonth() === thisM && d.getFullYear() === thisY;
        });
        const lastMonthTx = data.data.filter(t => {
            const d = new Date(t.transaction_date);
            const lm = thisM === 0 ? 11 : thisM - 1;
            const ly = thisM === 0 ? thisY - 1 : thisY;
            return d.getMonth() === lm && d.getFullYear() === ly;
        });

        // ── This month totals ─────────────────────────────────────
        let income = 0, expense = 0;
        const cats       = {};   // category → amount
        const dailySpend = {};   // date string → amount
        let txCount      = 0;

        thisMonthTx.forEach(t => {
            const amt = parseFloat(t.amount);
            if (t.type === 'income') { income += amt; return; }
            expense += amt;
            txCount++;
            cats[t.category_name] = (cats[t.category_name] || 0) + amt;
            const dk = t.transaction_date.slice(0, 10);
            dailySpend[dk] = (dailySpend[dk] || 0) + amt;
        });

        // ── Last month totals (for trend) ─────────────────────────
        let lastIncome = 0, lastExpense = 0;
        const lastCats = {};
        lastMonthTx.forEach(t => {
            const amt = parseFloat(t.amount);
            if (t.type === 'income') { lastIncome += amt; return; }
            lastExpense += amt;
            lastCats[t.category_name] = (lastCats[t.category_name] || 0) + amt;
        });

        // ── Derived stats ─────────────────────────────────────────
        const savings      = income - expense;
        const savingsRate  = income > 0 ? (savings / income) * 100 : 0;
        const dailyAvg     = expense / daysElapsed;
        const projected    = dailyAvg * daysInMonth;
        const projSavings  = income - projected;
        const spendTrend   = lastExpense > 0
            ? ((expense - lastExpense) / lastExpense) * 100 : null;

        const sorted   = Object.entries(cats).sort((a, b) => b[1] - a[1]);
        const topCat   = sorted[0];
        const top3     = sorted.slice(0, 3);

        // Highest single-day spend
        const peakDay  = Object.entries(dailySpend).sort((a,b) => b[1]-a[1])[0];

        // Active days (days with at least one expense)
        const activeDays = Object.keys(dailySpend).length;

        // ── Health score: A / B / C / D ───────────────────────────
        let grade, gradeColor, gradeTip;
        if      (savingsRate >= 30) { grade = 'A'; gradeColor = '#38a169'; gradeTip = 'Excellent! You\'re saving well above the recommended 20%.'; }
        else if (savingsRate >= 20) { grade = 'B'; gradeColor = '#68d391'; gradeTip = 'Good job! You\'re hitting the 20% savings target.'; }
        else if (savingsRate >= 10) { grade = 'C'; gradeColor = '#d69e2e'; gradeTip = 'Decent, but try to push savings above 20% by trimming discretionary spend.'; }
        else if (savingsRate >= 0)  { grade = 'D'; gradeColor = '#dd6b20'; gradeTip = 'Low savings rate. Review your top categories and cut where possible.'; }
        else                        { grade = 'F'; gradeColor = '#e53e3e'; gradeTip = 'You\'re spending more than you earn this month — action needed!'; }

        // ── Trend badge ───────────────────────────────────────────
        let trendBadge = '';
        if (spendTrend !== null) {
            const arrow = spendTrend > 0 ? '▲' : '▼';
            const tColor = spendTrend > 0 ? '#e53e3e' : '#38a169';
            trendBadge = `<span style="color:${tColor};font-size:12px;font-weight:600;">
                ${arrow} ${Math.abs(spendTrend).toFixed(1)}% vs last month</span>`;
        }

        // ── Category-specific warnings ────────────────────────────
        const warnings = [];
        if (income > 0) {
            sorted.forEach(([cat, amt]) => {
                const cl = cat.toLowerCase();
                const pct = (amt / income) * 100;
                if (cl.includes('food') && pct > 25)
                    warnings.push(`🍔 <strong>Food & Drinks</strong> is <strong>${pct.toFixed(0)}%</strong> of income — above the recommended 25%. Consider meal prepping to save RM150–300/month.`);
                else if (cl.includes('entertainment') && pct > 10)
                    warnings.push(`🎮 <strong>Entertainment</strong> is <strong>${pct.toFixed(0)}%</strong> of income — above 10%. Review active subscriptions; cancelling 2–3 unused ones saves RM30–80/month.`);
                else if (cl.includes('transport') && pct > 15)
                    warnings.push(`🚗 <strong>Transport</strong> is <strong>${pct.toFixed(0)}%</strong> of income. Try the MY50 pass or carpooling to reduce costs.`);
                else if (cl.includes('shopping') && pct > 20)
                    warnings.push(`🛒 <strong>Shopping</strong> is <strong>${pct.toFixed(0)}%</strong> of income. Apply a 48-hour rule before non-essential purchases.`);
            });
        }

        // ── Actionable tips based on top category ─────────────────
        let actionTip = '';
        if (topCat && income > 0) {
            const cl  = topCat[0].toLowerCase();
            const pct = ((topCat[1] / income) * 100).toFixed(1);
            if (cl.includes('food'))
                actionTip = `💡 Your biggest spend is <strong>${topCat[0]}</strong> at ${pct}% of income. Swapping 3 restaurant meals/week for home cooking can save ~RM200/month.`;
            else if (cl.includes('housing'))
                actionTip = `💡 <strong>${topCat[0]}</strong> is your biggest cost at ${pct}%. This is normal — ensure it stays below 35% of income.`;
            else if (cl.includes('transport'))
                actionTip = `💡 <strong>${topCat[0]}</strong> takes ${pct}% of income. Consolidating trips and using public transport on 2 days/week could save RM80–150/month.`;
            else
                actionTip = `💡 Your biggest category is <strong>${topCat[0]}</strong> at ${pct}% of income. Look for 1–2 items in this category you can reduce next month.`;
        }

        // ── Build message ─────────────────────────────────────────
        let msg = `
        <strong>📊 Spending Analysis — ${monthName}</strong><br><br>

        <!-- Health Score Row -->
        <div style="display:flex;align-items:center;gap:14px;background:#f8f9fc;border-radius:10px;padding:12px 16px;margin-bottom:14px;">
            <div style="width:52px;height:52px;border-radius:50%;background:${gradeColor};display:flex;align-items:center;
                        justify-content:center;font-size:22px;font-weight:800;color:white;flex-shrink:0;">${grade}</div>
            <div>
                <div style="font-weight:700;font-size:15px;color:#2c3e50;">Financial Health Score</div>
                <div style="font-size:13px;color:#555;margin-top:2px;">${gradeTip}</div>
            </div>
        </div>

        <!-- Key Numbers -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px;">
            <div style="background:#f0faf4;border-radius:10px;padding:12px;text-align:center;">
                <div style="font-size:11px;color:#6c757d;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">Income</div>
                <div style="font-size:17px;font-weight:700;color:#38a169;">RM${income.toFixed(2)}</div>
            </div>
            <div style="background:#fff5f5;border-radius:10px;padding:12px;text-align:center;">
                <div style="font-size:11px;color:#6c757d;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">Spent</div>
                <div style="font-size:17px;font-weight:700;color:#e53e3e;">RM${expense.toFixed(2)}</div>
                <div style="margin-top:2px;">${trendBadge}</div>
            </div>
            <div style="background:${savings >= 0 ? '#f0faf4' : '#fff5f5'};border-radius:10px;padding:12px;text-align:center;">
                <div style="font-size:11px;color:#6c757d;font-weight:600;text-transform:uppercase;letter-spacing:0.4px;">Saved</div>
                <div style="font-size:17px;font-weight:700;color:${savings >= 0 ? '#38a169' : '#e53e3e'};">RM${Math.abs(savings).toFixed(2)}</div>
                <div style="font-size:11px;color:#6c757d;">${savingsRate.toFixed(1)}% rate</div>
            </div>
        </div>

        <!-- Daily burn & projection -->
        <div style="background:#f8f9fc;border-radius:10px;padding:12px 16px;margin-bottom:14px;font-size:13px;line-height:1.8;">
            <strong>📅 Daily & Projection</strong><br>
            Avg daily spend: <strong>RM${dailyAvg.toFixed(2)}/day</strong> across ${activeDays} active days<br>
            ${peakDay ? `Highest spend day: <strong>${new Date(peakDay[0]+'T00:00:00').toLocaleDateString('en-MY',{weekday:'short',day:'numeric',month:'short'})}</strong> — RM${peakDay[1].toFixed(2)}<br>` : ''}
            Month-end projection: <strong>RM${projected.toFixed(2)}</strong>
            ${daysLeft > 0 ? ` (${daysLeft} days remaining)` : ''}<br>
            Projected savings: <strong style="color:${projSavings >= 0 ? '#38a169' : '#e53e3e'};">RM${Math.abs(projSavings).toFixed(2)}${projSavings < 0 ? ' deficit' : ''}</strong>
        </div>

        <!-- Top categories with mini bars -->
        <strong>Top Spending Categories:</strong><br>
        <div style="margin:10px 0 14px;">`;

        const maxAmt = top3[0] ? top3[0][1] : 1;
        top3.forEach(([cat, amt], i) => {
            const pct    = income > 0 ? ((amt / income) * 100).toFixed(1) : '—';
            const barPct = ((amt / maxAmt) * 100).toFixed(0);
            const barColor = i === 0 ? '#667eea' : i === 1 ? '#764ba2' : '#a78bfa';
            msg += `
            <div style="margin-bottom:10px;">
                <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:4px;">
                    <span><strong>${i+1}. ${cat}</strong></span>
                    <span style="color:#555;">RM${amt.toFixed(2)} <span style="color:#999;">(${pct}%)</span></span>
                </div>
                <div style="height:7px;background:#eee;border-radius:6px;overflow:hidden;">
                    <div style="height:100%;width:${barPct}%;background:${barColor};border-radius:6px;transition:width 0.6s;"></div>
                </div>
            </div>`;
        });

        if (sorted.length > 3) {
            msg += `<div style="font-size:12px;color:#999;margin-top:4px;">+ ${sorted.length - 3} more categories</div>`;
        }

        msg += `</div>`;

        // Warnings
        if (warnings.length > 0) {
            msg += `<div style="background:#fffbeb;border-left:3px solid #d69e2e;border-radius:0 8px 8px 0;padding:10px 14px;margin-bottom:12px;font-size:13px;line-height:1.8;">
                <strong>⚠️ Spending Alerts</strong><br>${warnings.join('<br>')}
            </div>`;
        }

        // Action tip
        if (actionTip) {
            msg += `<div style="background:#f0f4ff;border-left:3px solid #667eea;border-radius:0 8px 8px 0;padding:10px 14px;font-size:13px;line-height:1.7;">
                ${actionTip}
            </div>`;
        }

        addAIMessage(msg);
    } catch (e) {
        addAIMessage('❌ Could not load spending analysis. Please try again.');
    }
}

// ─────────────────────────────────────────────────────────────────
// Budget check
// ─────────────────────────────────────────────────────────────────
async function checkBudgetStatus() {
    try {
        const res  = await fetch('api.php?action=get_transactions&limit=1000');
        const data = await res.json();
        if (!data.success || data.data.length < 3) { addAIMessage('📊 Not enough data yet.'); return; }

        const now          = new Date();
        const daysInMonth  = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const daysGone     = now.getDate();
        const thisMonth    = data.data.filter(t =>
            new Date(t.transaction_date).getMonth() === now.getMonth());

        let income = 0, expense = 0;
        thisMonth.forEach(t => t.type === 'income'
            ? income  += parseFloat(t.amount)
            : expense += parseFloat(t.amount));

        const dailyBurn    = expense / daysGone;
        const dailyBudget  = income  / daysInMonth;
        const projectedEnd = dailyBurn * daysInMonth;

        let msg = `<strong>🧮 Budget Check</strong><br><br>
            Daily spending rate: <span class="expense-color">$${dailyBurn.toFixed(2)}/day</span><br>
            Your daily budget: $${dailyBudget.toFixed(2)}/day<br>
            Projected month-end expense: <strong>$${projectedEnd.toFixed(2)}</strong><br><br>`;

        if (dailyBurn > dailyBudget) {
            msg += `⚠️ <span class="expense-color"><strong>OVERSPENDING!</strong></span> At this rate you'll spend $${(projectedEnd - income).toFixed(2)} more than your income.`;
        } else {
            msg += `✅ <span class="income-color"><strong>ON TRACK!</strong></span> You're projected to save $${(income - projectedEnd).toFixed(2)} this month. Keep it up!`;
        }
        addAIMessage(msg);
    } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────
// Financial advice
// ─────────────────────────────────────────────────────────────────
async function giveFinancialAdvice() {
    addAIMessage('⏳ Building your personalised financial report...');

    try {
        const res  = await fetch('api.php?action=get_transactions&limit=1000');
        const data = await res.json();

        // ── No data fallback ──────────────────────────────────────
        if (!data.success || data.data.length === 0) {
            addAIMessage(`
                <strong>Financial Tips to Get You Started</strong><br><br>
                No transactions yet — start tracking and I'll give you fully personalised advice!<br><br>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px;">
                    <div style="background:#f0f4ff;border-radius:10px;padding:12px;">
                        <strong>50/30/20 Rule</strong><br>
                        <span style="font-size:12px;color:#555;">50% Needs · 30% Wants · 20% Savings</span>
                    </div>
                    <div style="background:#f0faf4;border-radius:10px;padding:12px;">
                        <strong>Pay Yourself First</strong><br>
                        <span style="font-size:12px;color:#555;">Transfer savings on payday before spending</span>
                    </div>
                    <div style="background:#fffbeb;border-radius:10px;padding:12px;">
                        <strong>Track Every Ringgit</strong><br>
                        <span style="font-size:12px;color:#555;">RM5 teh tarik daily = RM150/month</span>
                    </div>
                    <div style="background:#fff5f5;border-radius:10px;padding:12px;">
                        <strong>Review Subscriptions</strong><br>
                        <span style="font-size:12px;color:#555;">Cancel unused Netflix, Spotify, gaming subs</span>
                    </div>
                </div>
            `);
            return;
        }

        // ── Date helpers ──────────────────────────────────────────
        const now         = new Date();
        const thisM       = now.getMonth();
        const thisY       = now.getFullYear();
        const lastM       = thisM === 0 ? 11 : thisM - 1;
        const lastY       = thisM === 0 ? thisY - 1 : thisY;
        const daysInMonth = new Date(thisY, thisM + 1, 0).getDate();
        const daysElapsed = Math.max(now.getDate(), 1);
        const daysLeft    = daysInMonth - daysElapsed;
        const monthName   = now.toLocaleString('en-MY', { month: 'long' });

        // ── Partition ─────────────────────────────────────────────
        const thisTx = data.data.filter(t => {
            const d = new Date(t.transaction_date);
            return d.getMonth() === thisM && d.getFullYear() === thisY;
        });
        const lastTx = data.data.filter(t => {
            const d = new Date(t.transaction_date);
            return d.getMonth() === lastM && d.getFullYear() === lastY;
        });

        // ── This month ────────────────────────────────────────────
        let income = 0, expense = 0;
        const cats = {};
        const dailyMap = {};
        let foodAmt = 0, transportAmt = 0, entertainAmt = 0;
        let shoppingAmt = 0, housingAmt = 0, financialAmt = 0;

        thisTx.forEach(t => {
            const amt = parseFloat(t.amount);
            if (t.type === 'income') { income += amt; return; }
            expense += amt;
            cats[t.category_name] = (cats[t.category_name] || 0) + amt;
            const dk = t.transaction_date.slice(0, 10);
            dailyMap[dk] = (dailyMap[dk] || 0) + amt;
            const cl = (t.category_name || '').toLowerCase();
            if (cl.includes('food'))          foodAmt       += amt;
            if (cl.includes('transport'))     transportAmt  += amt;
            if (cl.includes('entertainment')) entertainAmt  += amt;
            if (cl.includes('shopping'))      shoppingAmt   += amt;
            if (cl.includes('housing'))       housingAmt    += amt;
            if (cl.includes('financial'))     financialAmt  += amt;
        });

        // ── Last month ────────────────────────────────────────────
        let lastIncome = 0, lastExpense = 0;
        const lastCats = {};
        lastTx.forEach(t => {
            const amt = parseFloat(t.amount);
            if (t.type === 'income') { lastIncome += amt; return; }
            lastExpense += amt;
            lastCats[t.category_name] = (lastCats[t.category_name] || 0) + amt;
        });

        // ── Derived ───────────────────────────────────────────────
        const savings       = income - expense;
        const savingsRate   = income > 0 ? (savings / income) * 100 : 0;
        const dailyAvg      = expense / daysElapsed;
        const projected     = dailyAvg * daysInMonth;
        const projSavings   = income - projected;
        const needsToSavePerDay = projSavings < 0 && daysLeft > 0
            ? Math.abs(projSavings) / daysLeft : 0;

        const spendTrend    = lastExpense > 0
            ? ((expense - lastExpense) / lastExpense) * 100 : null;
        const incomeTrend   = lastIncome > 0
            ? ((income - lastIncome) / lastIncome) * 100 : null;

        const sortedCats    = Object.entries(cats).sort((a, b) => b[1] - a[1]);
        const topCat        = sortedCats[0];
        const txCount       = thisTx.filter(t => t.type === 'expense').length;
        const activeDays    = Object.keys(dailyMap).length;
        const avgPerTx      = txCount > 0 ? expense / txCount : 0;

        // ── Health grade ──────────────────────────────────────────
        let grade, gradeColor, gradeLabel;
        if      (savingsRate >= 30) { grade = 'A'; gradeColor = '#38a169'; gradeLabel = 'Excellent'; }
        else if (savingsRate >= 20) { grade = 'B'; gradeColor = '#68d391'; gradeLabel = 'Good';      }
        else if (savingsRate >= 10) { grade = 'C'; gradeColor = '#d69e2e'; gradeLabel = 'Fair';      }
        else if (savingsRate >=  0) { grade = 'D'; gradeColor = '#dd6b20'; gradeLabel = 'Weak';      }
        else                        { grade = 'F'; gradeColor = '#e53e3e'; gradeLabel = 'Deficit';   }

        // ── 50/30/20 Buckets ──────────────────────────────────────
        // Needs: housing, transport, food, financial obligations
        // Wants: entertainment, shopping
        // Savings: income - total expense
        const needsAmt   = housingAmt + transportAmt + foodAmt + financialAmt;
        const wantsAmt   = entertainAmt + shoppingAmt;
        const savingsAmt = Math.max(savings, 0);
        const needsPct   = income > 0 ? (needsAmt   / income) * 100 : 0;
        const wantsPct   = income > 0 ? (wantsAmt   / income) * 100 : 0;
        const savPct     = income > 0 ? (savingsAmt / income) * 100 : 0;

        const bucketStatus = (pct, target) => {
            if (pct <= target)      return { color: '#38a169', label: 'On track' };
            if (pct <= target * 1.2) return { color: '#d69e2e', label: 'Slightly over' };
            return { color: '#e53e3e', label: 'Over limit' };
        };
        const needsSt  = bucketStatus(needsPct,  50);
        const wantsSt  = bucketStatus(wantsPct,  30);
        const savingsSt = savPct >= 20
            ? { color: '#38a169', label: 'On track' }
            : { color: savPct >= 10 ? '#d69e2e' : '#e53e3e', label: savPct >= 10 ? 'Below target' : 'Too low' };

        // ── Trend arrow helper ─────────────────────────────────────
        const trendArrow = (pct, lowerIsBetter = true) => {
            if (pct === null) return '';
            const up    = pct > 0;
            const good  = lowerIsBetter ? !up : up;
            const color = good ? '#38a169' : '#e53e3e';
            const arrow = up ? '▲' : '▼';
            return `<span style="color:${color};font-size:11px;font-weight:700;">${arrow} ${Math.abs(pct).toFixed(1)}%</span>`;
        };

        // ── Personalised insights (max 4, most relevant first) ─────
        const insights = [];

        // Savings rate
        if (income === 0) {
            insights.push({ icon: '⚠️', color: '#e53e3e', title: 'No income recorded',
                body: `Add your salary or income so I can calculate your real savings rate and give accurate advice.` });
        } else if (savingsRate >= 30) {
            insights.push({ icon: '🏆', color: '#38a169', title: `Outstanding — you're saving ${savingsRate.toFixed(1)}%`,
                body: `You're keeping RM${savings.toFixed(2)} this month. Next step: put this surplus to work. Consider topping up your ASB, investing in a unit trust, or building a 6-month emergency fund.` });
        } else if (savingsRate >= 20) {
            insights.push({ icon: '✅', color: '#38a169', title: `Solid savings rate — ${savingsRate.toFixed(1)}%`,
                body: `You're hitting the 20% benchmark. To level up, automate a standing order transfer on payday so savings happen before spending.` });
        } else if (savingsRate >= 0) {
            const gap = (20 - savingsRate).toFixed(1);
            insights.push({ icon: '📈', color: '#d69e2e', title: `Savings at ${savingsRate.toFixed(1)}% — target is 20%`,
                body: `You're RM${((income * 0.20) - savings).toFixed(2)}/month short of the 20% goal. Cutting just one category by ${gap}% of income bridges the gap entirely.` });
        } else {
            insights.push({ icon: '🚨', color: '#e53e3e', title: 'Spending exceeds income',
                body: `You're over budget by RM${Math.abs(savings).toFixed(2)} this month. Identify your top 2 categories and set hard daily limits until you're back in surplus.` });
        }

        // Month-over-month trend
        if (spendTrend !== null && Math.abs(spendTrend) >= 5) {
            if (spendTrend > 0) {
                insights.push({ icon: '📊', color: '#dd6b20', title: `Spending up ${spendTrend.toFixed(1)}% vs last month`,
                    body: `You spent RM${expense.toFixed(2)} this month vs RM${lastExpense.toFixed(2)} last month — an increase of RM${(expense - lastExpense).toFixed(2)}. Compare your category breakdown to find what changed.` });
            } else {
                insights.push({ icon: '📉', color: '#38a169', title: `Great — spending down ${Math.abs(spendTrend).toFixed(1)}% vs last month`,
                    body: `You reduced spending by RM${(lastExpense - expense).toFixed(2)} compared to last month. This saved you real money — keep the momentum.` });
            }
        }

        // Top category deep-dive
        if (topCat && income > 0) {
            const topPct = ((topCat[1] / income) * 100).toFixed(1);
            const cl     = topCat[0].toLowerCase();
            let catAdvice = '';
            if      (cl.includes('food') && topCat[1]/income > 0.25)
                catAdvice = `At ${topPct}% of income, food is high. Meal prepping on Sunday and bringing lunch to work 3×/week can save RM150–250/month alone.`;
            else if (cl.includes('food'))
                catAdvice = `Food at ${topPct}% is your biggest category. Hawker stalls and home cooking keep this manageable — keep favouring them over delivery apps.`;
            else if (cl.includes('shopping') && topCat[1]/income > 0.15)
                catAdvice = `Shopping at ${topPct}% of income is high. Try a 48-hour rule: wait 2 days before any non-essential purchase to filter impulse buys.`;
            else if (cl.includes('entertainment') && topCat[1]/income > 0.10)
                catAdvice = `Entertainment at ${topPct}% is above the 10% guideline. List every active subscription and cancel those you haven't used this month.`;
            else if (cl.includes('housing'))
                catAdvice = `Housing at ${topPct}% of income — the rule of thumb is under 35%. ${parseFloat(topPct) <= 35 ? "You're within the healthy range." : "Consider whether refinancing or moving to a cheaper area is an option."}`;
            else if (cl.includes('transport') && topCat[1]/income > 0.15)
                catAdvice = `Transport at ${topPct}% is above 15%. The MY50 unlimited transit pass (RM50/month) can dramatically cut e-hailing and fuel costs.`;
            else
                catAdvice = `Your biggest category at ${topPct}% of income. Review individual transactions here — usually 1–2 large items drive most of it.`;

            insights.push({ icon: '🔍', color: '#667eea', title: `Biggest spend: ${topCat[0]} — RM${topCat[1].toFixed(2)}`,
                body: catAdvice });
        }

        // Month-end projection
        if (income > 0 && daysLeft > 0) {
            if (projSavings < 0) {
                insights.push({ icon: '⏰', color: '#e53e3e', title: `Projection: RM${Math.abs(projSavings).toFixed(2)} deficit by month-end`,
                    body: `At RM${dailyAvg.toFixed(2)}/day you'll overspend your income by month-end. You need to cut to RM${(dailyAvg - needsToSavePerDay).toFixed(2)}/day for the next ${daysLeft} days to break even.` });
            } else if (projSavings < income * 0.1) {
                insights.push({ icon: '⏰', color: '#d69e2e', title: `Projection: only RM${projSavings.toFixed(2)} saved by month-end`,
                    body: `You're on track to save just ${((projSavings/income)*100).toFixed(1)}% by month-end. Reducing daily spend by RM${((income * 0.2 - savings) / daysLeft).toFixed(2)}/day would get you to the 20% target.` });
            } else {
                insights.push({ icon: '✅', color: '#38a169', title: `Projection: RM${projSavings.toFixed(2)} saved by month-end`,
                    body: `At your current RM${dailyAvg.toFixed(2)}/day pace you'll end the month with a ${((projSavings/income)*100).toFixed(1)}% savings rate. ${daysLeft} days to go — stay consistent.` });
            }
        }

        // ── Quick win actions ─────────────────────────────────────
        const actions = [];
        if (foodAmt / income > 0.20)            actions.push('Pack lunch 3×/week → saves ~RM45/week');
        if (entertainAmt > 50)                   actions.push('Audit subscriptions → cancel 1–2 unused ones (saves RM30–80/month)');
        if (transportAmt > 200)                  actions.push('Try MY50 transit pass or carpooling → cuts transport ~30%');
        if (shoppingAmt / income > 0.15)         actions.push('Set a monthly shopping budget cap and track it here');
        if (savingsRate < 20 && income > 0)      actions.push('Automate 10% salary transfer to savings on payday');
        if (avgPerTx > 100)                      actions.push(`Average RM${avgPerTx.toFixed(0)}/transaction — check for large one-off purchases to defer`);
        if (activeDays < 10 && txCount < 15)     actions.push('You have fewer entries — log all transactions daily for a more accurate picture');
        if (actions.length === 0)                actions.push('Keep going — consistency is your biggest financial advantage right now');

        // ── Render ────────────────────────────────────────────────
        let msg = `
        <strong>Personalised Financial Advice — ${monthName} ${thisY}</strong><br><br>

        <!-- Header scorecard -->
        <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap;">
            <div style="flex:1;min-width:120px;background:#f8f9fc;border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;">
                <div style="width:44px;height:44px;border-radius:50%;background:${gradeColor};display:flex;align-items:center;
                            justify-content:center;font-size:20px;font-weight:800;color:white;flex-shrink:0;">${grade}</div>
                <div>
                    <div style="font-size:11px;color:#999;font-weight:600;text-transform:uppercase;">Health</div>
                    <div style="font-weight:700;color:${gradeColor};">${gradeLabel}</div>
                </div>
            </div>
            <div style="flex:1;min-width:120px;background:#f8f9fc;border-radius:10px;padding:12px;">
                <div style="font-size:11px;color:#999;font-weight:600;text-transform:uppercase;">Income</div>
                <div style="font-weight:700;color:#38a169;font-size:15px;">RM${income.toFixed(2)}</div>
                <div style="font-size:11px;margin-top:2px;">${trendArrow(incomeTrend, false)} vs last month</div>
            </div>
            <div style="flex:1;min-width:120px;background:#f8f9fc;border-radius:10px;padding:12px;">
                <div style="font-size:11px;color:#999;font-weight:600;text-transform:uppercase;">Spent</div>
                <div style="font-weight:700;color:#e53e3e;font-size:15px;">RM${expense.toFixed(2)}</div>
                <div style="font-size:11px;margin-top:2px;">${trendArrow(spendTrend, true)} vs last month</div>
            </div>
            <div style="flex:1;min-width:120px;background:#f8f9fc;border-radius:10px;padding:12px;">
                <div style="font-size:11px;color:#999;font-weight:600;text-transform:uppercase;">Saved</div>
                <div style="font-weight:700;color:${savings >= 0 ? '#38a169' : '#e53e3e'};font-size:15px;">RM${Math.abs(savings).toFixed(2)}</div>
                <div style="font-size:11px;margin-top:2px;color:#999;">${savingsRate.toFixed(1)}% rate</div>
            </div>
        </div>

        <!-- 50/30/20 Rule Check -->
        <div style="background:#f8f9fc;border-radius:10px;padding:12px 14px;margin-bottom:14px;">
            <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.4px;">50/30/20 Rule Check</div>
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;text-align:center;">
                <div style="background:${needsSt.color}18;border-radius:8px;padding:8px 4px;">
                    <div style="font-size:18px;font-weight:800;color:${needsSt.color};">${needsPct.toFixed(0)}%</div>
                    <div style="font-size:11px;color:#555;font-weight:600;">Needs</div>
                    <div style="font-size:10px;color:${needsSt.color};">${needsSt.label} (≤50%)</div>
                </div>
                <div style="background:${wantsSt.color}18;border-radius:8px;padding:8px 4px;">
                    <div style="font-size:18px;font-weight:800;color:${wantsSt.color};">${wantsPct.toFixed(0)}%</div>
                    <div style="font-size:11px;color:#555;font-weight:600;">Wants</div>
                    <div style="font-size:10px;color:${wantsSt.color};">${wantsSt.label} (≤30%)</div>
                </div>
                <div style="background:${savingsSt.color}18;border-radius:8px;padding:8px 4px;">
                    <div style="font-size:18px;font-weight:800;color:${savingsSt.color};">${savPct.toFixed(0)}%</div>
                    <div style="font-size:11px;color:#555;font-weight:600;">Savings</div>
                    <div style="font-size:10px;color:${savingsSt.color};">${savingsSt.label} (≥20%)</div>
                </div>
            </div>
        </div>

        <!-- Personalised insights -->
        <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.4px;">Key Insights</div>`;

        insights.slice(0, 4).forEach(ins => {
            msg += `
            <div style="border-left:3px solid ${ins.color};border-radius:0 8px 8px 0;background:${ins.color}0d;
                        padding:10px 14px;margin-bottom:8px;font-size:13px;line-height:1.6;">
                <strong style="color:${ins.color === '#38a169' ? '#276749' : ins.color === '#667eea' ? '#4a5568' : ins.color};">${ins.title}</strong><br>
                <span style="color:#444;">${ins.body}</span>
            </div>`;
        });

        // Quick wins
        msg += `
        <div style="background:#f0f4ff;border-radius:10px;padding:12px 14px;margin-top:6px;">
            <div style="font-size:12px;font-weight:700;color:#667eea;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.4px;">Quick Wins This Month</div>`;
        actions.slice(0, 4).forEach(a => {
            msg += `<div style="font-size:13px;color:#333;padding:3px 0;display:flex;gap:6px;align-items:flex-start;">
                        <span style="color:#667eea;font-weight:700;flex-shrink:0;">→</span><span>${a}</span></div>`;
        });
        msg += `</div>`;

        addAIMessage(msg);

    } catch (e) {
        addAIMessage(`
            <strong>Financial Tips for You</strong><br><br>
            <strong>1. The 50/30/20 Rule</strong><br>
            50% Needs · 30% Wants · 20% Savings<br><br>
            <strong>2. Pay Yourself First</strong><br>
            Transfer savings on payday before spending anything.<br><br>
            <strong>3. Track Every Ringgit</strong><br>
            Small expenses like RM5 teh tarik add up — log them all.<br><br>
            <strong>4. Meal Prep Saves Money</strong><br>
            Home cooking vs eating out can save RM300–500/month.<br><br>
            <strong>5. Review Subscriptions</strong><br>
            Cancel unused Netflix, Spotify, or gaming subs.
        `);
    }
}

// ─────────────────────────────────────────────────────────────────
async function analyzeCategorySpending(keyword) {
    try {
        const res  = await fetch('api.php?action=get_transactions&limit=1000');
        const data = await res.json();
        if (!data.success) return;

        const now = new Date();
        const matching = data.data.filter(t =>
            t.type === 'expense' &&
            new Date(t.transaction_date).getMonth() === now.getMonth() &&
            (t.category_name.toLowerCase().includes(keyword) ||
             t.description.toLowerCase().includes(keyword))
        );
        const total = matching.reduce((s, t) => s + parseFloat(t.amount), 0);

        if (matching.length === 0) {
            addAIMessage(`No ${keyword} expenses found this month.`);
        } else {
            addAIMessage(`You've spent <span class="expense-color"><strong>$${total.toFixed(2)}</strong></span> on ${keyword} this month across ${matching.length} transactions.`);
        }
    } catch (e) {}
}

// ─────────────────────────────────────────────────────────────────
// Meal suggestions — deeply personalized based on user behaviour
// ─────────────────────────────────────────────────────────────────
function escapeHtml(text) {
    const d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

function getCurrentTime() {
    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function scrollToBottom() {
    if (chatMessages) chatMessages.scrollTop = chatMessages.scrollHeight;
}

function testDatabaseConnection() {
    fetch('api.php?action=get_transactions&limit=1')
        .then(r => r.json())
        .then(d => { if (!d.success) console.error('DB connection failed'); })
        .catch(e => console.error('DB test error:', e));
}

// ─────────────────────────────────────────────────────────────────
// Voice Recognition (Web Speech API)
// ─────────────────────────────────────────────────────────────────
function setupVoiceRecognition() {
    // Check if the browser supports Speech Recognition (Chrome, Edge, Safari)
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        if (voiceBtn) voiceBtn.style.display = 'none'; // Hide if not supported
        console.warn('Speech recognition is not supported in this browser.');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = false; // Stop listening automatically when the user pauses
    recognition.interimResults = true; // Show words as they are being spoken
    recognition.lang = 'en-MY'; // Optimized for Malaysian English pronunciation

    // When the microphone starts listening
    recognition.onstart = function() {
        voiceBtn.classList.add('listening');
        chatInput.placeholder = 'Listening... Speak now';
    };

    // When speech is detected and translated into text
    recognition.onresult = function(event) {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        // Update the input box with what the user is saying
        chatInput.value = finalTranscript || interimTranscript;
    };

    // When the microphone stops listening
    recognition.onend = function() {
        voiceBtn.classList.remove('listening');
        chatInput.placeholder = "Type anything... (e.g., 'grab 50' or 'lunch at KFC 25')";
        
        // Auto-send the message if text was captured
        if (chatInput.value.trim().length > 0) {
            sendMessage(); 
        }
    };

    // Handle errors (e.g., microphone permission denied)
    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        voiceBtn.classList.remove('listening');
        chatInput.placeholder = "Type anything... (e.g., 'grab 50' or 'lunch at KFC 25')";
        
        if (event.error === 'not-allowed') {
            alert("Please allow microphone permissions to use voice tracking.");
        }
    };

    // Toggle listening when the mic button is clicked
    if (voiceBtn) {
        voiceBtn.addEventListener('click', () => {
            if (voiceBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                chatInput.value = ''; // Clear previous text
                recognition.start();
            }
        });
    }
}


// ─────────────────────────────────────────────────────────────────
// IMPROVED MEAL SUGGESTION SYSTEM
// Drop-in replacement for suggestDailyMeals() in ai-chat.js
//
// HOW TO USE:
// 1. Replace the entire suggestDailyMeals() function at the bottom
//    of ai-chat.js with this code.
// 2. Also replace the mealCard() helper function.
// ─────────────────────────────────────────────────────────────────


// ─── MEAL POOLS ──────────────────────────────────────────────────
// Each pool has multiple options so every call gives fresh picks.
// Cost ranges are in RM for Malaysian context.

const MEAL_POOLS = {

    breakfast: {
        budget: [
            { name: 'Roti canai + teh tarik',       cost: 'RM5–7',   where: 'Mamak',         note: 'Classic — best value hot breakfast in Malaysia' },
            { name: 'Nasi lemak bungkus',            cost: 'RM2–5',   where: 'Roadside stall', note: 'Pack it from a stall — cheapest filling breakfast' },
            { name: 'Bread + kaya + Milo',           cost: 'RM2–4',   where: 'Home',           note: 'Gardenia + kaya at home = under RM3 total' },
            { name: 'Overnight oats + banana',       cost: 'RM2–4',   where: 'Home',           note: 'Prep the night before; no morning cooking needed' },
            { name: 'Thosai + coconut chutney',      cost: 'RM3–5',   where: 'Mamak',          note: 'High-protein, low-fat Indian breakfast' },
            { name: 'Roti bakar + half-boiled eggs', cost: 'RM4–6',   where: 'Kopitiam',       note: 'Kopitiam classic — filling and cheap' },
            { name: 'Quaker oats + Milo',            cost: 'RM2–3',   where: 'Home',           note: '5-minute meal; keeps you full till lunch' },
            { name: 'Kuih from pasar pagi',          cost: 'RM3–5',   where: 'Morning market', note: 'Onde-onde, kuih ketayap, lompat tikam — variety daily' },
        ],
        moderate: [
            { name: 'Dim sum set (3 items)',         cost: 'RM12–18', where: 'Chinese restaurant', note: 'Weekend treat — go early for the best selection' },
            { name: 'Nasi lemak special + teh ais',  cost: 'RM9–13',  where: 'Café',           note: 'Egg + sambal + sides — proper start to the day' },
            { name: 'Avocado toast + coffee',        cost: 'RM14–18', where: 'Café',           note: 'Limit to 1–2×/week; save RM8 by making at home' },
            { name: 'Bubur ayam + kopitiam kopi',    cost: 'RM8–12',  where: 'Kopitiam',       note: 'Warm, easy on the stomach, great after late nights' },
            { name: 'Char kuey teow + iced Milo',   cost: 'RM10–15', where: 'Hawker',         note: 'Heavy — works well as a brunch on active days' },
        ],
        premium: [
            { name: 'Big brekkie at café',           cost: 'RM22–35', where: 'Café',           note: 'Save for Sundays only — too pricey daily' },
            { name: 'Hotel buffet breakfast',        cost: 'RM40–80', where: 'Hotel',          note: 'Occasional splurge — go early, eat EVERYTHING' },
        ],
    },

    lunch: {
        budget: [
            { name: 'Economy rice (chap fan) — 1 protein + 2 veg', cost: 'RM9–13',  where: 'Hawker / food court', note: 'Best value lunch in Malaysia, hands down' },
            { name: 'Nasi ayam + soup',              cost: 'RM9–12',  where: 'Hawker',         note: 'Chicken rice stall beats any fast food combo' },
            { name: 'Packed leftovers from dinner',  cost: 'RM0',     where: 'Home',           note: 'Zero cost — batch cook dinner for 2 portions' },
            { name: 'Wan tan mee / wonton noodle',   cost: 'RM8–12',  where: 'Hawker',         note: 'Light, fast, filling — great midweek option' },
            { name: 'Pan mee (hand-torn noodle)',     cost: 'RM8–12',  where: 'Hawker',         note: 'One of the most filling RM10 meals around' },
            { name: 'Nasi kandar tapau',             cost: 'RM9–14',  where: 'Mamak (tapau)',  note: 'Tapau (take-away) saves RM2–3 vs eating in' },
            { name: 'Bihun sup / clear soup noodle', cost: 'RM7–10',  where: 'Hawker',         note: 'Light option; good when you want to keep calories low' },
            { name: 'Curry mee',                     cost: 'RM8–12',  where: 'Hawker',         note: 'Rich and filling — skip the side dishes to save' },
        ],
        moderate: [
            { name: 'Chicken rice set at kopitiam',  cost: 'RM13–17', where: 'Kopitiam',       note: 'Step up from hawker; still cheaper than fast food' },
            { name: 'Banana leaf rice (lunch only)', cost: 'RM14–18', where: 'Indian restaurant', note: 'Unlimited rice refill + 4 veg dishes = great deal' },
            { name: 'Laksa + coconut water',         cost: 'RM12–16', where: 'Hawker / café',  note: 'Satisfying; choose Penang assam laksa for lighter option' },
            { name: 'Bak kut teh set',               cost: 'RM15–22', where: 'Restaurant',     note: 'Pork ribs soup — best on cool days; skip rice to save' },
            { name: 'Yong tau foo (custom bowl)',     cost: 'RM10–15', where: 'Hawker',         note: 'Pick your 6–8 items; healthy and customisable' },
        ],
        premium: [
            { name: 'Japanese set lunch',            cost: 'RM28–45', where: 'Japanese restaurant', note: 'Set lunch is 30–40% cheaper than dinner here' },
            { name: 'Western pasta / grilled set',   cost: 'RM25–40', where: 'Café',           note: 'Limit to 1×/week; swap other lunches to budget meals' },
        ],
    },

    dinner: {
        budget: [
            { name: 'Home stir-fry: ayam kicap + kangkung + rice', cost: 'RM8–12', where: 'Home', note: 'Batch cook for 2 nights — huge savings over eating out' },
            { name: 'Dal + roti canai (mamak dinner)',cost: 'RM8–12',  where: 'Mamak',          note: 'Vegetarian option; easy on the wallet and stomach' },
            { name: 'Mixed rice at hawker centre',   cost: 'RM10–14', where: 'Hawker',         note: 'Choose 1 protein + 2 veg to keep under RM13' },
            { name: 'Sup ekor / oxtail soup',        cost: 'RM12–16', where: 'Malay stall',    note: 'Hearty; pairs well with plain rice from home' },
            { name: 'Maggi goreng + telur mata',     cost: 'RM6–9',   where: 'Mamak',          note: 'Emergency dinner — fast, cheap, satisfying' },
            { name: 'Home fried rice (nasi goreng)', cost: 'RM4–8',   where: 'Home',           note: 'Use yesterday\'s leftover rice + 2 eggs + kicap' },
            { name: 'Mee goreng mamak',              cost: 'RM8–11',  where: 'Mamak',          note: 'One-dish dinner with protein — skip the extras' },
            { name: 'Claypot tofu + rice',           cost: 'RM10–14', where: 'Chinese hawker', note: 'Soft tofu in soy sauce — nutritious, cheap, filling' },
        ],
        moderate: [
            { name: 'Ikan bakar + ulam + rice',      cost: 'RM18–25', where: 'Malay restaurant', note: 'Shared meal for 2; order 1 fish + 2 veg sides' },
            { name: 'Korean BBQ (shared)',            cost: 'RM25–35', where: 'Korean restaurant', note: 'Split with a friend to halve the cost' },
            { name: 'Satay set (10 sticks) + ketupat', cost: 'RM18–25', where: 'Satay stall',  note: 'Malaysian classic; limit peanut sauce to save calories' },
            { name: 'Chicken chop western set',      cost: 'RM18–28', where: 'Western café',   note: 'Good value western; avoid pricey drinks on the side' },
            { name: 'Tom yam seafood + rice (shared)', cost: 'RM20–30', where: 'Thai restaurant', note: 'Order 1 big soup + 1 veg + 1 protein for 2 people' },
        ],
        premium: [
            { name: 'Steamboat / hot pot (buffet)',  cost: 'RM35–60', where: 'Steamboat restaurant', note: 'Reserve for special occasions — 1×/month max' },
            { name: 'Fine dining restaurant',        cost: 'RM80+',   where: 'Fine dining',    note: 'Treat yourself quarterly — plan ahead for deals' },
        ],
    },

    snack: [
        { name: 'Fruits from pasar (season)',        cost: 'RM3–6',   note: 'Watermelon, papaya, banana — buy in bulk' },
        { name: 'Pisang goreng / goreng pisang',     cost: 'RM2–4',   note: 'Freshly fried = best Malaysian snack ever' },
        { name: 'Keropok lekor (fish cracker)',      cost: 'RM2–4',   note: 'Get it near the sea for freshest quality' },
        { name: 'Roti peanut butter (home)',         cost: 'RM1–2',   note: 'Cheapest energy boost; add banana for fullness' },
        { name: 'Boiled egg (home)',                 cost: 'RM0.80–1.20', note: 'Highest protein per ringgit snack available' },
        { name: 'Kacang putih (roasted chickpeas)',  cost: 'RM2–3',   note: 'Indian snack stalls — protein-packed and cheap' },
        { name: 'Nut mix (bulk from pasar)',         cost: 'RM4–7',   note: 'Buy mixed nuts in bulk; portion into bags' },
        { name: '7-Eleven onigiri',                  cost: 'RM3–5',   note: 'Quick, clean protein hit — better than chips' },
    ],

    // Weekly themed plans for variety
    weeklyThemes: [
        {
            theme: '💚 Clean & Light Week',
            description: 'Low-oil, high-veg meals to reset your body',
            color: '#2D6A4F',
            days: [
                { day: 'Mon', bf: 'Oats + banana', lunch: 'Economy rice (veg-heavy)', dinner: 'Claypot tofu + rice' },
                { day: 'Tue', bf: 'Thosai + coconut chutney', lunch: 'Yong tau foo', dinner: 'Home stir-fry kangkung + steamed fish' },
                { day: 'Wed', bf: 'Overnight oats', lunch: 'Wan tan mee (dry, less oil)', dinner: 'Sup sayur + rice (home)' },
                { day: 'Thu', bf: 'Roti bakar + eggs', lunch: 'Bihun sup', dinner: 'Dal + roti canai' },
                { day: 'Fri', bf: 'Fruits + bread', lunch: 'Banana leaf rice', dinner: 'Ikan kukus + veg (home)' },
            ]
        },
        {
            theme: '🏠 Home Cook Week',
            description: 'Cook most meals at home to maximise savings',
            color: '#1e3a5f',
            color: '#3A86FF',
            days: [
                { day: 'Mon', bf: 'Nasi goreng (leftover rice)', lunch: 'Packed lunch from home', dinner: 'Ayam masak merah + rice' },
                { day: 'Tue', bf: 'Bread + kaya + Milo', lunch: 'Packed leftovers', dinner: 'Stir-fry beef + broccoli' },
                { day: 'Wed', bf: 'Quaker oats + Milo', lunch: 'Packed lunch', dinner: 'Sup ekor + rice' },
                { day: 'Thu', bf: 'Roti peanut butter + egg', lunch: 'Hawker (budget day out)', dinner: 'Home pasta with sardine' },
                { day: 'Fri', bf: 'Overnight oats', lunch: 'Packed lunch', dinner: 'Ikan bakar + rice (home grill)' },
            ]
        },
        {
            theme: '🌶️ Malaysian Hawker Week',
            description: 'Tour the best hawker stalls near you',
            color: '#E63946',
            days: [
                { day: 'Mon', bf: 'Nasi lemak bungkus', lunch: 'Char kuey teow', dinner: 'Satay + ketupat' },
                { day: 'Tue', bf: 'Roti canai + teh tarik', lunch: 'Nasi ayam + soup', dinner: 'Laksa (assam or lemak)' },
                { day: 'Wed', bf: 'Bubur ayam', lunch: 'Bak kut teh', dinner: 'Mee goreng mamak' },
                { day: 'Thu', bf: 'Kuih from pasar pagi', lunch: 'Pan mee', dinner: 'Mixed rice (hawker)' },
                { day: 'Fri', bf: 'Dim sum (2–3 items)', lunch: 'Curry mee', dinner: 'Ikan bakar + ulam (Friday treat)' },
            ]
        },
        {
            theme: '⚡ Quick & Easy Week',
            description: 'Fastest prep times — for busy people',
            color: '#FF6B35',
            days: [
                { day: 'Mon', bf: 'Bread + kaya (3 min)', lunch: 'Economy rice tapau (5 min)', dinner: 'Maggi goreng mamak (10 min)' },
                { day: 'Tue', bf: 'Instant oats (2 min)', lunch: 'Wan tan mee tapau', dinner: 'Home fried rice (15 min)' },
                { day: 'Wed', bf: 'Nasi lemak bungkus (grab & go)', lunch: 'Pan mee tapau', dinner: 'Dal + roti (mamak dine-in, 20 min)' },
                { day: 'Thu', bf: 'Overnight oats (0 min morning)', lunch: 'Packed lunch (last night prep)', dinner: 'Claypot tofu + rice (20 min)' },
                { day: 'Fri', bf: '7-Eleven onigiri + Milo', lunch: 'Economy rice', dinner: 'Tom yam instant cup + egg' },
            ]
        },
        {
            theme: '🥗 Budget Warrior Week',
            description: 'Stay under RM30/day total on food',
            color: '#06D6A0',
            days: [
                { day: 'Mon', bf: 'Oats at home (RM2)', lunch: 'Economy rice (RM10)', dinner: 'Home stir-fry (RM7)' },
                { day: 'Tue', bf: 'Bread + egg (RM3)', lunch: 'Bihun sup (RM8)', dinner: 'Home fried rice (RM5)' },
                { day: 'Wed', bf: 'Nasi lemak bungkus (RM4)', lunch: 'Wan tan mee (RM9)', dinner: 'Dal + roti (RM10)' },
                { day: 'Thu', bf: 'Kuih (RM3)', lunch: 'Nasi ayam (RM10)', dinner: 'Home pasta (RM8)' },
                { day: 'Fri', bf: 'Oats (RM2)', lunch: 'Packed lunch (RM0)', dinner: 'Mamak mee goreng (RM9)' },
            ]
        },
    ]
};

// ─── HELPER: Pick N random items from array ───────────────────────
function pickRandom(arr, n = 1) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5);
    return n === 1 ? shuffled[0] : shuffled.slice(0, n);
}

// ─── HELPER: Select tier based on spending ───────────────────────
function getTier(foodPerDay) {
    if (foodPerDay > 55)  return 'premium';
    if (foodPerDay >= 25) return 'moderate';
    return 'budget';
}

// ─── HELPER: Meal card HTML ───────────────────────────────────────
function mealCard(meal, cost, color, opt1, opt2, note) {
    return `<div style="background:white;border:1px solid #e0e6ed;border-radius:10px;
                         overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="background:${color};padding:8px 14px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:700;color:white;font-size:13px;">${meal}</span>
            <span style="background:rgba(255,255,255,0.25);color:white;font-size:11px;
                         font-weight:600;padding:2px 10px;border-radius:10px;">${cost}</span>
        </div>
        <div style="padding:11px 14px;font-size:13px;line-height:1.6;">
            <div style="margin-bottom:3px;">Option 1: <strong>${opt1}</strong></div>
            <div style="margin-bottom:8px;color:#555;">Option 2: ${opt2}</div>
            <div style="font-size:12px;color:${color};font-weight:600;background:${color}12;
                        padding:4px 10px;border-radius:6px;display:inline-block;">${note}</div>
        </div>
    </div>`;
}

// ─── HELPER: Detailed meal card (for random daily picks) ─────────
function detailedMealCard(mealName, mealObj, color, icon) {
    const where = mealObj.where ? `<span style="background:${color}15;color:${color};font-size:11px;font-weight:600;padding:2px 8px;border-radius:8px;margin-left:6px;">${mealObj.where}</span>` : '';
    return `<div style="background:white;border:1px solid #e0e6ed;border-radius:10px;
                         overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.05);">
        <div style="background:${color};padding:9px 14px;display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:700;color:white;font-size:13px;">${icon} ${mealName}</span>
            <span style="background:rgba(255,255,255,0.25);color:white;font-size:11px;
                         font-weight:600;padding:2px 10px;border-radius:10px;">${mealObj.cost}</span>
        </div>
        <div style="padding:11px 14px;font-size:13px;line-height:1.6;">
            <div style="margin-bottom:5px;font-weight:600;color:#222;">${mealObj.name} ${where}</div>
            <div style="font-size:12px;color:${color};font-weight:600;background:${color}12;
                        padding:4px 10px;border-radius:6px;display:inline-block;">${mealObj.note}</div>
        </div>
    </div>`;
}

// ─── WEEKLY PLAN TABLE ─────────────────────────────────────────────
function buildWeeklyPlanTable(plan) {
    const rows = plan.days.map(d => `
        <tr style="border-bottom:1px solid #f0f0f0;">
            <td style="padding:10px 12px;font-weight:700;color:${plan.color};font-size:13px;white-space:nowrap;">${d.day}</td>
            <td style="padding:10px 12px;font-size:12px;color:#333;">${d.bf}</td>
            <td style="padding:10px 12px;font-size:12px;color:#333;">${d.lunch}</td>
            <td style="padding:10px 12px;font-size:12px;color:#333;">${d.dinner}</td>
        </tr>
    `).join('');

    return `<div style="overflow-x:auto;margin-bottom:14px;">
        <table style="width:100%;border-collapse:collapse;font-family:'Poppins',sans-serif;">
            <thead>
                <tr style="background:${plan.color}12;border-bottom:2px solid ${plan.color}30;">
                    <th style="padding:10px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Day</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Breakfast</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Lunch</th>
                    <th style="padding:10px 12px;text-align:left;font-size:11px;color:#666;text-transform:uppercase;letter-spacing:0.5px;">Dinner</th>
                </tr>
            </thead>
            <tbody>${rows}</tbody>
        </table>
    </div>`;
}


// ─────────────────────────────────────────────────────────────────
// MAIN FUNCTION — replaces suggestDailyMeals()
// ─────────────────────────────────────────────────────────────────
async function suggestDailyMeals() {
    addAIMessage('⏳ Generating your personalised meal plan...');

    try {
        const res  = await fetch('api.php?action=get_transactions&limit=1000');
        const data = await res.json();

        const now         = new Date();
        const thisM       = now.getMonth();
        const thisY       = now.getFullYear();
        const daysElapsed = Math.max(now.getDate(), 1);
        const monthName   = now.toLocaleString('en-MY', { month: 'long' });

        // ── Day rotation: use day-of-month so suggestion changes daily ──
        const dayOfMonth  = now.getDate();
        const themeIndex  = dayOfMonth % MEAL_POOLS.weeklyThemes.length;
        const weeklyTheme = MEAL_POOLS.weeklyThemes[themeIndex];

        // ── Spend analysis (same as before) ─────────────────────────
        const FOOD_KW = ['kfc','mcd','mcdonalds','grab food','foodpanda','mamak','kopitiam',
                          'food court','hawker','nasi','roti','starbucks','zus','tealive',
                          'chatime','boba','bubble tea','makan','lunch','dinner','breakfast',
                          'supper','tapau','bungkus','restaurant','restoran','jollibee',
                          'marrybrown','pizza','burger','chicken','rice','noodle','laksa',
                          'coffee','tea','cafe','bak kut teh','dim sum','satay','cendol',
                          'char kuey teow','wantan mee','pan mee'];

        let totalIncome = 0;
        const foodTx = [];

        if (data.success) {
            data.data.forEach(t => {
                if (t.type === 'income') { totalIncome += parseFloat(t.amount); return; }
                const d   = (t.description || '').toLowerCase();
                const cat = (t.category_name || '').toLowerCase();
                const td  = new Date(t.transaction_date);
                if (td.getMonth() !== thisM || td.getFullYear() !== thisY) return;
                if (cat.includes('food') || cat.includes('drink') || FOOD_KW.some(k => d.includes(k))) {
                    foodTx.push({ ...t, amt: parseFloat(t.amount) });
                }
            });
        }

        const foodTotal  = foodTx.reduce((s, t) => s + t.amt, 0);
        const foodPerDay = foodTotal / daysElapsed;
        const tier       = getTier(foodPerDay);

        // ── Random daily picks (changes each time "suggest daily meals" is sent) ──
        const todayBf    = pickRandom(MEAL_POOLS.breakfast[tier] || MEAL_POOLS.breakfast.budget);
        const todayLunch = pickRandom(MEAL_POOLS.lunch[tier]     || MEAL_POOLS.lunch.budget);
        const todayDin   = pickRandom(MEAL_POOLS.dinner[tier]    || MEAL_POOLS.dinner.budget);
        const todaySnack = pickRandom(MEAL_POOLS.snack);

        // Also pick 2 alternates for "if you want variety"
        const altBf    = pickRandom(MEAL_POOLS.breakfast[tier] || MEAL_POOLS.breakfast.budget);
        const altLunch = pickRandom(MEAL_POOLS.lunch[tier]     || MEAL_POOLS.lunch.budget);
        const altDin   = pickRandom(MEAL_POOLS.dinner[tier]    || MEAL_POOLS.dinner.budget);

        // ── Profile ─────────────────────────────────────────────────
        let profileColor, profileLabel;
        if (foodPerDay > 55) {
            profileColor = '#E63946'; profileLabel = 'Heavy Eater-Out';
        } else if (foodPerDay >= 25) {
            profileColor = '#FF6B35'; profileLabel = 'Moderate Spender';
        } else if (foodTx.length > 0) {
            profileColor = '#2D6A4F'; profileLabel = 'Budget-Smart Eater';
        } else {
            profileColor = '#3A86FF'; profileLabel = 'New User';
        }

        // ── Estimated daily food cost ────────────────────────────────
        const estCost = [todayBf, todayLunch, todayDin]
            .map(m => {
                const match = m.cost.match(/RM(\d+)/);
                return match ? parseInt(match[1]) : 10;
            })
            .reduce((a, b) => a + b, 0);

        // ── BUILD MESSAGE ────────────────────────────────────────────
        let msg = `
        <strong>🍽️ Today's Meal Plan — ${monthName}</strong><br><br>

        <!-- Profile + refresh hint -->
        <div style="display:flex;gap:10px;margin-bottom:12px;align-items:stretch;flex-wrap:wrap;">
            <div style="flex:2;min-width:160px;background:#f8f9fc;border-radius:10px;padding:12px 14px;">
                <div style="font-size:11px;color:#999;font-weight:600;text-transform:uppercase;margin-bottom:4px;">Your Food Profile</div>
                <div style="font-size:15px;font-weight:700;color:${profileColor};">${profileLabel}</div>
                ${foodTx.length > 0
                    ? `<div style="font-size:12px;color:#666;margin-top:2px;">RM${foodPerDay.toFixed(0)}/day avg this month</div>`
                    : `<div style="font-size:12px;color:#666;margin-top:2px;">No food data yet — using general plan</div>`}
            </div>
            <div style="flex:1;min-width:120px;background:#667eea12;border:1px solid #667eea30;border-radius:10px;padding:12px 14px;text-align:center;">
                <div style="font-size:11px;color:#667eea;font-weight:600;margin-bottom:4px;">TODAY'S EST. COST</div>
                <div style="font-size:20px;font-weight:800;color:#667eea;">RM${estCost}–${estCost + 8}</div>
                <div style="font-size:11px;color:#999;">3 meals</div>
            </div>
        </div>

        <!-- Tip: type again to refresh -->
        <div style="background:#fffbeb;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;
                    padding:8px 12px;margin-bottom:14px;font-size:12px;color:#555;">
            💡 <strong>Tip:</strong> Type <strong>"suggest daily meals"</strong> again to get a completely different set of suggestions!
        </div>

        <!-- TODAY'S PICKS -->
        <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:8px;
                    text-transform:uppercase;letter-spacing:0.4px;">🎲 Today's Random Picks</div>
        <div style="display:grid;gap:9px;margin-bottom:14px;">
            ${detailedMealCard('Breakfast', todayBf,    '#f59e0b', '☀️')}
            ${detailedMealCard('Lunch',     todayLunch, '#10b981', '🌤️')}
            ${detailedMealCard('Dinner',    todayDin,   '#6366f1', '🌙')}
        </div>

        <!-- SNACK -->
        <div style="background:white;border:1px solid #e0e6ed;border-radius:10px;padding:11px 14px;margin-bottom:14px;">
            <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:6px;">🍿 Snack Option</div>
            <div style="font-size:13px;font-weight:600;color:#333;">${todaySnack.name} — <span style="color:#667eea;">${todaySnack.cost}</span></div>
            <div style="font-size:12px;color:#555;margin-top:4px;">${todaySnack.note}</div>
        </div>

        <!-- ALTERNATES -->
        <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:8px;
                    text-transform:uppercase;letter-spacing:0.4px;">🔄 Can't Find Those? Try These Instead</div>
        <div style="background:#f8f9fc;border-radius:10px;padding:12px 14px;margin-bottom:14px;font-size:13px;">
            <div style="margin-bottom:6px;">☀️ Alt Breakfast: <strong>${altBf.name}</strong> <span style="color:#667eea;">${altBf.cost}</span> — ${altBf.note}</div>
            <div style="margin-bottom:6px;">🌤️ Alt Lunch: <strong>${altLunch.name}</strong> <span style="color:#667eea;">${altLunch.cost}</span> — ${altLunch.note}</div>
            <div>🌙 Alt Dinner: <strong>${altDin.name}</strong> <span style="color:#667eea;">${altDin.cost}</span> — ${altDin.note}</div>
        </div>

        <!-- WEEKLY THEMED PLAN -->
        <div style="background:white;border:2px solid ${weeklyTheme.color}30;border-radius:10px;
                    overflow:hidden;margin-bottom:14px;">
            <div style="background:${weeklyTheme.color};padding:10px 14px;display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <div style="font-weight:700;color:white;font-size:14px;">${weeklyTheme.theme}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.85);margin-top:2px;">${weeklyTheme.description}</div>
                </div>
                <span style="background:rgba(255,255,255,0.2);color:white;font-size:11px;font-weight:600;
                             padding:3px 10px;border-radius:10px;white-space:nowrap;">This Week</span>
            </div>
            <div style="padding:12px 14px;">
                ${buildWeeklyPlanTable(weeklyTheme)}
            </div>
        </div>

        <!-- GROCERY ESSENTIALS -->
        <div style="background:#f8f9fc;border-radius:10px;padding:12px 14px;">
            <div style="font-size:12px;font-weight:700;color:#2c3e50;margin-bottom:8px;
                        text-transform:uppercase;letter-spacing:0.4px;">🛒 Weekly Grocery Essentials</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:12px;">
                ${[
                    ['Rice (5kg)',            'RM22–30', '3–4 weeks'],
                    ['Eggs (10pcs)',          'RM7–9',   '1 week'],
                    ['Chicken (1kg)',         'RM11–15', '3–4 meals'],
                    ['Mixed vegetables',      'RM8–13',  '5 days'],
                    ['Instant oats (800g)',   'RM9–13',  '2–3 weeks'],
                    ['Bread + kaya/peanut butter','RM9–13','1 week'],
                    ['Cooking oil (2L)',      'RM14–19', '3–4 weeks'],
                    ['Frozen fish/seafood',   'RM13–20', '1 week'],
                ].map(([item, cost, lasts]) => `
                    <div style="padding:5px 0;border-bottom:1px solid #f0f0f0;">
                        <strong style="color:#2c3e50;">${item}</strong><br>
                        <span style="color:#667eea;font-weight:600;">${cost}</span>
                        <span style="color:#aaa;font-size:11px;"> · ${lasts}</span>
                    </div>
                `).join('')}
            </div>
        </div>`;

        addAIMessage(msg);

    } catch (e) {
        // Fallback: show a random plan without any data
        const bf    = pickRandom(MEAL_POOLS.breakfast.budget);
        const lunch = pickRandom(MEAL_POOLS.lunch.budget);
        const din   = pickRandom(MEAL_POOLS.dinner.budget);

        addAIMessage(`
            <strong>🍽️ Today's Quick Meal Plan</strong><br><br>
            ${detailedMealCard('Breakfast', bf,    '#f59e0b', '☀️')}
            <br>
            ${detailedMealCard('Lunch',     lunch, '#10b981', '🌤️')}
            <br>
            ${detailedMealCard('Dinner',    din,   '#6366f1', '🌙')}
            <br>
            <div style="font-size:12px;color:#667eea;text-align:center;">
                Type <strong>"suggest daily meals"</strong> again for different suggestions!
            </div>
        `);
    }
}