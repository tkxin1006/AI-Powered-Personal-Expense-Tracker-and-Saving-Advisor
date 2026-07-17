// Global variables
let budgets = []; // Store budgets data

// Check if user is a first-time user (no income recorded)
function checkFirstTimeUser() {
    return fetch('api.php?action=check_first_time_user')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                return data.is_first_time;
            }
            return false;
        })
        .catch(error => {
            console.error('Error checking first-time user:', error);
            return false;
        });
}

// Load budgets on page load
document.addEventListener('DOMContentLoaded', function() {
    loadBudgets();
    
    const budgetForm = document.getElementById('budget-form');
    if (budgetForm) {
        budgetForm.addEventListener('submit', handleBudgetSubmit);
    }
    
    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', handleAddCategorySubmit);
    }

    // Set up event listeners for the budget updater
    setupBudgetUpdateListeners();
});

// Set up event listeners for budget updates
function setupBudgetUpdateListeners() {
    // Listen for custom events from the budget updater
    document.addEventListener('transactionAdded', function() {
        console.log('Transaction added event received, updating budgets');
        loadBudgets();
    });

    document.addEventListener('transactionDeleted', function() {
        console.log('Transaction deleted event received, updating budgets');
        loadBudgets();
    });
}

// Load budgets
function loadBudgets() {
    fetch('api.php?action=get_budgets')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Sort: over-budget first → then by spent amount desc → then by budget amount desc
                data.data.sort((a, b) => {
                    const aOver = parseFloat(a.spent) > parseFloat(a.budget) && parseFloat(a.budget) > 0;
                    const bOver = parseFloat(b.spent) > parseFloat(b.budget) && parseFloat(b.budget) > 0;
                    if (aOver !== bOver) return aOver ? -1 : 1;           // over-budget floats up
                    const spentDiff = parseFloat(b.spent) - parseFloat(a.spent);
                    if (Math.abs(spentDiff) > 0.01) return spentDiff;     // higher spent next
                    return parseFloat(b.budget) - parseFloat(a.budget);   // higher budget last
                });
                displayBudgets(data.data);
                updateBudgetSummary(data.data);
                
                // Check if this is a first-time user
                checkFirstTimeUser().then(isFirstTime => {
                    if (isFirstTime) {
                        showFirstTimeUserMessage();
                    }
                });
            }
        })
        .catch(error => console.error('Error:', error));
}

// Show helpful message for first-time users
function showFirstTimeUserMessage() {
    const welcomeMessage = document.createElement('div');
    welcomeMessage.className = 'alert alert-info';
    welcomeMessage.id = 'first-time-user-message';
    welcomeMessage.innerHTML = `
        <i class="fas fa-info-circle"></i>
        <div>
            <h4>Welcome to Budget Management!</h4>
            <p>To get started:</p>
            <ol>
                <li>First, add your income using the "Add Income" button on the Dashboard</li>
                <li>Then, return here and use the "Smart Budget" button to automatically allocate your income across categories</li>
                <li>Or manually set budgets for each category by clicking the edit (pencil) icon</li>
            </ol>
            <button class="btn btn-sm btn-primary" onclick="document.getElementById('first-time-user-message').remove();">Got it!</button>
        </div>
    `;
    
    // Insert at the top of the budgets section
    const categoryBudgetsHeading = document.querySelector('h3:contains("Category Budgets")');
    if (categoryBudgetsHeading) {
        categoryBudgetsHeading.parentNode.insertBefore(welcomeMessage, categoryBudgetsHeading.nextSibling);
    } else {
        document.querySelector('.transactions-section').prepend(welcomeMessage);
    }
}

