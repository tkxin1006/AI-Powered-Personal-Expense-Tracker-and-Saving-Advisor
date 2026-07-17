/* ─────────────────────────────────────────────────────────────────
   goals-v2.js  –  Improved Savings Goals JS
   ───────────────────────────────────────────────────────────────── */

let goalsData    = [];
let summaryData  = { income: 0, expenses: 0, balance: 0 };
let currentGoalForContribute = null;

const COLORS = {
    blue:   'linear-gradient(90deg,#5b7cff,#764ba2)',
    green:  'linear-gradient(90deg,#28a745,#20c997)',
    amber:  'linear-gradient(90deg,#fd7e14,#ffc107)',
    teal:   'linear-gradient(90deg,#5bc0de,#17a2b8)',
    rose:   'linear-gradient(90deg,#e91e8c,#f06292)',
    purple: 'linear-gradient(90deg,#764ba2,#5b7cff)',
    done:   'linear-gradient(90deg,#28a745,#20c997)',
};

/* ═══════════════════════════════════════════════════════════════
   Init
   ═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', async () => {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('goal-date').setAttribute('min', today);

    document.getElementById('goal-form').addEventListener('submit', handleGoalSubmit);

    await Promise.all([loadSummary(), loadGoals()]);
});

/* ═══════════════════════════════════════════════════════════════
   Data fetching
   ═══════════════════════════════════════════════════════════════ */
async function loadSummary() {
    try {
        const res  = await fetch('api.php?action=get_summary');
        const data = await res.json();
        if (data.success) summaryData = data.data;
    } catch (e) {}
}

async function loadGoals() {
    try {
        const res  = await fetch('api.php?action=get_goals');
        const data = await res.json();
        if (data.success) {
            goalsData = data.data;
            renderOverview(goalsData);
            renderGoals(goalsData);
        }
    } catch (e) {
        document.getElementById('goals-grid').innerHTML =
            '<p class="loading">Error loading goals. Please refresh.</p>';
    }
}

async function loadContributions(goalId) {
    try {
        const res  = await fetch(`api.php?action=get_contributions&goal_id=${goalId}`);
        const data = await res.json();
        return data.success ? data.data : [];
    } catch (e) { return []; }
}

/* ═══════════════════════════════════════════════════════════════
   Overview bar
   ═══════════════════════════════════════════════════════════════ */
function renderOverview(goals) {
    if (!goals.length) return;

    const totalSaved  = goals.reduce((s, g) => s + parseFloat(g.current_amount),  0);
    const totalTarget = goals.reduce((s, g) => s + parseFloat(g.target_amount), 0);
    const completed   = goals.filter(g => parseFloat(g.current_amount) >= parseFloat(g.target_amount)).length;
    const pct         = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

    document.getElementById('ov-saved').textContent      = '$' + totalSaved.toFixed(2);
    document.getElementById('ov-target').textContent     = '$' + totalTarget.toFixed(2);
    document.getElementById('ov-completed').textContent  = completed;
    document.getElementById('ov-completed-sub').textContent = `of ${goals.length} goal${goals.length !== 1 ? 's' : ''}`;
    document.getElementById('ov-progress').textContent   = pct + '%';
}

/* ═══════════════════════════════════════════════════════════════
   Goal cards render
   ═══════════════════════════════════════════════════════════════ */
