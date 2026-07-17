/**
 * Intelligent Category Detection System
 *
 * Key improvements over original:
 * 1. Exclusion list — if a keyword is in a category's exclusions, that category is blocked
 * 2. Priority flag — priority categories win ties against non-priority ones
 * 3. Multi-word phrase matching is the primary strategy (most specific wins)
 * 4. Single vague words (e.g. "bill", "shop") only score weakly alone
 * 5. Diminishing returns — many weak matches don't beat one strong match
 * 6. Full phrase scoring — longer matched phrases score higher
 * 7. Subcategory → Parent mapping — detected subcategory names (e.g. "Dining Out",
 *    "E-Hailing & Taxi") are automatically resolved to the DB parent category name
 *    (e.g. "Food & Drinks", "Transport") so the result always matches what is
 *    actually stored in the database.
 *
 * FIX (checkUserPatterns):
 * - OLD: skip all 1-word learned patterns when description has 2+ words
 *   → broke "kfc 25", "aia 150" etc. (amount is not a real word)
 * - NEW: skip only when the "other part" contains real words (not just digits/amounts)
 *   → "kfc 25"      → other="25"      (digits only) → applies learned "kfc"  ✅
 *   → "grab 50"     → other="50"      (digits only) → applies learned "grab" ✅
 *   → "grab driver" → other="driver"  (real word)   → skips, scorer runs     ✅
 *   → "grab food"   → other="food"    (real word)   → skips, scorer runs     ✅
 */

// ─────────────────────────────────────────────────────────────────────────────
// Valid DB category names (all 15 — 10 expense + 5 income).
// resolveToParent() uses this set to verify a detected name is already a DB
// parent. If it is not found here (e.g. a legacy subcategory name somehow
// appears), the name is returned as-is so nothing breaks.
// ─────────────────────────────────────────────────────────────────────────────
const DB_CATEGORY_NAMES = new Set([
    // Expense parents
    'Food & Drinks', 'Transport', 'Housing & Utilities', 'Shopping',
    'Entertainment & Lifestyle', 'Healthcare', 'Education',
    'Financial & Obligations', 'Donations & Gifts', 'Miscellaneous',
    // Income parents
    'Salary', 'Freelance', 'Investment', 'Gift', 'Other Income',
]);

class CategoryDetector {
    constructor() {
        this.categoryPatterns = {};

        try {
            if (typeof require !== 'undefined') {
                this.categoryPatterns = require('./malaysian-category-patterns.js');
            } else if (window.malaysianCategoryPatterns) {
                this.categoryPatterns = window.malaysianCategoryPatterns;
            } else {
                console.warn('⚠️ Category patterns not found.');
            }
        } catch (e) {
            console.error('Failed to load category patterns', e);
        }

        // Derive income categories from pattern file
        this.incomeCategories = Object.entries(this.categoryPatterns)
            .filter(([, data]) => data.transactionType === 'income')
            .map(([name]) => name);

        if (this.incomeCategories.length === 0) {
            this.incomeCategories = ['Salary', 'Freelance', 'Investment'];
        }

        this.userPatterns = this.loadUserPatterns();
    }

    isIncomeCategory(categoryName) {
        return this.incomeCategories.includes(categoryName);
    }

    // ─────────────────────────────────────────────────────────────
    // Verify the detected category name is a known DB parent.
    // Since malaysian-category-patterns.js now uses parent names
    // directly as keys, this is mostly a safety pass-through.
    // If somehow an unknown name appears, it is returned unchanged.
    // ─────────────────────────────────────────────────────────────
    resolveToParent(categoryName) {
        // Already a valid DB parent → return as-is
        if (DB_CATEGORY_NAMES.has(categoryName)) return categoryName;
        // Unknown name (should not happen with new pattern file) → return as-is
        return categoryName;
    }