// Display budgets
function displayBudgets(budgetsData) {
    const container = document.getElementById('budget-list');
    container.innerHTML = '';
    
    // Store budgets globally for reference
    budgets = budgetsData;
    
    if (budgets.length === 0) {
        container.innerHTML = '<p class="loading">No budget categories found. Click "Add Category" to create one!</p>';
        return;
    }
    
    budgets.forEach(budget => {
        const percentage = budget.budget > 0 ? (budget.spent / budget.budget) * 100 : 0;
        const remaining = budget.budget - budget.spent;
        const isOverBudget = percentage > 100;

        // Progress bar: use category color normally, red only when over budget
        const barColor = isOverBudget ? '#e53e3e' : budget.color;
        // Track background: 15% opacity tint of the category color
        const trackColor = isOverBudget ? 'rgba(229,62,62,0.15)' : hexToRgba(budget.color, 0.15);

        const iconDisplay = (budget.icon.includes('/') || budget.icon.includes('.'))
            ? `<img src="${budget.icon}" style="width:14px; height:14px; object-fit:contain; vertical-align:middle; filter:brightness(0) invert(1);">`
            : `<i class="fas ${budget.icon}"></i>`;

        const budgetCard = document.createElement('div');
        budgetCard.className = 'budget-card';
        budgetCard.innerHTML = `
            <div class="budget-header">
                <div class="budget-info">
                    <span class="category-badge" style="background-color: ${budget.color}">
                        ${iconDisplay} ${budget.name}
                    </span>
                </div>
                <div class="budget-actions">
                    <button onclick="event.stopPropagation(); editBudget(${budget.id}, '${budget.name.replace(/'/g, "\\'")}', '${budget.icon}', '${budget.color}')" class="btn-edit" title="Edit Category">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="event.stopPropagation(); deleteCategory(${budget.id}, '${budget.name.replace(/'/g, "\\'")}')" class="btn-delete" title="Delete Category">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="budget-amounts clickable-row" onclick="viewCategoryExpenses(${budget.id}, '${budget.name.replace(/'/g, "\\'")}', '${budget.icon}', '${budget.color}')">
                <div>
                    <span class="label">Budget:</span>
                    <span class="amount">$${parseFloat(budget.budget).toFixed(2)}</span>
                </div>
                <div>
                    <span class="label">Spent:</span>
                    <span class="amount expense-color">$${parseFloat(budget.spent).toFixed(2)}</span>
                </div>
                <div>
                    <span class="label">Remaining:</span>
                    <span class="amount ${remaining >= 0 ? 'income-color' : 'expense-color'}">
                        $${Math.abs(remaining).toFixed(2)}
                    </span>
                </div>
            </div>
            <div class="progress-bar clickable-row" style="background-color: ${trackColor};" onclick="viewCategoryExpenses(${budget.id}, '${budget.name.replace(/'/g, "\\'")}', '${budget.icon}', '${budget.color}')">
                <div class="progress-fill ${isOverBudget ? 'over-budget' : ''}" style="width: ${Math.min(percentage, 100)}%; background-color: ${barColor}; background-image: none;"></div>
            </div>
            <p class="progress-text clickable-row" style="color: ${isOverBudget ? '#e53e3e' : budget.color}; font-weight: 500;" onclick="viewCategoryExpenses(${budget.id}, '${budget.name.replace(/'/g, "\\'")}', '${budget.icon}', '${budget.color}')">${percentage.toFixed(1)}% used ${isOverBudget ? '⚠️ (Over budget!)' : ''}</p>
        `;
        container.appendChild(budgetCard);
    });

    // Add a refresh indicator to show when budgets are updated
    const lastUpdated = document.createElement('div');
    lastUpdated.className = 'text-muted text-sm';
    lastUpdated.id = 'last-budget-update';
    lastUpdated.style.textAlign = 'center';
    lastUpdated.style.fontSize = '0.8rem';
    lastUpdated.style.marginTop = '20px';
    const now = new Date();
    lastUpdated.textContent = `Last updated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`;
    container.appendChild(lastUpdated);
}

// Update budget summary
function updateBudgetSummary(budgets) {
    let totalBudget = 0;
    let totalSpent = 0;
    
    budgets.forEach(budget => {
        totalBudget += parseFloat(budget.budget);
        totalSpent += parseFloat(budget.spent);
    });
    
    const remaining = totalBudget - totalSpent;
    
    document.getElementById('total-budget').textContent = '$' + totalBudget.toFixed(2);
    document.getElementById('total-spent').textContent = '$' + totalSpent.toFixed(2);
    document.getElementById('remaining-budget').textContent = '$' + remaining.toFixed(2);
}

// Edit budget (now includes budget amount, category name, icon, and color editing)
function editBudget(categoryId, categoryName, icon, color) {
    // Find the budget object for this category
    const budgetObj = budgets.find(b => b.id == categoryId);
    const budgetAmount = budgetObj ? parseFloat(budgetObj.budget) : 0;
    
    document.getElementById('category-id').value = categoryId;
    document.getElementById('category-name-edit').value = categoryName;
    document.getElementById('category-color-edit').value = color;
    document.getElementById('category-budget-edit').value = budgetAmount.toFixed(2);
    
    const isCustomFile = icon.includes('/') || icon.includes('.');
    if (isCustomFile) {
        document.querySelector('input[name="icon_source_edit"][value="file"]').checked = true;
        toggleIconSourceEdit('file');
        document.getElementById('category-icon-edit').value = '';
    } else {
        document.querySelector('input[name="icon_source_edit"][value="class"]').checked = true;
        toggleIconSourceEdit('class');
        document.getElementById('category-icon-edit').value = icon;
    }
    
    document.getElementById('budget-modal').classList.add('active');
}

// Close budget modal
function closeBudgetModal() {
    document.getElementById('budget-modal').classList.remove('active');
    document.getElementById('budget-form').reset();
}

// Handle budget form submit (update both name and budget)
function handleBudgetSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    fetch('api.php?action=update_budget', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeBudgetModal();
            loadBudgets();
            showNotification('Budget updated successfully!', 'success');
        } else {
            showNotification(data.message || 'Failed to update budget', 'error');
        }
    });
}