function renderGoals(goals) {
    const container = document.getElementById('goals-grid');
    container.innerHTML = '';

    if (!goals.length) {
        container.innerHTML = `
            <div class="goals-empty" style="grid-column:1/-1;">
                <i class="fas fa-bullseye"></i>
                <h3>No savings goals yet</h3>
                <p>Create your first goal to start tracking your savings journey!</p>
                <button onclick="openGoalModal()" class="btn-primary" style="margin-top:16px;padding:10px 24px;">
                    <i class="fas fa-plus"></i> Create First Goal
                </button>
            </div>`;
        return;
    }

    goals.forEach(goal => {
        const current   = parseFloat(goal.current_amount);
        const target    = parseFloat(goal.target_amount);
        const pct       = target > 0 ? Math.min((current / target) * 100, 100) : 0;
        const remaining = Math.max(target - current, 0);
        const isDone    = current >= target;
        const color     = goal.color || 'blue';

        const daysLeft  = Math.ceil((new Date(goal.target_date) - new Date()) / 86400000);
        const daysText  = daysLeft <= 0 ? 'Deadline passed' : `${daysLeft}d left`;

        /* Monthly saving required */
        const monthsLeft = Math.max(daysLeft / 30, 0.1);
        const monthly    = remaining / monthsLeft;

        /* Projection: at current pace when will it be done? */
        const contribPerMonth = getContribRate(goal);
        let projText = '—';
        if (isDone) {
            projText = 'Achieved!';
        } else if (contribPerMonth > 0) {
            const monthsNeeded = remaining / contribPerMonth;
            const projDate     = new Date();
            projDate.setMonth(projDate.getMonth() + Math.ceil(monthsNeeded));
            projText = projDate.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
        }

        const card = document.createElement('div');
        card.className = 'goal-card-v2';
        card.innerHTML = `
            <div class="goal-card-accent ${isDone ? 'done' : color}"
                 style="background:${isDone ? COLORS.done : (COLORS[color] || COLORS.blue)}"></div>
            <div class="goal-card-body">
                <div class="goal-card-top">
                    <div>
                        <div class="goal-name">${escapeHtml(goal.name)}</div>
                        ${goal.notes ? `<div style="font-size:12px;color:var(--text-gray);margin-top:2px;">${escapeHtml(goal.notes)}</div>` : ''}
                    </div>
                    <div class="goal-card-actions">
                        <button onclick="editGoal(${goal.id})" title="Edit goal">
                            <i class="fas fa-pen"></i>
                        </button>
                        <button class="btn-danger" onclick="deleteGoal(${goal.id},'${escapeHtml(goal.name)}')" title="Delete goal">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="goal-amounts-row">
                    <span class="goal-saved">$${current.toFixed(2)}</span>
                    <span class="goal-target">of $${target.toFixed(2)}</span>
                </div>

                <div class="goal-progress-track">
                    <div class="goal-progress-fill ${isDone ? 'done' : ''}"
                         style="width:${pct.toFixed(1)}%;background:${isDone ? COLORS.done : (COLORS[color] || COLORS.blue)}"></div>
                </div>

                <div class="goal-progress-meta">
                    <span>${pct.toFixed(1)}% complete</span>
                    <span style="color:${daysLeft <= 7 && !isDone ? 'var(--expense-red)' : 'var(--text-gray)'}">
                        <i class="fas fa-calendar-alt" style="font-size:10px;"></i> ${daysText}
                    </span>
                </div>

                <div class="goal-stats">
                    <div class="goal-stat-item">
                        <div class="stat-val">$${remaining.toFixed(2)}</div>
                        <div class="stat-lbl">Remaining</div>
                    </div>
                    <div class="goal-stat-item">
                        <div class="stat-val">$${monthly.toFixed(0)}/mo</div>
                        <div class="stat-lbl">Needed/month</div>
                    </div>
                    <div class="goal-stat-item">
                        <div class="stat-val" style="font-size:11px;">${projText}</div>
                        <div class="stat-lbl">Projected done</div>
                    </div>
                </div>

                ${isDone
                    ? `<div class="goal-achieved-banner">
                           <i class="fas fa-check-circle"></i> Goal Achieved! Congratulations!
                       </div>`
                    : `<button class="btn-contribute-v2" onclick="openContributeModal(${goal.id})"
                           style="background:${isDone ? COLORS.done : (COLORS[color] || COLORS.blue)};">
                           <i class="fas fa-plus-circle"></i> Add Contribution
                       </button>`
                }
            </div>

            <div class="contribution-history" id="history-${goal.id}">
                <button class="history-toggle" onclick="toggleHistory(${goal.id}, this)">
                    <i class="fas fa-chevron-down"></i> View contribution history
                </button>
                <div class="history-list" id="history-list-${goal.id}">
                    <p style="font-size:12px;color:var(--text-gray);text-align:center;padding:12px;">Loading…</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

/* Estimate monthly contribution rate from history (simplified) */
function getContribRate(goal) {
    const created   = new Date(goal.created_at || goal.target_date);
    const now       = new Date();
    const monthsDiff = Math.max((now - created) / (1000 * 60 * 60 * 24 * 30), 0.1);
    return parseFloat(goal.current_amount) / monthsDiff;
}

/* ═══════════════════════════════════════════════════════════════
   Contribution history toggle
   ═══════════════════════════════════════════════════════════════ */
async function toggleHistory(goalId, btn) {
    const list = document.getElementById(`history-list-${goalId}`);
    if (list.classList.contains('open')) {
        list.classList.remove('open');
        btn.innerHTML = '<i class="fas fa-chevron-down"></i> View contribution history';
        return;
    }

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading…';
    const contribs = await loadContributions(goalId);
    list.classList.add('open');
    btn.innerHTML = '<i class="fas fa-chevron-up"></i> Hide history';

    if (!contribs.length) {
        list.innerHTML = '<p style="font-size:12px;color:var(--text-gray);padding:8px 0;">No contributions yet.</p>';
        return;
    }

    list.innerHTML = contribs.map(c => `
        <div class="history-item">
            <div>
                <div class="hi-note">${escapeHtml(c.note || 'Contribution')}</div>
                <div class="hi-source">${escapeHtml(c.source_label || 'Balance')} · ${formatDate(c.created_at)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="hi-amount">+$${parseFloat(c.amount).toFixed(2)}</span>
                <button class="hi-delete" onclick="deleteContribution(${c.id}, ${goalId})" title="Delete">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

async function deleteContribution(contribId, goalId) {
    if (!confirm('Remove this contribution? The goal balance will be adjusted.')) return;

    const fd = new FormData();
    fd.append('contribution_id', contribId);

    const res  = await fetch('api.php?action=delete_contribution', { method: 'POST', body: fd });
    const data = await res.json();

    if (data.success) {
        showNotification('Contribution removed.', 'success');
        await Promise.all([loadSummary(), loadGoals()]);
    } else {
        showNotification(data.message || 'Failed to remove.', 'error');
    }
}

/* ═══════════════════════════════════════════════════════════════
   Contribute modal
   ═══════════════════════════════════════════════════════════════ */
function openContributeModal(goalId) {
    currentGoalForContribute = goalsData.find(g => g.id == goalId);
    if (!currentGoalForContribute) return;

    document.getElementById('contribute-goal-id').value  = goalId;
    document.getElementById('contribute-modal-title').textContent =
        'Add Contribution — ' + currentGoalForContribute.name;
    document.getElementById('contribute-amount').value   = '';
    document.getElementById('contribute-note').value     = '';
    document.getElementById('contribute-source').value   = 'balance';
    document.getElementById('impact-preview').classList.remove('visible');
    updateSourceInfo();
    document.getElementById('contribute-modal').classList.add('active');
    setTimeout(() => document.getElementById('contribute-amount').focus(), 100);
}

function closeContributeModal() {
    document.getElementById('contribute-modal').classList.remove('active');
    currentGoalForContribute = null;
}

function updateSourceInfo() {
    const source = document.getElementById('contribute-source').value;
    const infoEl = document.getElementById('source-info');
    const msgs = {
        balance: `Deducted from your available balance ($${parseFloat(summaryData.balance || 0).toFixed(2)} available). Recorded as a transaction.`,
        manual:  `Cash or external deposit — only goal progress is updated. No transaction recorded.`,
    };
    infoEl.textContent = msgs[source] || '';
    document.getElementById('ip-balance-row').style.display = source === 'manual' ? 'none' : 'flex';
    updateImpactPreview();
}

function updateImpactPreview() {
    const amt  = parseFloat(document.getElementById('contribute-amount').value);
    const src  = document.getElementById('contribute-source').value;
    const goal = currentGoalForContribute;
    if (!goal || isNaN(amt) || amt <= 0) {
        document.getElementById('impact-preview').classList.remove('visible');
        return;
    }

    const current    = parseFloat(goal.current_amount);
    const target     = parseFloat(goal.target_amount);
    const newCurrent = current + amt;
    const pctAfter   = Math.min((newCurrent / target) * 100, 100);
    const remaining  = Math.max(target - newCurrent, 0);
    const balance    = parseFloat(summaryData.balance || 0);
    const newBalance = balance - (src === 'manual' ? 0 : amt);

    document.getElementById('ip-progress').textContent  = pctAfter.toFixed(1) + '%';
    document.getElementById('ip-remaining').textContent = '$' + remaining.toFixed(2);

    const balEl = document.getElementById('ip-balance');
    balEl.textContent = src === 'manual' ? 'N/A' : '$' + newBalance.toFixed(2);
    balEl.className   = 'ir-value' + (newBalance < 0 ? ' bad' : newBalance < 50 ? ' warn' : ' good');

    /* Rough completion estimate */
    const rate = getContribRate(goal);
    let compText = '—';
    if (newCurrent >= target) {
        compText = 'Goal reached!';
    } else if (rate > 0 || amt > 0) {
        const effectiveRate = Math.max(rate, amt);
        const months = remaining / effectiveRate;
        const d = new Date();
        d.setMonth(d.getMonth() + Math.ceil(months));
        compText = d.toLocaleDateString('en-MY', { month: 'short', year: 'numeric' });
    }
    document.getElementById('ip-completion').textContent = compText;

    document.getElementById('impact-preview').classList.add('visible');
}

async function submitContribution() {
    const goalId = document.getElementById('contribute-goal-id').value;
    const amt    = parseFloat(document.getElementById('contribute-amount').value);
    const source = document.getElementById('contribute-source').value;
    const note   = document.getElementById('contribute-note').value.trim();
    const goal   = currentGoalForContribute;

    if (!amt || amt <= 0) { showNotification('Please enter a valid amount.', 'error'); return; }

    /* Balance check */
    if (source !== 'manual') {
        const balance = parseFloat(summaryData.balance || 0);
        if (amt > balance + 0.01) {
            showNotification(`Insufficient balance. Available: $${balance.toFixed(2)}`, 'error');
            return;
        }
    }

    const fd = new FormData();
    fd.append('goal_id', goalId);
    fd.append('amount',  amt);
    fd.append('source',  source);
    fd.append('note',    note || 'Savings contribution');

    const res  = await fetch('api.php?action=contribute_goal_v2', { method: 'POST', body: fd });
    const data = await res.json();

    if (data.success) {
        closeContributeModal();
        showNotification(`$${amt.toFixed(2)} added to "${goal.name}"! ${data.budgets_updated ? 'Balance updated.' : ''}`, 'success');
        await Promise.all([loadSummary(), loadGoals()]);
    } else {
        showNotification(data.message || 'Failed to save contribution.', 'error');
    }
}

/* ═══════════════════════════════════════════════════════════════
   Goal CRUD
   ═══════════════════════════════════════════════════════════════ */
function openGoalModal() {
    document.getElementById('goal-modal-title').textContent = 'New Savings Goal';
    document.getElementById('goal-form').reset();
    document.getElementById('goal-id').value = '';
    document.getElementById('goal-modal').classList.add('active');
}

function closeGoalModal() {
    document.getElementById('goal-modal').classList.remove('active');
}

function editGoal(id) {
    const goal = goalsData.find(g => g.id == id);
    if (!goal) return;

    document.getElementById('goal-modal-title').textContent = 'Edit Goal';
    document.getElementById('goal-id').value      = goal.id;
    document.getElementById('goal-name').value    = goal.name;
    document.getElementById('goal-target').value  = goal.target_amount;
    document.getElementById('goal-current').value = goal.current_amount;
    document.getElementById('goal-date').value    = goal.target_date;
    document.getElementById('goal-color').value   = goal.color || 'blue';
    document.getElementById('goal-notes').value   = goal.notes || '';
    document.getElementById('goal-modal').classList.add('active');
}

async function handleGoalSubmit(e) {
    e.preventDefault();
    const fd     = new FormData(e.target);
    const isEdit = !!fd.get('goal_id');
    const action = isEdit ? 'update_goal' : 'add_goal';

    const res  = await fetch(`api.php?action=${action}`, { method: 'POST', body: fd });
    const data = await res.json();

    if (data.success) {
        closeGoalModal();
        await loadGoals();
        showNotification(isEdit ? 'Goal updated!' : 'Goal created!', 'success');
    } else {
        showNotification(data.message || 'Failed to save goal.', 'error');
    }
}

async function deleteGoal(id, name) {
    if (!confirm(`Delete goal "${name}"? This will also remove all its contribution history.`)) return;

    const fd = new FormData();
    fd.append('goal_id', id);

    const res  = await fetch('api.php?action=delete_goal', { method: 'POST', body: fd });
    const data = await res.json();

    if (data.success) {
        await loadGoals();
        showNotification('Goal deleted.', 'success');
    } else {
        showNotification(data.message || 'Failed to delete.', 'error');
    }
}

/* ═══════════════════════════════════════════════════════════════
   Utilities
   ═══════════════════════════════════════════════════════════════ */
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' });
}

function escapeHtml(str) {
    if (!str) return '';
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
}

function showNotification(message, type = 'success') {
    const n = document.createElement('div');
    n.className = `alert alert-${type}`;
    Object.assign(n.style, {
        position: 'fixed', top: '20px', right: '20px',
        zIndex: '9999', minWidth: '300px', maxWidth: '420px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    });
    n.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    document.body.appendChild(n);
    setTimeout(() => n.remove(), 3500);
}

function exportData() { window.location.href = 'export.php'; }