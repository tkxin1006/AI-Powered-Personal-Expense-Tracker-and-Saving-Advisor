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
    <title>Reports - Finance Tracker</title>
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
            <header class="page-header">
                <h1 class="page-title">
                    <i class="fas fa-chart-line"></i> Financial Reports
                </h1>
                <div class="header-actions">
                    <select id="report-period" onchange="loadReports()">
                        <option value="current">Current Month</option>
                        <option value="last">Last Month</option>
                        <option value="3months">Last 3 Months</option>
                        <option value="6months">Last 6 Months</option>
                        <option value="year">This Year</option>
                    </select>
                    <a href="logout.php" class="btn-logout" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                </div>
            </header>

            <!-- Summary Cards -->
            <div class="summary-grid">
                <div class="summary-card">
                    <div class="card-content">
                        <h3>Total Income</h3>
                        <h2 class="income-color" id="report-income">$0.00</h2>
                        <p>For selected period</p>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-content">
                        <h3>Total Expenses</h3>
                        <h2 class="expense-color" id="report-expenses">$0.00</h2>
                        <p>For selected period</p>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-content">
                        <h3>Net Savings</h3>
                        <h2 id="report-savings">$0.00</h2>
                        <p>Income - Expenses</p>
                    </div>
                </div>

                <div class="summary-card">
                    <div class="card-content">
                        <h3>Avg. Daily Spending</h3>
                        <h2 id="report-daily">$0.00</h2>
                        <p>Per day average</p>
                    </div>
                </div>
            </div>

            <!-- Charts -->
            <div class="charts-grid">
                <div class="chart-box">
                    <h3>Income vs Expenses Trend</h3>
                    <canvas id="trendChart"></canvas>
                </div>

                <div class="chart-box">
                    <h3>Expense Breakdown</h3>
                    <canvas id="expensePieChart"></canvas>
                </div>
            </div>

            <!-- Top Categories -->
            <div class="transactions-section">
                <h3>Top Spending Categories</h3>
                <div id="top-categories">
                    <p class="loading">Loading categories...</p>
                </div>
            </div>
        </main>
    </div>

    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="reports.js"></script>
</body>
</html>
