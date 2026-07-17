/* ─────────────────────────────────────────────────────────────────
   reports.js  –  Financial Reports Page
   Charts used (all different from Dashboard bar chart):
   ① Financial Health Bar  – animated progress bar showing expense ratio
   ② Savings Rate Gauge    – half-doughnut speedometer with centre KPI
   ③ Horizontal Category Bar – easy-to-read category spending (replaces donut)
   ④ Area Trend Line       – only shown for 3-month / 6-month / year periods
   ───────────────────────────────────────────────────────────────── */

let trendChart, savingsGaugeChart;

document.addEventListener('DOMContentLoaded', function () {
    loadReports();
    injectReportStyles();
});

function loadReports() {
    const period = document.getElementById('report-period').value;

    fetch(`api.php?action=get_reports&period=${period}`)
        .then(r => r.json())
        .then(data => {
            if (!data.success) return;
            const d = data.data;

            updateReportSummary(d.summary);
            updatePeriodDisplay(d.period, d.date_range);
            renderFinancialHealthBar(d.summary);
            renderSavingsGauge(d.summary);
            renderCategoryBar(d.categories);
            renderTrendLine(d.trend, d.period);
            displayTopCategories(d.categories);
        })
        .catch(e => console.error('Reports error:', e));
}

function updateReportSummary(summary) {
    const savings = parseFloat(summary.savings);
    const savEl   = document.getElementById('report-savings');

    document.getElementById('report-income').textContent   = 'RM ' + parseFloat(summary.income).toFixed(2);
    document.getElementById('report-expenses').textContent = 'RM ' + parseFloat(summary.expenses).toFixed(2);
    document.getElementById('report-daily').textContent    = 'RM ' + parseFloat(summary.daily_avg).toFixed(2);

    if (savEl) {
        savEl.textContent = (savings < 0 ? '-RM ' : 'RM ') + Math.abs(savings).toFixed(2);
        savEl.style.color = savings >= 0 ? '#38a169' : '#e53e3e';
    }
}

function updatePeriodDisplay(period, dateRange) {
    const periodTitle = document.querySelector('.page-title');
    if (!periodTitle) return;

    let ind = document.getElementById('date-range-indicator');
    if (!ind) {
        ind = document.createElement('span');
        ind.id        = 'date-range-indicator';
        ind.className = 'date-range-indicator';
        periodTitle.appendChild(ind);
    }

    const fmt = d => new Date(d).toLocaleDateString('en-MY', { month: 'short', day: 'numeric', year: 'numeric' });
    ind.textContent = `(${fmt(dateRange.start)} to ${fmt(dateRange.end)})`;
}

