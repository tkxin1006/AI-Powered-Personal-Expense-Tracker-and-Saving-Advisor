// Global variables
let incomeExpenseChart, categoryChart;

// Load data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSummary();
    loadTransactions();
    loadCharts();
    
    // Set today's date as default
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    
    // Theme toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Transaction form submit
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }
});

// Toggle dark theme
function toggleTheme() {
    const body = document.body;
    const icon = document.querySelector('#theme-toggle i');
    
    if (body.getAttribute('data-theme') === 'dark') {
        body.removeAttribute('data-theme');
        icon.className = 'fas fa-moon';
    } else {
        body.setAttribute('data-theme', 'dark');
        icon.className = 'fas fa-sun';
    }
}

// Open modal
function openModal(type) {
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('modal-title');
    const transactionType = document.getElementById('transaction-type');
    
    if (type === 'income') {
        modalTitle.textContent = 'Add Income';
        transactionType.value = 'income';
    } else {
        modalTitle.textContent = 'Add Expense';
        transactionType.value = 'expense';
    }
    
    // Load categories based on type
    loadCategories(type);
    
    modal.classList.add('active');
}

// Close modal
function closeModal() {
    const modal = document.getElementById('transaction-modal');
    modal.classList.remove('active');
    document.getElementById('transaction-form').reset();
}

// Load categories dynamically
function loadCategories(type) {
    fetch(`api.php?action=get_categories&type=${type}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const categorySelect = document.getElementById('category');
                categorySelect.innerHTML = '<option value="">Select category</option>';
                
                data.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    categorySelect.appendChild(option);
                });
            }
        })
        .catch(error => console.error('Error loading categories:', error));
}

// Handle transaction form submit
function handleAddTransactionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const type = formData.get('type');
    
    fetch('api.php?action=add_transaction', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            closeAddTransactionModal();
            loadTransactions();
            
            // Show a notification based on the transaction type
            if (type === 'income') {
                showNotification('Income added and budgets automatically allocated!', 'success');
            } else {
                showNotification('Transaction added successfully!', 'success');
            }
        } else {
            showNotification(data.message || 'Failed to add transaction', 'error');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        showNotification('An error occurred. Please try again.', 'error');
    });
}

// Load summary data
function loadSummary() {
    fetch('api.php?action=get_summary')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const summary = data.data;
                document.getElementById('total-balance').textContent = formatCurrency(summary.balance);
                document.getElementById('monthly-income').textContent = formatCurrency(summary.income);
                document.getElementById('monthly-expenses').textContent = formatCurrency(summary.expenses);
                document.getElementById('savings-rate').textContent = summary.savings_rate + '%';
            }
        })
        .catch(error => console.error('Error loading summary:', error));
}

// Load transactions
function loadTransactions() {
    fetch('api.php?action=get_transactions&limit=5')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const container = document.getElementById('recent-transactions');
                container.innerHTML = '';
                
                if (data.data.length === 0) {
                    container.innerHTML = '<p class="loading">No transactions yet. Add your first transaction!</p>';
                    return;
                }
                
                data.data.forEach(trans => {
                    const item = document.createElement('div');
                    item.className = 'transaction-item';
                    
                    item.innerHTML = `
                        <div class="transaction-info">
                            <div class="transaction-icon" style="background-color: ${trans.color}">
                                <i class="fas ${trans.icon}"></i>
                            </div>
                            <div class="transaction-details">
                                <h4>${trans.description}</h4>
                                <p>${trans.category_name} • ${formatDate(trans.transaction_date)}</p>
                            </div>
                        </div>
                        <div class="transaction-amount ${trans.type}">
                            ${trans.type === 'income' ? '+' : '-'}${formatCurrency(trans.amount)}
                        </div>
                    `;
                    
                    container.appendChild(item);
                });
            }
        })
        .catch(error => console.error('Error loading transactions:', error));
}

// Load charts
function loadCharts() {
    // Income vs Expenses Chart
    fetch('api.php?action=get_summary')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const summary = data.data;
                renderIncomeExpenseChart(summary.income, summary.expenses);
            }
        });
    
    // Category Expenses Chart - UPDATED to use get_expense_breakdown endpoint
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-11, so add 1
    const currentYear = new Date().getFullYear();
    
    fetch(`api.php?action=get_expense_breakdown&month=${currentMonth}&year=${currentYear}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderCategoryChart(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading expense breakdown:', error);
            // If the endpoint fails, try the original endpoint as fallback
            fetch('api.php?action=get_category_expenses')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        renderCategoryChart(data.data);
                    }
                });
        });
}

// Render income vs expense chart
function renderIncomeExpenseChart(income, expenses) {
    const ctx = document.getElementById('incomeExpenseChart');
    if (!ctx) return;
    
    if (incomeExpenseChart) {
        incomeExpenseChart.destroy();
    }
    
    incomeExpenseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Expenses'],
            datasets: [{
                label: 'Amount ($)',
                data: [income, expenses],
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(239, 68, 68, 0.8)'
                ],
                borderColor: [
                    'rgb(16, 185, 129)',
                    'rgb(239, 68, 68)'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

// Render category chart - UPDATED to handle data format from get_expense_breakdown
function renderCategoryChart(data) {
    const ctx = document.getElementById('categoryChart');
    if (!ctx) return;
    
    if (categoryChart) {
        categoryChart.destroy();
    }
    
    // Check if there's data to display
    if (!data || data.length === 0) {
        const chartBox = ctx.parentElement;
        // Keep the existing h3 title if it exists
        const title = chartBox.querySelector('h3');
        
        chartBox.innerHTML = '';
        if (title) {
            chartBox.appendChild(title);
        }
        
        const noDataMsg = document.createElement('p');
        noDataMsg.className = 'loading';
        noDataMsg.textContent = 'No expense data yet';
        chartBox.appendChild(noDataMsg);
        return;
    }
    
    // Restore canvas if it was removed
    if (!document.getElementById('categoryChart')) {
        const chartBox = document.querySelector('.chart-box:nth-child(2)');
        const canvas = document.createElement('canvas');
        canvas.id = 'categoryChart';
        
        // Clear previous no-data message if it exists
        const noDataMsg = chartBox.querySelector('.loading');
        if (noDataMsg) {
            chartBox.removeChild(noDataMsg);
        }
        
        chartBox.appendChild(canvas);
        ctx = canvas; // Update ctx to the new canvas
    }
    
    categoryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.map(item => item.name),
            datasets: [{
                data: data.map(item => item.value),
                backgroundColor: data.map(item => item.color),
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: false,
                    text: 'Spending by Category'
                }
            }
        }
    });
}

// Utility functions
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.right = '20px';
    notification.style.zIndex = '9999';
    notification.style.minWidth = '300px';
    notification.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}