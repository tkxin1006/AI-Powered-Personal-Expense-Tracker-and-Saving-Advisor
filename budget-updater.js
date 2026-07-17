/**
 * Budget Updater
 * 
 * This script automatically updates budget calculations when transactions are added or deleted,
 * reflecting real-time changes in the budget display.
 */

// Listen for DOM content loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize budget event listeners
    initBudgetEventListeners();
});

/**
 * Initialize budget update event listeners
 */
function initBudgetEventListeners() {
    // Listen for custom events triggered when transactions are added or deleted
    document.addEventListener('transactionAdded', function(e) {
        if (isOnBudgetPage()) {
            updateBudgetsAfterTransaction();
        }
    });
    
    document.addEventListener('transactionDeleted', function(e) {
        if (isOnBudgetPage()) {
            updateBudgetsAfterTransaction();
        }
    });
    
    // If on transaction page, add event listeners to transaction form and delete buttons
    if (document.querySelector('#transaction-form')) {
        setupTransactionFormListeners();
    }
}

/**
 * Check if user is currently on the budgets page
 */
function isOnBudgetPage() {
    return window.location.pathname.includes('budgets.php') || 
           document.getElementById('budget-container') !== null;
}

/**
 * Setup transaction form listeners
 */
function setupTransactionFormListeners() {
    // Add event listener to transaction form submit
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        // Store original onsubmit function
        const originalOnSubmit = transactionForm.onsubmit;
        
        transactionForm.onsubmit = function(e) {
            // Call original submit handler
            if (originalOnSubmit) {
                const result = originalOnSubmit.call(this, e);
                if (result === false) return false;
            }
            
            // After form is submitted and transaction is added successfully
            // We'll add a callback after the form submission completes
            setTimeout(function() {
                // Dispatch custom event
                const event = new CustomEvent('transactionAdded');
                document.dispatchEvent(event);
            }, 1000); // Wait for AJAX to complete
            
            // Don't prevent default form submission
            return true;
        };
    }
    
    // Add event listeners to delete buttons (using event delegation)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-delete') || 
            (e.target.parentElement && e.target.parentElement.classList.contains('btn-delete'))) {
            
            // After delete operation completes
            setTimeout(function() {
                // Dispatch custom event
                const event = new CustomEvent('transactionDeleted');
                document.dispatchEvent(event);
            }, 1000); // Wait for AJAX to complete
        }
    });
}

/**
 * Update budgets after a transaction is added or deleted
 */
function updateBudgetsAfterTransaction() {
    // If on budget page, reload budgets data
    if (typeof loadBudgets === 'function') {
        loadBudgets();
        showNotification('Budgets updated automatically', 'success');
    } else {
        // If budget page is not loaded, just update in the background
        fetch('api.php?action=get_budgets')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Budgets updated in background');
                }
            })
            .catch(error => {
                console.error('Error updating budgets:', error);
            });
    }
}

/**
 * Add global functions to handle transaction events from other pages
 */
// Function to call when a transaction is added from any page
function notifyTransactionAdded() {
    const event = new CustomEvent('transactionAdded');
    document.dispatchEvent(event);
}

// Function to call when a transaction is deleted from any page
function notifyTransactionDeleted() {
    const event = new CustomEvent('transactionDeleted');
    document.dispatchEvent(event);
}
