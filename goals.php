<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

$user_id = $_SESSION['user_id'];
$username = $_SESSION['username'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Savings Goals - Finance Tracker</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="main-container">
            <header class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-bullseye"></i> Savings Goals
                </h1>
                <div class="header-actions">
                    <button class="btn-add-income" onclick="openGoalModal()">
                        <i class="fas fa-plus"></i> New Goal
                    </button>
                    <a href="logout.php" class="btn-logout" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                </div>
            </header>

            <div class="goals-overview" id="goals-overview">
                <div class="overview-card">
                    <div class="ov-label">Total Saved</div>
                    <div class="ov-value income-color" id="ov-saved">$0.00</div>
                    <div class="ov-sub">Across all goals</div>
                </div>
                <div class="overview-card">
                    <div class="ov-label">Total Target</div>
                    <div class="ov-value" id="ov-target">$0.00</div>
                    <div class="ov-sub">Combined targets</div>
                </div>
                <div class="overview-card">
                    <div class="ov-label">Goals Completed</div>
                    <div class="ov-value" id="ov-completed">0</div>
                    <div class="ov-sub" id="ov-completed-sub">of 0 goals</div>
                </div>
                <div class="overview-card">
                    <div class="ov-label">Overall Progress</div>
                    <div class="ov-value" id="ov-progress">0%</div>
                    <div class="ov-sub">Across all goals</div>
                </div>
            </div>

            <div class="goals-grid" id="goals-grid">
                <p class="loading">Loading goals...</p>
            </div>
        </main>
    </div>

    <div class="modal" id="goal-modal">
        <div class="modal-backdrop" onclick="closeGoalModal()"></div>
        <div class="modal-dialog">
            <div class="modal-header">
                <h2 id="goal-modal-title">New Savings Goal</h2>
                <button onclick="closeGoalModal()" class="close-btn">&times;</button>
            </div>
            <form id="goal-form" style="padding:24px 30px;">
                <input type="hidden" id="goal-id" name="goal_id">
                <div class="form-group">
                    <label><i class="fas fa-tag"></i> Goal Name</label>
                    <input type="text" id="goal-name" name="name" placeholder="e.g. Emergency Fund, New Laptop, Holiday Trip" required>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div class="form-group">
                        <label><i class="fas fa-flag"></i> Target Amount ($)</label>
                        <input type="number" id="goal-target" name="target_amount" step="0.01" min="1" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-piggy-bank"></i> Already Saved ($)</label>
                        <input type="number" id="goal-current" name="current_amount" step="0.01" min="0" value="0">
                    </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                    <div class="form-group">
                        <label><i class="fas fa-calendar"></i> Target Date</label>
                        <input type="date" id="goal-date" name="target_date" required>
                    </div>
                    <div class="form-group">
                        <label><i class="fas fa-palette"></i> Color Theme</label>
                        <select id="goal-color" name="color">
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="amber">Amber</option>
                            <option value="teal">Teal</option>
                            <option value="rose">Rose</option>
                            <option value="purple">Purple</option>
                        </select>
                    </div>
                </div>
                <div class="form-group">
                    <label><i class="fas fa-sticky-note"></i> Notes (optional)</label>
                    <input type="text" id="goal-notes" name="notes" placeholder="Why is this goal important to you?">
                </div>
                <button type="submit" class="btn-primary btn-block">
                    <i class="fas fa-save"></i> Save Goal
                </button>
            </form>
        </div>
    </div>

    <div class="modal" id="contribute-modal">
        <div class="modal-backdrop" onclick="closeContributeModal()"></div>
        <div class="modal-dialog">
            <div class="modal-header">
                <h2 id="contribute-modal-title">Add Contribution</h2>
                <button onclick="closeContributeModal()" class="close-btn">&times;</button>
            </div>
            <div class="contribute-modal-content">
                <input type="hidden" id="contribute-goal-id">

                <div class="form-group">
                    <label><i class="fas fa-dollar-sign"></i> Contribution Amount ($)</label>
                    <input type="number" id="contribute-amount" step="0.01" min="0.01"
                           placeholder="0.00" oninput="updateImpactPreview()">
                </div>

                <div class="form-group">
                    <label><i class="fas fa-wallet"></i> Source of Funds</label>
                    <select id="contribute-source" onchange="updateSourceInfo()">
                        <option value="balance">Available Balance</option>
                        <!-- <option value="manual">Manual / Cash Deposit</option> -->
                    </select>
                    <div class="source-info" id="source-info">This will be recorded as an expense transaction and deducted from your balance.</div>
                </div>

                <div class="form-group">
                    <label><i class="fas fa-sticky-note"></i> Note (optional)</label>
                    <input type="text" id="contribute-note" placeholder="e.g. Monthly saving, bonus allocation...">
                </div>

                <div class="impact-preview" id="impact-preview">
                    <p style="font-size:12px;font-weight:600;color:var(--text-gray);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px;">Financial Impact</p>
                    <div class="impact-row">
                        <span class="ir-label">Goal progress after</span>
                        <span class="ir-value good" id="ip-progress">—</span>
                    </div>
                    <div class="impact-row">
                        <span class="ir-label">Remaining to goal</span>
                        <span class="ir-value" id="ip-remaining">—</span>
                    </div>
                    <div class="impact-row" id="ip-balance-row">
                        <span class="ir-label">Balance after deduction</span>
                        <span class="ir-value" id="ip-balance">—</span>
                    </div>
                    <div class="impact-row">
                        <span class="ir-label">Estimated completion</span>
                        <span class="ir-value" id="ip-completion">—</span>
                    </div>
                </div>

                <button onclick="submitContribution()" class="btn-primary btn-block" style="margin-top:18px;">
                    <i class="fas fa-plus-circle"></i> Save Contribution
                </button>
            </div>
        </div>
    </div>

    <script src="goals.js"></script>
</body>
</html>