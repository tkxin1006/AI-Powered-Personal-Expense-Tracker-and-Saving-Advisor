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
    <title>Dashboard - Finance Tracker</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app-wrapper">
        <!-- Include the sidebar -->
        <?php include 'sidebar.php'; ?>

        <!-- Main Content -->
        <main class="main-container">
            <!-- Header -->
            <header class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-home"></i> Dashboard
                </h1>
                <div class="header-actions">
                    <button class="btn-add-income" onclick="openModal('income')">
                        <i class="fas fa-plus"></i> Add Income
                    </button>
                    <button class="btn-add-expense" onclick="openModal('expense')">
                        <i class="fas fa-minus"></i> Add Expense
                    </button>
                    <a href="logout.php" class="btn-logout" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                </div>
            </header>

            <!-- Summary Cards -->
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-content">
                        <h3>Total Balance</h3>
                        <h2 id="total-balance">$0.00</h2>
                        <p class="positive"><i class="fas fa-arrow-up"></i> Current month</p>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-content">
                        <h3>Monthly Income</h3>
                        <h2 class="income-color" id="monthly-income">$0.00</h2>
                        <p><i class="fas fa-calendar"></i> This month</p>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-content">
                        <h3>Monthly Expenses</h3>
                        <h2 class="expense-color" id="monthly-expenses">$0.00</h2>
                        <p><i class="fas fa-calendar"></i> This month</p>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-content">
                        <h3>Savings Rate</h3>
                        <h2 id="savings-rate">0%</h2>
                        <p>% of income</p>
                    </div>
                </div>
            </div>

            <div id="budget-allocation-message" style="display: none;" class="alert alert-success">
                <i class="fas fa-magic"></i> 
                <span>Income added! Budgets have been automatically allocated.</span>
                <a href="budgets.php" class="btn btn-sm btn-primary">View Budgets</a>
                <button class="close-btn" onclick="document.getElementById('budget-allocation-message').style.display = 'none';">&times;</button>
            </div>

            <!-- Add this script to app.js -->
            <script>
            // Check for recent income addition
            fetch('api.php?action=check_recent_income')
                .then(response => response.json())
                .then(data => {
                    if (data.success && data.has_recent_income) {
                        document.getElementById('budget-allocation-message').style.display = 'flex';
                    }
                });
            </script>

            <!-- Charts Section -->
            <div class="charts-grid">
                <div class="chart-box">
                    <h3>Income vs Expenses</h3>
                    <canvas id="incomeExpenseChart"></canvas>
                </div>

                <div class="chart-box">
                    <h3>Spending by Category</h3>
                    <canvas id="categoryChart"></canvas>
                </div>
            </div>

            <!-- Recent Transactions -->
            <div class="transactions-section">
                <h3>Recent Transactions</h3>
                <div id="recent-transactions">
                    <p class="loading">Loading...</p>
                </div>
            </div>
        </main>
    </div>

    <!-- Modal -->
    <div class="modal" id="transaction-modal">
        <div class="modal-backdrop" onclick="closeModal()"></div>
        <div class="modal-dialog">
            <div class="modal-header">
                <h2 id="modal-title">Add Transaction</h2>
                <button onclick="closeModal()" class="close-btn">&times;</button>
            </div>
            <form id="transaction-form">
                <input type="hidden" id="transaction-type" name="type">
                <div class="form-group">
                    <label>Amount ($)</label>
                    <input type="number" id="amount" name="amount" step="0.01" min="0.01" required>
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input type="text" id="description" name="description" required>
                </div>
                <div class="form-group">
                    <label>Category</label>
                    <select id="category" name="category_id" required>
                        <option value="">Select category</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Date</label>
                    <input type="date" id="date" name="transaction_date" required>
                </div>
                <button type="submit" class="btn-primary btn-block">
                    <i class="fas fa-save"></i> Save Transaction
                </button>
            </form>
        </div>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="app.js"></script>
    <script>
        function exportData() {
            window.location.href = 'export.php';
        }
    </script>
</body>
</html>