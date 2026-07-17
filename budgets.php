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
    <title>Budgets - Finance Tracker</title>
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
                    <i class="fas fa-wallet"></i> Budget Management
                </h1>
                <div class="header-actions">
                    <button class="btn-add-income" onclick="openAddCategoryModal()">
                        <i class="fas fa-plus"></i> Add Category
                    </button>
                    <a href="logout.php" class="btn-logout" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                </div>
            </header>

            <!-- Budget Summary -->
            <div class="budget-summary">
                <div class="summary-card">
                    <h3>Total Budget</h3>
                    <h2 id="total-budget">$0.00</h2>
                </div>
                <div class="summary-card">
                    <h3>Total Spent</h3>
                    <h2 class="expense-color" id="total-spent">$0.00</h2>
                </div>
                <div class="summary-card">
                    <h3>Remaining</h3>
                    <h2 class="income-color" id="remaining-budget">$0.00</h2>
                </div>
            </div>

            <!-- Budget Categories -->
            <div class="transactions-section">
                <h3>Category Budgets</h3>
                <div id="budget-list">
                    <p class="loading">Loading budgets...</p>
                </div>
            </div>
        </main>
    </div>

    <!-- Edit Budget Modal -->
    <div class="modal" id="budget-modal">
        <div class="modal-backdrop" onclick="closeBudgetModal()"></div>
        <div class="modal-dialog">
            <div class="modal-header">
                <h2>Edit Budget Category</h2>
                <button onclick="closeBudgetModal()" class="close-btn">&times;</button>
            </div>
            <form id="budget-form">
                <input type="hidden" id="category-id" name="category_id">
                <div class="form-group">
                    <label>Category Name</label>
                    <input type="text" id="category-name-edit" name="category_name" required>
                </div>
                <div class="form-group">
                    <label>Monthly Budget ($)</label>
                    <input type="number" id="category-budget-edit" name="budget" min="0" step="0.01" required>
                </div>
                <div class="form-group">
                    <label>Icon (Font Awesome class)</label>
                    <input type="text" id="category-icon-edit" name="icon" required>
                    <small style="color: var(--text-gray); font-size: 12px; display: block; margin-top: 5px;">
                        Browse icons at <a href="https://fontawesome.com/icons" target="_blank" style="color: var(--primary-blue);">fontawesome.com</a>
                    </small>
                </div>
                <div class="form-group">
                    <label>Color</label>
                    <select id="category-color-edit" name="color" required>
                        <option value="#FF6384">Red</option>
                        <option value="#36A2EB">Blue</option>
                        <option value="#FFCE56">Yellow</option>
                        <option value="#4BC0C0">Teal</option>
                        <option value="#9966FF">Purple</option>
                        <option value="#FF9F40">Orange</option>
                        <option value="#00CC99">Green</option>
                        <option value="#FF6B6B">Light Red</option>
                        <option value="#5bc0de">Light Blue</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary btn-block">
                    <i class="fas fa-save"></i> Save Changes
                </button>
            </form>
        </div>
    </div>

    <!-- Add Category Modal -->
    <div class="modal" id="add-category-modal">
        <div class="modal-backdrop" onclick="closeAddCategoryModal()"></div>
        <div class="modal-dialog" style="max-width: 520px;">
            <div class="modal-header" style="padding: 22px 28px; border-bottom: 1px solid #f0f0f0;">
                <h2 style="font-size: 20px; font-weight: 700; color: #1a1a2e; display: flex; align-items: center; gap: 10px;">
                    Add New Category
                </h2>
                <button onclick="closeAddCategoryModal()" class="close-btn" style="font-size: 22px; color: #999; transition: color 0.2s;" onmouseover="this.style.color='#e53e3e'" onmouseout="this.style.color='#999'">&times;</button>
            </div>
            <form id="add-category-form" style="padding: 24px 28px;">

                <!-- Category Name -->
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-tag" style="color: #5b7cff; font-size: 12px;"></i> Category Name
                    </label>
                    <input type="text" id="new-category-name" name="category_name"
                        placeholder="e.g., Travel, Gifts, Healthcare"
                        required
                        style="width: 100%; padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 14px; font-family: 'Poppins', sans-serif; transition: all 0.2s; outline: none;"
                        onfocus="this.style.borderColor='#5b7cff'; this.style.boxShadow='0 0 0 3px rgba(91,124,255,0.12)'"
                        onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                </div>

                <!-- Type -->
                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 10px; display: flex; align-items: center; gap: 6px;">
                        <i class="fas fa-exchange-alt" style="color: #5b7cff; font-size: 12px;"></i> Type
                    </label>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <label id="type-expense-label" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; border: 2px solid #5b7cff; border-radius: 10px; cursor: pointer; background: rgba(91,124,255,0.06); transition: all 0.2s;">
                            <input type="radio" name="type" value="expense" checked style="display:none;" onchange="updateTypeStyle()">
                            <span style="width: 32px; height: 32px; background: linear-gradient(135deg, #ff6b6b, #ee5a24); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <i class="fas fa-arrow-down" style="color: white; font-size: 13px;"></i>
                            </span>
                            <div>
                                <div style="font-size: 13px; font-weight: 600; color: #1a1a2e;">Expense</div>
                                <div style="font-size: 11px; color: #9ca3af;">Money going out</div>
                            </div>
                        </label>
                        <label id="type-income-label" style="display: flex; align-items: center; gap: 10px; padding: 12px 16px; border: 2px solid #e5e7eb; border-radius: 10px; cursor: pointer; background: white; transition: all 0.2s;">
                            <input type="radio" name="type" value="income" style="display:none;" onchange="updateTypeStyle()">
                            <span style="width: 32px; height: 32px; background: linear-gradient(135deg, #06d6a0, #2d6a4f); border-radius: 8px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                                <i class="fas fa-arrow-up" style="color: white; font-size: 13px;"></i>
                            </span>
                            <div>
                                <div style="font-size: 13px; font-weight: 600; color: #1a1a2e;">Income</div>
                                <div style="font-size: 11px; color: #9ca3af;">Money coming in</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Icon & Color side by side -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px;">
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-icons" style="color: #5b7cff; font-size: 12px;"></i> Icon Class
                        </label>
                        <input type="text" id="new-category-icon" name="icon"
                            placeholder="fa-folder"
                            value="fa-folder"
                            required
                            style="width: 100%; padding: 11px 14px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 13px; font-family: 'Poppins', sans-serif; transition: all 0.2s; outline: none;"
                            onfocus="this.style.borderColor='#5b7cff'; this.style.boxShadow='0 0 0 3px rgba(91,124,255,0.12)'"
                            onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                        <small style="color: #9ca3af; font-size: 11px; display: block; margin-top: 5px;">
                            <a href="https://fontawesome.com/icons" target="_blank" style="color: #5b7cff; text-decoration: none;">Browse icons ↗</a>
                        </small>
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="font-size: 13px; font-weight: 600; color: #374151; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
                            <i class="fas fa-palette" style="color: #5b7cff; font-size: 12px;"></i> Color
                        </label>
                        <div style="position: relative;">
                            <select id="new-category-color" name="color" required
                                onchange="updateColorPreview(this)"
                                style="width: 100%; padding: 11px 14px 11px 42px; border: 1.5px solid #e5e7eb; border-radius: 10px; font-size: 13px; font-family: 'Poppins', sans-serif; appearance: none; background: white; cursor: pointer; transition: all 0.2s; outline: none;"
                                onfocus="this.style.borderColor='#5b7cff'; this.style.boxShadow='0 0 0 3px rgba(91,124,255,0.12)'"
                                onblur="this.style.borderColor='#e5e7eb'; this.style.boxShadow='none'">
                                <option value="#FF6B35">Orange-Red</option>
                                <option value="#00B4D8">Cyan Blue</option>
                                <option value="#FFCE56">Golden Yellow</option>
                                <option value="#7B2FBE">Violet</option>
                                <option value="#2EC4B6">Teal Green</option>
                                <option value="#E63946">Crimson</option>
                                <option value="#F4A261">Sandy Orange</option>
                                <option value="#3A86FF">Royal Blue</option>
                                <option value="#D62828">Deep Rose</option>
                                <option value="#6B7280">Grey</option>
                                <option value="#2D6A4F">Forest Green</option>
                                <option value="#06D6A0">Mint Green</option>
                                <option value="#118AB2">Steel Blue</option>
                                <option value="#FFD166">Warm Gold</option>
                                <option value="#9B5DE5">Lavender</option>
                            </select>
                            <span id="color-dot" style="position: absolute; left: 14px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; border-radius: 50%; background: #FF6B35; pointer-events: none; border: 2px solid white; box-shadow: 0 1px 4px rgba(0,0,0,0.2);"></span>
                        </div>
                    </div>
                </div>

                <!-- Submit -->
                <button type="submit"
                    style="width: 100%; padding: 13px; background: #3b82f6; color: white; border: none; border-radius: 10px; font-size: 14px; font-weight: 600; font-family: 'Poppins', sans-serif; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.1);"
                    onmouseover="this.style.background='#2563eb'; this.style.transform='translateY(-1px)'"
                    onmouseout="this.style.background='#3b82f6'; this.style.transform='translateY(0)'">
                    <i class="fas fa-plus"></i> Add Category
                </button>
            </form>
        </div>
    </div>

    <script>
    function updateColorPreview(select) {
        const dot = document.getElementById('color-dot');
        if (dot) dot.style.background = select.value;
    }
    function updateTypeStyle() {
        const expVal = document.querySelector('input[name="type"][value="expense"]');
        const incVal = document.querySelector('input[name="type"][value="income"]');
        const expLabel = document.getElementById('type-expense-label');
        const incLabel = document.getElementById('type-income-label');
        if (!expVal || !incVal) return;
        if (expVal.checked) {
            expLabel.style.borderColor = '#5b7cff';
            expLabel.style.background = 'rgba(91,124,255,0.06)';
            incLabel.style.borderColor = '#e5e7eb';
            incLabel.style.background = 'white';
        } else {
            incLabel.style.borderColor = '#5b7cff';
            incLabel.style.background = 'rgba(91,124,255,0.06)';
            expLabel.style.borderColor = '#e5e7eb';
            expLabel.style.background = 'white';
        }
    }
    // Attach radio change listeners after DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('input[name="type"]').forEach(r => r.addEventListener('change', updateTypeStyle));
    });
    </script>

    <!-- Category Expenses Modal -->
    <div class="modal" id="category-expenses-modal">
        <div class="modal-backdrop" onclick="closeCategoryExpensesModal()"></div>
        <div class="modal-dialog" style="max-width: 800px;">
            <div class="modal-header">
                <h2 id="category-expenses-title">Category Expenses</h2>
                <button onclick="closeCategoryExpensesModal()" class="close-btn">&times;</button>
            </div>
            <div style="padding: 30px;">
                <div id="category-expenses-content">
                    <p class="loading">Loading expenses...</p>
                </div>
            </div>
        </div>
    </div>

    <script src="budgets.js"></script>
    <script src="auto-budget-allocator.js"></script>
</body>
</html>