// Open add category modal
function openAddCategoryModal() {
    document.getElementById('add-category-modal').classList.add('active');
}

// Close add category modal
function closeAddCategoryModal() {
    document.getElementById('add-category-modal').classList.remove('active');
    document.getElementById('add-category-form').reset();
}

// Handle add category form submit
function handleAddCategorySubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    
    fetch('api.php?action=add_category', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeAddCategoryModal();
            loadBudgets();
            showNotification('Category added successfully!', 'success');
        } else {
            showNotification(data.message || 'Failed to add category', 'error');
        }
    });
}

// Delete category
function deleteCategory(categoryId, categoryName) {
    if (!confirm(`Are you sure you want to delete the category "${categoryName}"? This will also delete all transactions in this category.`)) {
        return;
    }
    
    const formData = new FormData();
    formData.append('category_id', categoryId);
    
    fetch('api.php?action=delete_category', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            loadBudgets();
            showNotification('Category deleted successfully!', 'success');
        } else {
            showNotification(data.message || 'Failed to delete category', 'error');
        }
    });
}

// View category expenses
function viewCategoryExpenses(categoryId, categoryName, icon, color) {
    const iconDisplay = (icon.includes('/') || icon.includes('.'))
        ? `<img src="${icon}" style="width:14px; height:14px; object-fit:contain; vertical-align:middle; filter:brightness(0) invert(1);">`
        : `<i class="fas ${icon}"></i>`;

    document.getElementById('category-expenses-title').innerHTML = `
        <span class="category-badge" style="background-color: ${color}">
            ${iconDisplay} ${categoryName}
        </span> - Expenses
    `;
    document.getElementById('category-expenses-modal').classList.add('active');
    document.getElementById('category-expenses-content').innerHTML = '<p class="loading">Loading expenses...</p>';
    
    // Fetch transactions for this category
    fetch(`api.php?action=get_category_expenses&category_id=${categoryId}`)
        .then(response => response.json())
        .then(data => {
            console.log('Category expenses response:', data); // Debug log
            if (data.success) {
                if (data.data && data.data.length > 0) {
                    displayCategoryExpenses(data.data);
                } else {
                    document.getElementById('category-expenses-content').innerHTML = 
                        '<p class="loading">No expenses found in this category</p>';
                }
            } else {
                document.getElementById('category-expenses-content').innerHTML = 
                    `<p class="loading">Error: ${data.message || 'Failed to load expenses'}</p>`;
            }
        })
        .catch(error => {
            console.error('Error loading category expenses:', error);
            document.getElementById('category-expenses-content').innerHTML = 
                '<p class="loading">Error loading expenses. Please try again.</p>';
        });
}

// Display category expenses
function displayCategoryExpenses(transactions) {
    const container = document.getElementById('category-expenses-content');
    
    if (transactions.length === 0) {
        container.innerHTML = '<p class="loading">No expenses found in this category</p>';
        return;
    }
    
    let html = '<div class="transactions-table"><table><thead><tr>';
    html += '<th>Date</th>';
    html += '<th>Description</th>';
    html += '<th>Amount</th>';
    html += '</tr></thead><tbody>';
    
    let total = 0;
    
    transactions.forEach(transaction => {
        // Parse and format date properly
        const date = new Date(transaction.date);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Parse amount properly
        const amount = parseFloat(transaction.amount) || 0;
        total += amount;
        
        html += '<tr>';
        html += `<td>${formattedDate}</td>`;
        html += `<td>${transaction.description || 'N/A'}</td>`;
        html += `<td class="expense-color">$${amount.toFixed(2)}</td>`;
        html += '</tr>';
    });
    
    html += '</tbody></table></div>';
    
    // Add total
    html += `<div style="margin-top: 20px; text-align: right; font-size: 18px; font-weight: 600;">
        <span style="color: var(--text-gray);">Total Spent:</span> 
        <span class="expense-color">$${total.toFixed(2)}</span>
    </div>`;
    
    container.innerHTML = html;
}

// Close category expenses modal
function closeCategoryExpensesModal() {
    document.getElementById('category-expenses-modal').classList.remove('active');
}

// Export data
function exportData() {
    window.location.href = 'export.php';
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to trigger a refresh of budget data
function refreshBudgets() {
    loadBudgets();
    showNotification('Budgets refreshed with latest data', 'success');
}

// Make the loadBudgets function globally accessible
window.loadBudgets = loadBudgets;
/**
 * Converts a hex color string to an rgba() string.
 * Supports 3-digit (#RGB) and 6-digit (#RRGGBB) hex formats.
 * Falls back to a neutral grey if the input is invalid.
 */
function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(108, 114, 128, ${alpha})`;
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h[0]+h[0] + h[1]+h[1] + h[2]+h[2];
    }
    if (h.length !== 6) return `rgba(108, 114, 128, ${alpha})`;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}