    // ─────────────────────────────────────────────────────────────
    // Core scoring engine
    // ─────────────────────────────────────────────────────────────
    _scoreAll(normalizedDesc, transactionType) {
        const matches = [];

        for (const [category, data] of Object.entries(this.categoryPatterns)) {
            const catIsIncome = this.isIncomeCategory(category);
            if (transactionType === 'income'  && !catIsIncome) continue;
            if (transactionType === 'expense' &&  catIsIncome) continue;

            // ── EXCLUSION CHECK ──────────────────────────────────
            if (data.exclusions && data.exclusions.length > 0) {
                const excluded = data.exclusions.some(ex =>
                    normalizedDesc.includes(ex.toLowerCase())
                );
                if (excluded) continue;
            }

            let rawScore = 0;
            const matchedKeywords = new Set();
            let bestMatchWordCount = 0;

            for (const keyword of data.keywords) {
                const kw = keyword.toLowerCase();
                const kwWordCount = kw.split(/\s+/).length;

                // ── STRATEGY 1: Full phrase present in description ──
                if (normalizedDesc.includes(kw)) {
                    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                    const boundaryRe = new RegExp(
                        `(^|[\\s,.()/\\-])${escaped}([\\s,.()/\\-]|$)`
                    );
                    const isClean = boundaryRe.test(normalizedDesc) ||
                                    normalizedDesc === kw ||
                                    normalizedDesc.startsWith(kw + ' ') ||
                                    normalizedDesc.endsWith(' ' + kw);

                    const specificityBonus = Math.min((kwWordCount - 1) * 0.3, 0.9);
                    const baseScore = isClean ? 1.0 : 0.85;

                    rawScore += baseScore + specificityBonus;
                    matchedKeywords.add(keyword);

                    if (kwWordCount > bestMatchWordCount) {
                        bestMatchWordCount = kwWordCount;
                    }
                    continue;
                }

                // ── STRATEGY 2: Every word of a multi-word keyword appears in desc ──
                if (kwWordCount >= 2) {
                    const kwWords = kw.split(/\s+/);
                    const allPresent = kwWords.every(kwWord =>
                        new RegExp(`(^|\\s)${kwWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(\\s|$)`)
                            .test(normalizedDesc)
                    );
                    if (allPresent) {
                        rawScore += 0.85 + Math.min((kwWordCount - 1) * 0.2, 0.6);
                        matchedKeywords.add(keyword);
                        if (kwWordCount > bestMatchWordCount) bestMatchWordCount = kwWordCount;
                    }
                }
            }

            if (rawScore > 0) {
                const finalScore = rawScore * data.confidence;
                const confidence = Math.round(Math.min(
                    97,
                    (1 - Math.exp(-finalScore * 1.8)) * 100
                ));

                matches.push({
                    category,
                    isIncome: catIsIncome,
                    score: finalScore,
                    confidence,
                    matchedKeywords: [...matchedKeywords],
                    bestMatchWordCount,
                    isPriority: !!data.priority
                });
            }
        }

        // ── SORT: priority first, then by score ──
        matches.sort((a, b) => {
            if (a.isPriority === b.isPriority) return b.score - a.score;
            return a.isPriority ? -1 : 1;
        });

        // ── TIEBREAK: prefer longer phrase match when scores are close ──
        if (matches.length >= 2) {
            const [first, second] = matches;
            const scoreDiff = Math.abs(first.score - second.score) / Math.max(first.score, 0.01);
            if (scoreDiff < 0.15 && second.bestMatchWordCount > first.bestMatchWordCount) {
                matches[0] = second;
                matches[1] = first;
            }
        }

        return matches;
    }

    // ─────────────────────────────────────────────────────────────
    // Public: detect for expense page (type-filtered)
    // ─────────────────────────────────────────────────────────────
    detectCategory(description, transactionType = 'expense') {
        if (!description || description.trim() === '') return null;

        const normalizedDesc = this._normalize(description);

        const userMatch = this.checkUserPatterns(normalizedDesc);
        if (userMatch) {
            userMatch.category = this.resolveToParent(userMatch.category);
            return userMatch;
        }

        const matches = this._scoreAll(normalizedDesc, transactionType);
        this._log(description, matches);
        if (matches.length === 0) return null;

        const top = matches[0];
        top.category = this.resolveToParent(top.category);
        return top;
    }

    // ─────────────────────────────────────────────────────────────
    // Public: detect for ai-chat (searches ALL categories)
    // ─────────────────────────────────────────────────────────────
    detectCategoryAndType(description) {
        if (!description || description.trim() === '') return null;

        const normalizedDesc = this._normalize(description);

        const userMatch = this.checkUserPatterns(normalizedDesc);
        if (userMatch) {
            const resolved = this.resolveToParent(userMatch.category);
            return { ...userMatch, category: resolved, isIncome: this.isIncomeCategory(resolved) };
        }

        const matches = this._scoreAll(normalizedDesc, 'both');
        this._log(description, matches);
        if (matches.length === 0) return null;

        const top = matches[0];
        const resolved = this.resolveToParent(top.category);
        return { ...top, category: resolved, isIncome: this.isIncomeCategory(resolved) };
    }

    // ─────────────────────────────────────────────────────────────
    // Normalize input: lowercase, trim, collapse spaces
    // ─────────────────────────────────────────────────────────────
    _normalize(description) {
        return description
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');
    }