function renderFinancialHealthBar(summary) {
    const income    = parseFloat(summary.income)   || 0;
    const expenses  = parseFloat(summary.expenses) || 0;
    const savings   = income - expenses;

    // ── FIX: handle zero-data case explicitly ──
    const noData    = income === 0 && expenses === 0;
    const pct       = noData ? 0
                    : income > 0 ? Math.min((expenses / income) * 100, 100)
                    : 100;
    const savPct    = 100 - pct;
    const isDeficit = savings < 0;
    const overPct   = income > 0 && expenses > income
        ? (((expenses - income) / income) * 100).toFixed(1) : null;

    // ── FIX: no-data gets a neutral grey status ──
    const statusColor = noData     ? '#a0aec0'
        : isDeficit                ? '#e53e3e'
        : pct >= 80                ? '#dd6b20'
        : pct >= 60                ? '#d69e2e'
        : '#38a169';

    const statusLabel = noData     ? '⚪ No Data'
        : isDeficit                ? '🔴 Over Budget'
        : pct >= 80                ? '🟠 High Spending'
        : pct >= 60                ? '🟡 Moderate'
        : '🟢 Healthy';

    // ── FIX: no-data gets a neutral tip ──
    const tip = noData
        ? '💡 No transactions recorded for this period. Add income and expenses to see your financial health.'
        : isDeficit
            ? `💡 You spent <strong>RM ${(expenses - income).toFixed(2)}</strong> more than you earned. Try reducing discretionary spending.`
            : pct >= 80
                ? `💡 Expenses are <strong>${pct.toFixed(0)}%</strong> of income. Aim below 80% to build real savings.`
                : pct >= 60
                    ? `💡 Decent! You saved <strong>RM ${savings.toFixed(2)}</strong>. Pushing above 20% savings accelerates your goals.`
                    : `✅ Excellent! You saved <strong>${savPct.toFixed(0)}%</strong> of income. Consider investing the surplus.`;

    const chartBoxes = document.querySelectorAll('.chart-box');
    if (!chartBoxes.length) return;
    const box = chartBoxes[0];

    const h3 = box.querySelector('h3');
    if (h3) h3.textContent = 'Financial Health Overview';

    const oldCanvas = box.querySelector('canvas');
    if (oldCanvas) oldCanvas.style.display = 'none';
    const old = box.querySelector('#health-bar-wrap');
    if (old) old.remove();

    const wrap = document.createElement('div');
    wrap.id = 'health-bar-wrap';
    wrap.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <span style="font-size:13px;color:#666;font-weight:500;">Expense ratio this period</span>
            <span style="background:${statusColor}18;color:${statusColor};border:1px solid ${statusColor}44;
                         padding:4px 14px;border-radius:20px;font-size:13px;font-weight:600;">${statusLabel}</span>
        </div>

        <div style="position:relative;height:46px;background:#f0f4f8;border-radius:12px;overflow:hidden;
                    margin-bottom:10px;box-shadow:inset 0 1px 4px rgba(0,0,0,0.08);">
            <div id="expense-fill" style="position:absolute;left:0;top:0;height:100%;width:0%;
                 background:linear-gradient(90deg,${statusColor}bb,${statusColor});
                 border-radius:12px 0 0 12px;transition:width 1.3s cubic-bezier(.4,0,.2,1);"></div>
            ${!isDeficit && !noData ? `<div style="position:absolute;top:0;height:100%;left:${pct}%;right:0;
                 background:rgba(56,161,105,0.2);border-left:2px dashed #38a16988;"></div>` : ''}
            <div style="position:absolute;inset:0;display:flex;align-items:center;
                        justify-content:space-between;padding:0 16px;pointer-events:none;">
                <span style="color:${noData ? '#a0aec0' : 'white'};font-size:13px;font-weight:700;text-shadow:0 1px 3px rgba(0,0,0,0.25);">
                    ${noData ? 'No Data' : `Expenses ${pct.toFixed(1)}%`}
                </span>
                ${!isDeficit && !noData ? `<span style="color:#276749;font-size:12px;font-weight:600;">
                    Saved ${savPct.toFixed(1)}%</span>` : ''}
            </div>
        </div>

        ${overPct ? `<p style="font-size:12px;color:#e53e3e;text-align:center;margin-bottom:10px;">
            ⚠️ Overspent by ${overPct}% beyond income this period</p>` : ''}

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:18px 0;">
            <div class="kpi-pill" style="border-color:#38a16940;">
                <div class="kpi-lbl">Total Income</div>
                <div class="kpi-val" style="color:#38a169;">RM ${income.toFixed(2)}</div>
            </div>
            <div class="kpi-pill" style="border-color:#e53e3e40;">
                <div class="kpi-lbl">Total Expenses</div>
                <div class="kpi-val" style="color:#e53e3e;">RM ${expenses.toFixed(2)}</div>
            </div>
            <div class="kpi-pill" style="border-color:${statusColor}40;">
                <div class="kpi-lbl">Net Savings</div>
                <div class="kpi-val" style="color:${isDeficit ? '#e53e3e' : '#38a169'};">
                    ${noData ? 'RM 0.00' : (isDeficit ? '-' : '+') + 'RM ' + Math.abs(savings).toFixed(2)}
                </div>
            </div>
        </div>

        <div style="padding:12px 16px;background:${statusColor}0e;border-left:3px solid ${statusColor};
                    border-radius:0 8px 8px 0;font-size:13px;color:#444;line-height:1.6;">${tip}</div>
    `;
    box.appendChild(wrap);

    requestAnimationFrame(() => setTimeout(() => {
        const fill = document.getElementById('expense-fill');
        if (fill) fill.style.width = Math.min(pct, 100) + '%';
    }, 80));
}

function renderSavingsGauge(summary) {
    const income   = parseFloat(summary.income)   || 0;
    const expenses = parseFloat(summary.expenses) || 0;
    const savings  = income - expenses;

    // ── FIX: no-data case ──
    const noData  = income === 0 && expenses === 0;
    const rate    = noData ? 0 : income > 0 ? (savings / income) * 100 : 0;
    const clamped = Math.max(Math.min(rate, 100), -100);

    const chartBoxes = document.querySelectorAll('.chart-box');
    if (chartBoxes.length < 2) return;
    const box = chartBoxes[1];

    const h3 = box.querySelector('h3');
    if (h3) h3.textContent = 'Savings Rate Gauge';

    const oldCanvas = box.querySelector('canvas');
    if (oldCanvas) oldCanvas.style.display = 'none';
    const oldWrap = box.querySelector('#gauge-wrap');
    if (oldWrap) oldWrap.remove();

    const gaugeColor = noData    ? '#a0aec0'
        : rate >= 20             ? '#38a169'
        : rate >= 10             ? '#d69e2e'
        : rate >= 0              ? '#dd6b20'
        : '#e53e3e';

    const wrap = document.createElement('div');
    wrap.id = 'gauge-wrap';
    wrap.style.cssText = 'position:relative;max-width:300px;margin:0 auto;padding-top:8px;';

    const gc = document.createElement('canvas');
    gc.id = 'savingsGaugeCanvas';
    wrap.appendChild(gc);

    const label = document.createElement('div');
    label.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-20%);text-align:center;pointer-events:none;';
    label.innerHTML = `
        <div style="font-size:32px;font-weight:800;color:${gaugeColor};line-height:1;">
            ${noData ? '—' : (rate >= 0 ? '' : '-') + Math.abs(rate).toFixed(1) + '%'}
        </div>
        <div style="font-size:11px;color:#999;font-weight:500;margin-top:3px;letter-spacing:0.4px;">SAVINGS RATE</div>
    `;
    wrap.appendChild(label);

    const zoneRow = document.createElement('div');
    zoneRow.style.cssText = 'display:flex;justify-content:space-between;font-size:11px;color:#bbb;margin-top:4px;padding:0 8px;';
    zoneRow.innerHTML = `<span>-100%<br><span style="color:#e53e3e">Deficit</span></span>
                         <span style="text-align:center;">0%<br><span style="color:#d69e2e">Break-even</span></span>
                         <span style="text-align:right;">100%<br><span style="color:#38a169">Perfect</span></span>`;
    wrap.appendChild(zoneRow);

    const bench = document.createElement('div');
    bench.style.cssText = 'text-align:center;margin-top:16px;padding:10px;background:' + gaugeColor + '12;' +
        'border-radius:10px;font-size:13px;color:#444;font-weight:500;';
    bench.textContent = noData   ? '⚪ No transaction data for this period'
        : rate >= 20             ? '✅ Above 20% savings target — great job!'
        : rate >= 0              ? `⚡ ${(20 - rate).toFixed(1)}% away from the 20% target`
        : '⚠️ Negative savings rate — expenses exceed income';
    wrap.appendChild(bench);

    // ── FIX: when no data, show neutral grey gauge at centre position ──
    const displayed = noData ? 100 : Math.max(clamped + 100, 0);
    const remainder = 200 - displayed;

    if (savingsGaugeChart) { savingsGaugeChart.destroy(); savingsGaugeChart = null; }

    box.appendChild(wrap);

    savingsGaugeChart = new Chart(gc, {
        type: 'doughnut',
        data: {
            datasets: [
                {
                    data: [50, 25, 25],
                    backgroundColor: ['#f8d7da', '#fef3cd', '#d4edda'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                    weight: 0.3,
                },
                {
                    data: [Math.max(displayed, 0), Math.max(remainder, 0)],
                    backgroundColor: [gaugeColor, 'rgba(0,0,0,0.04)'],
                    borderWidth: 0,
                    circumference: 180,
                    rotation: 270,
                    weight: 1,
                }
            ]
        },
        options: {
            responsive: true,
            cutout: '65%',
            plugins: { legend: { display: false }, tooltip: { enabled: false } },
            animation: { animateRotate: true, duration: 1400, easing: 'easeOutBack' },
        }
    });
}

/* ═══════════════════════════════════════════════════════════════
   ③ Horizontal Category Bar Chart  — FIXED VERSION
   Compact bars inside a scrollable container so the chart never
   overflows the page. Readable at any category count.
   ═══════════════════════════════════════════════════════════════ */
function renderCategoryBar(categories) {
    let catBox = document.getElementById('category-bar-box');
    if (!catBox) {
        catBox = document.createElement('div');
        catBox.id        = 'category-bar-box';
        catBox.className = 'chart-box';
        catBox.style.cssText = 'grid-column:1/-1;';

        const h3 = document.createElement('h3');
        h3.textContent = 'Spending by Category';
        catBox.appendChild(h3);

        // Scrollable wrapper — chart scrolls inside, box stays fixed height
        const scrollWrap = document.createElement('div');
        scrollWrap.id = 'cat-scroll-wrap';
        scrollWrap.style.cssText = `
            max-height: 380px;
            overflow-y: auto;
            overflow-x: hidden;
            border-radius: 8px;
            padding-right: 4px;
        `;

        const canvas = document.createElement('canvas');
        canvas.id = 'categoryBarChart';
        scrollWrap.appendChild(canvas);
        catBox.appendChild(scrollWrap);

        const chartsGrid = document.querySelector('.charts-grid');
        if (chartsGrid && chartsGrid.parentNode) {
            chartsGrid.parentNode.insertBefore(catBox, chartsGrid.nextSibling);
        }
    }

    const canvas = document.getElementById('categoryBarChart');
    if (!canvas) return;

    const existing = Chart.getChart ? Chart.getChart(canvas) : null;
    if (existing) existing.destroy();

    if (!categories || categories.length === 0) {
        canvas.style.display = 'none';
        let noMsg = catBox.querySelector('.cat-no-data');
        if (!noMsg) {
            noMsg = document.createElement('p');
            noMsg.className = 'cat-no-data loading';
            noMsg.textContent = 'No expense data for this period.';
            catBox.appendChild(noMsg);
        }
        noMsg.style.display = 'block';
        return;
    }

    canvas.style.display = 'block';
    const noMsg = catBox.querySelector('.cat-no-data');
    if (noMsg) noMsg.style.display = 'none';

    const sorted = [...categories].sort((a, b) => b.total - a.total);

    // Compact bar height — 38px per row, minimum 140px total
    const barHeight   = 38;
    const chartHeight = Math.max(sorted.length * barHeight, 140);
    canvas.style.height = chartHeight + 'px';
    canvas.style.width  = '100%';

    new Chart(canvas, {
        type: 'bar',
        data: {
            labels: sorted.map(c => c.name),
            datasets: [{
                label: 'Amount Spent',
                data: sorted.map(c => parseFloat(c.total)),
                backgroundColor: sorted.map(c => c.color + 'cc'),
                borderColor:     sorted.map(c => c.color),
                borderWidth: 1.5,
                borderRadius: 5,
                borderSkipped: false,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(30,30,40,0.92)',
                    titleFont: { family: 'Poppins', size: 13 },
                    bodyFont:  { family: 'Poppins', size: 12 },
                    padding: 12,
                    cornerRadius: 10,
                    callbacks: {
                        label: ctx => ` RM ${ctx.parsed.x.toFixed(2)}  (${sorted[ctx.dataIndex].percentage.toFixed(1)}% of expenses)`,
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.04)' },
                    ticks: {
                        font: { family: 'Poppins', size: 11 },
                        callback: v => 'RM ' + v.toLocaleString(),
                        maxTicksLimit: 6,
                    }
                },
                y: {
                    grid: { display: false },
                    ticks: {
                        font: { family: 'Poppins', size: 11, weight: '500' },
                        padding: 4,
                    }
                }
            },
            animation: { duration: 900, easing: 'easeOutQuart' },
            layout: {
                padding: { top: 4, bottom: 4, left: 0, right: 10 }
            }
        }
    });
}

function renderTrendLine(trendData, period) {
    const showTrend = ['3months', '6months', 'year'].includes(period);

    let trendBox = document.getElementById('trend-line-box');

    if (!showTrend) {
        if (trendBox) trendBox.style.display = 'none';
        return;
    }

    if (!trendBox) {
        trendBox = document.createElement('div');
        trendBox.id        = 'trend-line-box';
        trendBox.className = 'chart-box';
        trendBox.style.cssText = 'grid-column:1/-1;';

        const h3 = document.createElement('h3');
        h3.textContent = 'Monthly Income vs Expenses Trend';
        trendBox.appendChild(h3);

        const canvas = document.createElement('canvas');
        canvas.id = 'trendLineCanvas';
        trendBox.appendChild(canvas);

        const catBox = document.getElementById('category-bar-box');
        if (catBox && catBox.parentNode) {
            catBox.parentNode.insertBefore(trendBox, catBox.nextSibling);
        }
    }

    trendBox.style.display = 'block';

    const canvas = document.getElementById('trendLineCanvas');
    if (!canvas) return;

    if (trendChart) { trendChart.destroy(); trendChart = null; }

    const labels   = trendData.labels   || [];
    const incomes  = trendData.income   || [];
    const expenses = trendData.expenses || [];
    const net      = incomes.map((v, i) => v - (expenses[i] || 0));

    trendChart = new Chart(canvas, {
        type: 'line',
        data: {
            labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomes,
                    borderColor: '#38a169',
                    backgroundColor: 'rgba(56,161,105,0.10)',
                    borderWidth: 2.5, tension: 0.4, fill: true,
                    pointRadius: 4, pointHoverRadius: 7,
                },
                {
                    label: 'Expenses',
                    data: expenses,
                    borderColor: '#e53e3e',
                    backgroundColor: 'rgba(229,62,62,0.08)',
                    borderWidth: 2.5, tension: 0.4, fill: true,
                    pointRadius: 4, pointHoverRadius: 7,
                },
                {
                    label: 'Net Savings',
                    data: net,
                    borderColor: '#667eea',
                    backgroundColor: 'transparent',
                    borderWidth: 2,
                    borderDash: [6, 4],
                    tension: 0.4,
                    fill: false,
                    pointBackgroundColor: net.map(v => v >= 0 ? '#38a169' : '#e53e3e'),
                    pointRadius: 5, pointHoverRadius: 8,
                },
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            interaction: { mode: 'index', intersect: false },
            plugins: {
                legend: {
                    position: 'top',
                    labels: { usePointStyle: true, padding: 18, font: { family: 'Poppins', size: 12 } }
                },
                tooltip: {
                    backgroundColor: 'rgba(30,30,40,0.92)',
                    titleFont: { family: 'Poppins', size: 13, weight: '600' },
                    bodyFont:  { family: 'Poppins', size: 12 },
                    padding: 12, cornerRadius: 10,
                    callbacks: {
                        label: ctx => ` ${ctx.dataset.label}: RM ${Math.abs(ctx.parsed.y).toFixed(2)}`,
                        afterBody: items => {
                            const n = net[items[0].dataIndex];
                            return ['─────────────', `${n >= 0 ? '✅ Saved' : '⚠️ Deficit'}: RM ${Math.abs(n).toFixed(2)}`];
                        }
                    }
                }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { family: 'Poppins', size: 11 } } },
                y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { font: { family: 'Poppins', size: 11 }, callback: v => 'RM ' + v.toLocaleString() }
                }
            }
        }
    });
}

function displayTopCategories(categories) {
    const container = document.getElementById('top-categories');
    if (!container) return;
    container.innerHTML = '';

    if (!categories || categories.length === 0) {
        container.innerHTML = '<p class="loading">No spending data</p>';
        return;
    }

    const maxAmt = Math.max(...categories.map(c => parseFloat(c.total)));

    categories.forEach((cat, index) => {
        const amt  = parseFloat(cat.total);
        const barW = maxAmt > 0 ? (amt / maxAmt) * 100 : 0;

        const item = document.createElement('div');
        item.className = 'category-stat';
        item.style.cssText = 'flex-direction:column;align-items:stretch;gap:6px;';
        item.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <span class="rank">#${index + 1}</span>
                    <span class="category-badge" style="background-color:${cat.color}">
                        <i class="fas ${cat.icon}"></i> ${cat.name}
                    </span>
                </div>
                <div style="text-align:right;">
                    <strong>RM ${amt.toFixed(2)}</strong>
                    <span class="percentage">${cat.percentage.toFixed(1)}%</span>
                </div>
            </div>
            <div style="height:6px;background:#f0f4f8;border-radius:6px;overflow:hidden;">
                <div style="height:100%;width:${barW}%;background:${cat.color};border-radius:6px;
                            transition:width 0.9s ease;"></div>
            </div>
        `;
        container.appendChild(item);
    });
}

function injectReportStyles() {
    // Styles are defined in style.css
}

function exportData() { window.location.href = 'export.php'; }