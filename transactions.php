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
    <title>Transactions - Finance Tracker</title>
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
                    <i class="fas fa-exchange-alt"></i> Transactions
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

            <!-- Filters -->
            <div class="filter-section">
                <div class="filter-group">
                    <label>Type</label>
                    <select id="filter-type" onchange="filterTransactions()">
                        <option value="">All</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Category</label>
                    <select id="filter-category" onchange="filterTransactions()">
                        <option value="">All Categories</option>
                    </select>
                </div>
                <div class="filter-group">
                    <label>Month</label>
                    <select id="filter-month" onchange="filterTransactions()">
                        <option value="">All Months</option>
                        <option value="1">January</option>
                        <option value="2">February</option>
                        <option value="3">March</option>
                        <option value="4">April</option>
                        <option value="5">May</option>
                        <option value="6">June</option>
                        <option value="7">July</option>
                        <option value="8">August</option>
                        <option value="9">September</option>
                        <option value="10">October</option>
                        <option value="11">November</option>
                        <option value="12">December</option>
                    </select>
                </div>
            </div>

            <!-- Transactions Table -->
            <div class="transactions-section">
                <div class="transactions-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Type</th>
                                <th>Amount</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody id="transactions-tbody">
                            <tr>
                                <td colspan="6" class="loading">Loading transactions...</td>
                            </tr>
                        </tbody>
                    </table>
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
                    <input type="date" id="date" name="transaction_date" required value="<?php echo date('Y-m-d'); ?>">
                </div>
                <button type="submit" class="btn-primary btn-block">
                    <i class="fas fa-save"></i> Save Transaction
                </button>
            </form>
        </div>
    </div>

    <script src="malaysian-category-patterns.js"></script>
    <script src="category-detector.js"></script>
    <script src="transactions-enhanced.js"></script>
</body>
</html>
