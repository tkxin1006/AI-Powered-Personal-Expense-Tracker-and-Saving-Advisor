<?php
// This file contains the sidebar component that can be included in all pages
// It requires that $user_id and $username are already defined in the parent file
// It also detects the current page to highlight the active menu item

// Get the current page filename
$current_page = basename($_SERVER['PHP_SELF']);
?>

<!-- Sidebar -->
<aside class="sidebar">
    <div class="sidebar-header">
        <div class="user-avatar">
            <i class="fas fa-user"></i>
        </div>
        <h3>Welcome, <?php echo htmlspecialchars($username); ?>!</h3>
    </div>

    <nav class="sidebar-nav">
        <a href="dashboard.php" class="nav-item <?php echo ($current_page == 'dashboard.php') ? 'active' : ''; ?>">
            <i class="fas fa-home"></i>
            <span>Dashboard</span>
        </a>
        <a href="transactions.php" class="nav-item <?php echo ($current_page == 'transactions.php') ? 'active' : ''; ?>">
            <i class="fas fa-exchange-alt"></i>
            <span>Transactions</span>
        </a>
        <a href="budgets.php" class="nav-item <?php echo ($current_page == 'budgets.php') ? 'active' : ''; ?>">
            <i class="fas fa-wallet"></i>
            <span>Budgets</span>
        </a>
        <a href="reports.php" class="nav-item <?php echo ($current_page == 'reports.php') ? 'active' : ''; ?>">
            <i class="fas fa-chart-line"></i>
            <span>Reports</span>
        </a>
        <a href="goals.php" class="nav-item <?php echo ($current_page == 'goals.php') ? 'active' : ''; ?>">
            <i class="fas fa-bullseye"></i>
            <span>Savings Goals</span>
        </a>
        <a href="ai-chat.php" class="nav-item <?php echo ($current_page == 'ai-chat.php') ? 'active' : ''; ?>">
            <i class="fas fa-robot"></i>
            <span>AI Assistant</span>
        </a>
    </nav>

    <div class="sidebar-footer">
        <button class="export-btn" onclick="exportData()">
            <i class="fas fa-download"></i> <span>Export Data</span>
        </button>
    </div>
</aside>
