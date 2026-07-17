/**
 * Smart Budget Allocator
 * Automatically calculates budget allocations based on user income and spending patterns
 */

// Default budget allocation percentages (for new users with no history)
const DEFAULT_BUDGET_PERCENTAGES = {
    'Food & Drinks'             : 20,   // 20% of income
    'Transport'                 : 10,   // 10% of income
    'Housing & Utilities'       : 30,   // 30% of income
    'Shopping'                  : 10,   // 10% of income
    'Entertainment & Lifestyle' : 5,    // 5%  of income
    'Healthcare'                : 5,    // 5%  of income
    'Education'                 : 3,    // 3%  of income
    'Financial & Obligations'   : 15,   // 15% of income
    'Donations & Gifts'         : 2,    // 2%  of income
    'Miscellaneous'             : 0,    // flexible / unallocated
};

// Load the Smart Budget feature on page load
document.addEventListener('DOMContentLoaded', function() {
    // Add Smart Budget button to the budgets page
    const addCategoryButton = document.querySelector('.btn-primary[onclick="openAddCategoryModal()"]');
    if (addCategoryButton) {
        const smartBudgetButton = document.createElement('button');
        smartBudgetButton.className = 'btn btn-secondary';
        smartBudgetButton.innerHTML = '<i class="fas fa-magic"></i> Smart Budget';
        smartBudgetButton.style.marginRight = '10px';
        smartBudgetButton.addEventListener('click', openSmartBudgetModal);
        
        addCategoryButton.parentNode.insertBefore(smartBudgetButton, addCategoryButton);
    }
    
    // Create the Smart Budget modal
    createSmartBudgetModal();
});