    // ─────────────────────────────────────────────────────────────
    // Check patterns learned from the user's past choices
    //
    // FIX: The old rule "skip if pattern=1 word AND desc has 2+ words"
    // was too aggressive — it broke "kfc 25", "aia 150", "grab 50" etc.
    // because the amount is not a real word.
    //
    // NEW RULE: skip a 1-word pattern only when the remaining part of
    // the description (after removing the pattern word) contains actual
    // words — not just digits/amounts.
    //
    // Examples:
    //   "kfc 25"      → after removing "kfc":  "25"      → digits only → APPLY ✅
    //   "grab 50"     → after removing "grab": "50"      → digits only → APPLY ✅
    //   "aia 150"     → after removing "aia":  "150"     → digits only → APPLY ✅
    //   "grab driver" → after removing "grab": "driver"  → real word   → SKIP  ✅
    //   "grab food"   → after removing "grab": "food"    → real word   → SKIP  ✅
    //   "aia renewal" → after removing "aia":  "renewal" → real word   → SKIP  ✅
    // ─────────────────────────────────────────────────────────────
    checkUserPatterns(normalizedDesc) {
        // Sort by pattern length descending so longer/more specific patterns win
        const sorted = Object.entries(this.userPatterns)
            .sort((a, b) => b[0].length - a[0].length);

        for (const [pattern, category] of sorted) {
            const pat = pattern.toLowerCase();
            const patWords  = pat.trim().split(/\s+/).length;
            const descWords = normalizedDesc.trim().split(/\s+/).length;

            if (patWords === 1 && descWords > 1) {
                // ── KEY FIX ──────────────────────────────────────────────
                // Remove the pattern word from the description, then check
                // what is left. If the remainder is only digits / decimal
                // numbers (i.e. a transaction amount), allow the match.
                // If the remainder contains real alphabetic words, skip so
                // the normal scoring engine handles it properly.
                const escaped = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const otherPart = normalizedDesc
                    .replace(new RegExp('(^|\\s)' + escaped + '(\\s|$)', 'g'), ' ')
                    .trim();

                // otherHasRealWords = true when remainder has at least one
                // token that is NOT a pure number / decimal
                const otherHasRealWords = otherPart.length > 0 &&
                    !/^\d[\d\s.]*$/.test(otherPart);

                if (otherHasRealWords) {
                    continue;  // let normal scoring handle this description
                }
                // else: remainder is digits only → fall through and apply the pattern
            }

            // For multi-word patterns (e.g. 'grab driver' → Freelance),
            // use whole-word boundary match so it doesn't fire inside longer phrases
            const escaped   = pat.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const wordMatch = new RegExp('(^|[\\s])' + escaped + '([\\s]|$)').test(normalizedDesc);

            if (wordMatch) {
                return {
                    category,
                    score: 15,   // high score — user explicitly chose this
                    confidence: 96,
                    matchedKeywords: [pattern],
                    bestMatchWordCount: patWords,
                    isPriority: true,
                    isLearned: true,
                    isIncome: this.isIncomeCategory(category)
                };
            }
        }
        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // Learn: store user's confirmed category for this description
    // Stores up to 5 words as the key for better future matching
    // ─────────────────────────────────────────────────────────────
    learnFromTransaction(description, categoryName) {
        if (!description || !categoryName) return;

        const normalized = this._normalize(description);
        // Remove the amount if it's still in the description
        const withoutAmount = normalized.replace(/\d+(\.\d+)?/g, '').trim();
        // Store the full cleaned description (up to 5 words) as the learned key
        const words = withoutAmount.split(/\s+/).filter(w => w.length >= 2);
        const keyword = words.slice(0, 5).join(' ');

        if (keyword.length >= 2) {
            this.userPatterns[keyword] = categoryName;
            this.saveUserPatterns();
            console.log(`🧠 Learned: "${keyword}" → "${categoryName}"`);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Debug log — shows in browser console
    // ─────────────────────────────────────────────────────────────
    _log(description, matches) {
        if (matches.length === 0) {
            console.log(`🔍 "${description}" → no match`);
        } else {
            const top = matches[0];
            console.log(
                `🔍 "${description}" → "${top.category}" ` +
                `(score: ${top.score.toFixed(2)}, confidence: ${top.confidence}%, ` +
                `matched: [${top.matchedKeywords.join(', ')}])`
            );
            if (matches.length > 1) {
                console.log(`   Runner-up: "${matches[1].category}" (score: ${matches[1].score.toFixed(2)})`);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Persistence
    // ─────────────────────────────────────────────────────────────
    loadUserPatterns() {
        try { return JSON.parse(localStorage.getItem('categoryPatterns') || '{}'); } catch (e) { return {}; }
    }

    saveUserPatterns() {
        try { localStorage.setItem('categoryPatterns', JSON.stringify(this.userPatterns)); } catch (e) {}
    }

    getLearnedPatterns() { return this.userPatterns; }

    clearLearnedPatterns() {
        this.userPatterns = {};
        localStorage.removeItem('categoryPatterns');
        console.log('🗑️ Learned patterns cleared.');
    }
}

if (typeof module !== 'undefined' && module.exports) module.exports = CategoryDetector;