// Create Smart Budget modal HTML
function createSmartBudgetModal() {
    // Check if modal already exists
    if (document.getElementById('smart-budget-modal')) {
        return;
    }
    
    const modalHTML = `
    <div id="smart-budget-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2><i class="fas fa-magic"></i> Smart Budget Allocation</h2>
                <span class="close" onclick="closeSmartBudgetModal()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle"></i> 
                    Smart Budget helps you allocate your monthly income across expense categories automatically.
                </div>
                
                <div class="form-group">
                    <label for="total-available-funds"><i class="fas fa-wallet"></i> Total Available Funds</label>
                    <div class="form-group-info">
                        <input type="number" id="total-available-funds" readonly>
                        <p class="help-text">Current month's income plus remaining balance from last month</p>
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="allocation-method"><i class="fas fa-sliders-h"></i> Allocation Method</label>
                    <select id="allocation-method">
                        <option value="balanced">Balanced (Recommended)</option>
                        <option value="savings-focused">Savings Focused</option>
                        <option value="spending-focused">Spending Focused</option>
                        <option value="history-based">Based on Spending History</option>
                    </select>
                </div>
                
                <div id="allocation-preview">
                    <h3>Budget Allocation Preview</h3>
                    <div id="allocation-list"></div>
                    <div class="summary-row">
                        <span>Total Budget:</span>
                        <span id="total-allocation">$0.00</span>
                    </div>
                    <div class="summary-row">
                        <span>Unallocated (Savings):</span>
                        <span id="unallocated-funds">$0.00</span>
                    </div>
                </div>
                
                <div class="form-group">
                    <div class="custom-control">
                        <input type="checkbox" id="adjust-existing-budgets" checked>
                        <label for="adjust-existing-budgets">Adjust existing budget categories</label>
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn btn-secondary" onclick="closeSmartBudgetModal()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="applySmartBudget()">Apply Smart Budget</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Add modal to the body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
    
    // Styles are defined in style.css
}

// Open the Smart Budget modal
function openSmartBudgetModal() {
    // Get current month's income and balance
    fetchFinancialData()
        .then(data => {
            const { income, balance, categories } = data;
            
            // Check if the user has any income
            if (income <= 0) {
                showNoIncomeMessage();
                return;
            }
            
            // Set the total available funds (income + any positive balance)
            const availableFunds = income + (balance > 0 ? balance : 0);
            document.getElementById('total-available-funds').value = availableFunds.toFixed(2);
            
            // Generate budget allocation preview based on default method
            generateAllocationPreview('balanced', availableFunds, categories);
            
            // Add event listener to method selector
            document.getElementById('allocation-method').addEventListener('change', function() {
                generateAllocationPreview(this.value, availableFunds, categories);
            });
            
            // Show the modal
            document.getElementById('smart-budget-modal').classList.add('active');
        })
        .catch(error => {
            console.error('Error fetching financial data:', error);
            showNotification('Error loading financial data. Please try again.', 'error');
        });
}

// Show message when trying to use Smart Budget without income
function showNoIncomeMessage() {
    showNotification('Please add income first before using Smart Budget.', 'info');
    
    // Create a more detailed popup
    const modalHTML = `
    <div id="no-income-modal" class="modal active">
        <div class="modal-backdrop" onclick="document.getElementById('no-income-modal').remove()"></div>
        <div class="modal-dialog">
            <div class="modal-header">
                <h2><i class="fas fa-info-circle"></i> Income Required</h2>
                <button onclick="document.getElementById('no-income-modal').remove()" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="alert alert-info">
                    <p>Smart Budget needs income information to allocate funds to your categories.</p>
                    
                    <h4>Steps to set up your budget:</h4>
                    <ol>
                        <li>Go to the <strong>Dashboard</strong> and click "Add Income"</li>
                        <li>Enter your income details (salary, freelance, etc.)</li>
                        <li>Return to the Budgets page</li>
                        <li>Use Smart Budget to automatically allocate funds based on your income</li>
                    </ol>
                    
                    <p>Once you've added income, you'll be able to use Smart Budget to manage your expenses effectively!</p>
                </div>
                
                <div class="form-actions">
                    <a href="dashboard.php" class="btn btn-primary">
                        <i class="fas fa-arrow-right"></i> Go to Dashboard
                    </a>
                    <button type="button" class="btn btn-secondary" onclick="document.getElementById('no-income-modal').remove()">Close</button>
                </div>
            </div>
        </div>
    </div>
    `;
    
    // Add modal to the body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer);
}

// Close the Smart Budget modal
function closeSmartBudgetModal() {
    document.getElementById('smart-budget-modal').classList.remove('active');
}

// Fetch the current financial data needed for calculations
async function fetchFinancialData() {
    try {
        // Get current month's income
        const summaryResponse = await fetch('api.php?action=get_summary');
        const summaryData = await summaryResponse.json();
        
        if (!summaryData.success) {
            throw new Error('Failed to fetch summary data');
        }
        
        const income = summaryData.data.income;
        const balance = summaryData.data.balance;
        
        // Get current budget categories
        const budgetsResponse = await fetch('api.php?action=get_budgets');
        const budgetsData = await budgetsResponse.json();
        
        if (!budgetsData.success) {
            throw new Error('Failed to fetch budget data');
        }
        
        // Get spending history (last 3 months)
        const reportsResponse = await fetch('api.php?action=get_reports&period=3months');
        const reportsData = await reportsResponse.json();
        
        const categories = budgetsData.data;
        
        // Add spending history data to categories if available
        if (reportsData.success && reportsData.data.categories) {
            const spendingByCategory = {};
            reportsData.data.categories.forEach(cat => {
                spendingByCategory[cat.name] = cat.total;
            });
            
            categories.forEach(category => {
                category.historical_spending = spendingByCategory[category.name] || 0;
            });
        }
        
        return {
            income,
            balance,
            categories
        };
    } catch (error) {
        console.error('Error fetching data:', error);
        throw error;
    }
}

// Generate budget allocation preview based on selected method
function generateAllocationPreview(method, availableFunds, categories) {
    const allocationList = document.getElementById('allocation-list');
    allocationList.innerHTML = '';
    
    let allocations = [];
    let totalAllocated = 0;
    
    // Generate allocations based on selected method
    switch(method) {
        case 'balanced':
            allocations = generateBalancedAllocation(availableFunds, categories);
            break;
        case 'savings-focused':
            allocations = generateSavingsFocusedAllocation(availableFunds, categories);
            break;
        case 'spending-focused':
            allocations = generateSpendingFocusedAllocation(availableFunds, categories);
            break;
        case 'history-based':
            allocations = generateHistoryBasedAllocation(availableFunds, categories);
            break;
        default:
            allocations = generateBalancedAllocation(availableFunds, categories);
    }
    
    // Sort allocations by amount (descending)
    allocations.sort((a, b) => b.amount - a.amount);
    
    // Create allocation items
    allocations.forEach(allocation => {
        const item = document.createElement('div');
        item.className = 'allocation-item';
        
        totalAllocated += allocation.amount;
        
        const percentage = (allocation.amount / availableFunds) * 100;
        
        item.innerHTML = `
            <div class="category">
                <span class="category-badge" style="background-color: ${allocation.color}">
                    <i class="fas ${allocation.icon}"></i>
                </span>
                <span>${allocation.name}</span>
                <span class="percentage">(${percentage.toFixed(1)}%)</span>
            </div>
            <div class="amount">$${allocation.amount.toFixed(2)}</div>
        `;
        
        allocationList.appendChild(item);
    });
    
    // Update summary
    document.getElementById('total-allocation').textContent = `$${totalAllocated.toFixed(2)}`;
    
    const unallocated = availableFunds - totalAllocated;
    document.getElementById('unallocated-funds').textContent = `$${unallocated.toFixed(2)}`;
    
    // Store allocations for later use
    window.currentAllocations = allocations;
}

// Generate balanced allocation (most categories get funding)
function generateBalancedAllocation(availableFunds, categories) {
    const allocations = [];
    const numCategories = categories.length;
    
    // Allocate based on default percentages, adjusted for available funds
    categories.forEach(category => {
        const defaultPercentage = DEFAULT_BUDGET_PERCENTAGES[category.name] || 100 / numCategories;
        const amount = (availableFunds * (defaultPercentage / 100)) * 0.9; // Use 90% of calculated amount to leave some savings
        
        allocations.push({
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
            percentage: defaultPercentage
        });
    });
    
    return allocations;
}

// Generate savings-focused allocation (minimum necessary amounts)
function generateSavingsFocusedAllocation(availableFunds, categories) {
    const allocations = [];
    let totalPercentage = 0;
    
    // Reduce all default percentages by 30%
    categories.forEach(category => {
        const defaultPercentage = DEFAULT_BUDGET_PERCENTAGES[category.name] || 10;
        const reducedPercentage = defaultPercentage * 0.7; // 30% reduction
        totalPercentage += reducedPercentage;
        
        const amount = availableFunds * (reducedPercentage / 100);
        
        allocations.push({
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            amount: Math.round(amount * 100) / 100,
            percentage: reducedPercentage
        });
    });
    
    return allocations;
}

// Generate spending-focused allocation (maximize budget usage)
function generateSpendingFocusedAllocation(availableFunds, categories) {
    const allocations = [];
    
    // Increase all default percentages by 10% but ensure total doesn't exceed 100%
    let totalPercentage = 0;
    categories.forEach(category => {
        const defaultPercentage = DEFAULT_BUDGET_PERCENTAGES[category.name] || 10;
        const increasedPercentage = defaultPercentage * 1.1; // 10% increase
        totalPercentage += increasedPercentage;
    });
    
    // Adjustment factor if total exceeds 100%
    const adjustmentFactor = totalPercentage > 100 ? 100 / totalPercentage : 1;
    
    categories.forEach(category => {
        const defaultPercentage = DEFAULT_BUDGET_PERCENTAGES[category.name] || 10;
        const adjustedPercentage = (defaultPercentage * 1.1) * adjustmentFactor;
        
        const amount = availableFunds * (adjustedPercentage / 100);
        
        allocations.push({
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            amount: Math.round(amount * 100) / 100,
            percentage: adjustedPercentage
        });
    });
    
    return allocations;
}

// Generate history-based allocation (based on past 3 months of spending)
function generateHistoryBasedAllocation(availableFunds, categories) {
    const allocations = [];
    
    // Calculate total historical spending
    let totalHistoricalSpending = 0;
    categories.forEach(category => {
        totalHistoricalSpending += category.historical_spending || 0;
    });
    
    if (totalHistoricalSpending === 0) {
        // If no historical data, fall back to balanced allocation
        return generateBalancedAllocation(availableFunds, categories);
    }
    
    // Allocate based on historical spending percentages
    categories.forEach(category => {
        const historicalPercentage = ((category.historical_spending || 0) / totalHistoricalSpending) * 100;
        // Cap the allocation at 95% of available funds to ensure some savings
        const amount = availableFunds * (historicalPercentage / 100) * 0.95;
        
        allocations.push({
            id: category.id,
            name: category.name,
            icon: category.icon,
            color: category.color,
            amount: Math.round(amount * 100) / 100,
            percentage: historicalPercentage
        });
    });
    
    return allocations;
}

// Apply the smart budget to all categories
function applySmartBudget() {
    const allocations = window.currentAllocations;
    
    if (!allocations || allocations.length === 0) {
        showNotification('No budget allocations to apply', 'error');
        return;
    }
    
    const adjustExisting = document.getElementById('adjust-existing-budgets').checked;
    
    // Update each category's budget
    const promises = allocations.map(allocation => {
        return new Promise((resolve, reject) => {
            // Skip if not adjusting existing budgets
            if (!adjustExisting) {
                resolve();
                return;
            }
            
            const formData = new FormData();
            formData.append('category_id', allocation.id);
            formData.append('category_name', allocation.name);
            formData.append('icon', allocation.icon);
            formData.append('color', allocation.color);
            formData.append('budget', allocation.amount);
            
            fetch('api.php?action=update_budget', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    resolve();
                } else {
                    reject(new Error(`Failed to update budget for ${allocation.name}`));
                }
            })
            .catch(error => reject(error));
        });
    });
    
    Promise.all(promises)
        .then(() => {
            closeSmartBudgetModal();
            loadBudgets(); // Reload budgets to show the updated values
            showNotification('Smart Budget applied successfully!', 'success');
        })
        .catch(error => {
            console.error('Error applying smart budget:', error);
            showNotification('Failed to apply smart budget. Please try again.', 'error');
        });
}

// Add to the window object for access from HTML
window.openSmartBudgetModal = openSmartBudgetModal;
window.closeSmartBudgetModal = closeSmartBudgetModal;
window.applySmartBudget = applySmartBudget;