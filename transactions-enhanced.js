// Initialize Category Detector
const categoryDetector = new CategoryDetector();

// Load transactions on page load
document.addEventListener('DOMContentLoaded', function() {
    loadAllTransactions();
    loadCategories();
    
    // Auto-fill today's date
    const dateField = document.getElementById('date');
    if (dateField) {
        dateField.value = new Date().toISOString().split('T')[0];
    }
    
    const transactionForm = document.getElementById('transaction-form');
    if (transactionForm) {
        transactionForm.addEventListener('submit', handleTransactionSubmit);
    }

    // Add AI detection to description field
    setupAIDetection();
});

/**
 * Setup AI-powered category detection on description field
 */
let aiDetectionSetup = false; // Flag to prevent multiple setups

function setupAIDetection() {
    const descriptionField = document.getElementById('description');
    const categoryField = document.getElementById('category');
    
    if (!descriptionField || !categoryField) return;

    // Check if already set up - if yes, just return
    if (descriptionField.hasAttribute('data-ai-enabled')) {
        return;
    }
    
    // Mark as set up
    descriptionField.setAttribute('data-ai-enabled', 'true');

    // Remove ALL existing suggestion divs to avoid duplicates
    const existingSuggestions = document.querySelectorAll('#category-suggestion');
    existingSuggestions.forEach(s => s.remove());

    // Create suggestion display element
    const suggestionDiv = document.createElement('div');
    suggestionDiv.id = 'category-suggestion';
    suggestionDiv.style.cssText = `
        margin-top: 8px;
        padding: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 8px;
        font-size: 13px;
        display: none;
        animation: slideIn 0.3s ease-out;
    `;
    descriptionField.parentElement.appendChild(suggestionDiv);

    // Animation styles are defined in style.css

    // Debounce function to avoid too many detections
    let detectionTimeout;
    
    descriptionField.addEventListener('input', function(e) {
        clearTimeout(detectionTimeout);
        
        // Show detecting indicator
        suggestionDiv.style.display = 'block';
        suggestionDiv.className = 'ai-detecting';
        suggestionDiv.innerHTML = '🤖 Analyzing...';

        detectionTimeout = setTimeout(() => {
            const description = e.target.value;
            const transactionType = document.getElementById('transaction-type').value;
            
            // If description is empty or too short, reset category
            if (description.length < 2) {
                suggestionDiv.style.display = 'none';
                // Reset category to default "Select category"
                categoryField.value = '';
                return;
            }

            // Detect category
            const match = categoryDetector.detectCategory(description, transactionType);
            
            if (match) {
                // Debug: Log what we're looking for
                console.log('AI detected category:', match.category);
                console.log('Available categories:', Array.from(categoryField.options).map(o => o.textContent));
                
                // ── Category name matching ──────────────────────────
                // The AI pattern file uses names like "Food & Dining" or "Bills & Utilities"
                // but the DB might store shorter names like "Food" or "Bills".
                // We use a scored approach so the best partial match wins.
                const detectedName = match.category.toLowerCase();
                // Tokenise detected name, ignore filler words
                const detectedTokens = detectedName.split(/[\s&,]+/).filter(w => w.length >= 3);

                let categoryOption = null;
                let bestMatchScore = -1;

                Array.from(categoryField.options).forEach(option => {
                    if (!option.value) return; // skip placeholder
                    const optName = option.textContent.toLowerCase();
                    const optTokens = optName.split(/[\s&,]+/).filter(w => w.length >= 3);

                    let score = 0;

                    // S1: Exact full match (highest priority)
                    if (optName === detectedName) score = 100;

                    // S2: Detected name contains the full DB name (e.g. "Food & Dining" ⊃ "Food")
                    else if (!score && detectedName.includes(optName)) score = 80;

                    // S3: DB name contains the full detected name
                    else if (!score && optName.includes(detectedName)) score = 75;

                    // S4: Token overlap — count how many significant tokens match
                    if (!score) {
                        const overlap = detectedTokens.filter(t => optTokens.includes(t)).length;
                        if (overlap > 0) {
                            // Prefer options where overlap covers most of the shorter side
                            const coverage = overlap / Math.min(detectedTokens.length, optTokens.length);
                            score = Math.round(60 * coverage);
                        }
                    }

                    if (score > bestMatchScore) {
                        bestMatchScore = score;
                        categoryOption = option;
                    }
                });

                // Require at least a weak token match (score ≥ 30) to auto-select
                if (bestMatchScore < 30) categoryOption = null;

                console.log('Matched category option:', categoryOption ? categoryOption.textContent : 'None');

                if (categoryOption && categoryOption.value !== '') {
                    // Auto-select the category
                    categoryField.value = categoryOption.value;
                    
                    // Trigger change event so other code knows category changed
                    categoryField.dispatchEvent(new Event('change', { bubbles: true }));
                    
                    // Highlight the select field
                    categoryField.style.borderColor = '#667eea';
                    categoryField.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
                    
                    setTimeout(() => {
                        categoryField.style.borderColor = '';
                        categoryField.style.boxShadow = '';
                    }, 2000);

                    // Show success suggestion - KEEP IT VISIBLE
                    suggestionDiv.className = '';
                    suggestionDiv.style.display = 'block';
                    suggestionDiv.innerHTML = `
                        ${match.isLearned ? '🧠' : '✨'} 
                        <strong>AI detected "${description}"</strong> → <strong>${categoryOption.textContent}</strong>
                        <br><small style="opacity: 0.9;">${match.confidence}% confident${match.isLearned ? ' • Learned from your history' : ''}</small>
                    `;
                } else {
                    // Category not found in user's list - KEEP SUGGESTION VISIBLE
                    suggestionDiv.style.display = 'block';
                    suggestionDiv.innerHTML = `
                        💡 <strong>AI suggests:</strong> ${match.category} (${match.confidence}% confident)
                        <br><small style="opacity: 0.9;">Please create this category or select the closest match</small>
                    `;
                }
            } else {
                suggestionDiv.style.display = 'none';
            }
        }, 300); // 300ms delay for better UX
    });

    // When user manually changes category, update suggestion
    categoryField.addEventListener('change', function() {
        const suggestionDiv = document.getElementById('category-suggestion');
        const descriptionField = document.getElementById('description');
        
        if (suggestionDiv && descriptionField && descriptionField.value.length >= 2) {
            const selectedOption = categoryField.options[categoryField.selectedIndex];
            
            if (selectedOption && selectedOption.value !== '') {
                // User manually selected a category - show confirmation
                suggestionDiv.style.display = 'block';
                suggestionDiv.innerHTML = `
                    👤 <strong>You selected:</strong> ${selectedOption.textContent}
                    <br><small style="opacity: 0.9;">AI will remember this for "${descriptionField.value}"</small>
                `;
            }
        }
    });
}

// Load all categories for filter
function loadCategories() {
    fetch('api.php?action=get_categories')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const filterCategory = document.getElementById('filter-category');
                data.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category.id;
                    option.textContent = category.name;
                    filterCategory.appendChild(option);
                });
            }
        });
}

// Load all transactions
function loadAllTransactions() {
    fetch('api.php?action=get_all_transactions')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayTransactions(data.data);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Display transactions in table
function displayTransactions(transactions) {
    const tbody = document.getElementById('transactions-tbody');
    tbody.innerHTML = '';
    
    if (transactions.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="loading">No transactions found</td></tr>';
        return;
    }
    
    transactions.forEach(trans => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDate(trans.transaction_date)}</td>
            <td><strong>${trans.description}</strong></td>
            <td>
                <span class="category-badge" style="background-color: ${trans.color}">
                    <i class="fas ${trans.icon}"></i> ${trans.category_name}
                </span>
            </td>
            <td><span class="badge ${trans.type}">${trans.type}</span></td>
            <td class="${trans.type}">${trans.type === 'income' ? '+' : '-'}${formatCurrency(trans.amount)}</td>
            <td>
                <button onclick="editTransaction(${trans.id}, '${trans.type}', ${trans.amount}, '${trans.description.replace(/'/g, "\\'")}', ${trans.category_id}, '${trans.transaction_date}')" class="btn-edit" title="Edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteTransaction(${trans.id})" class="btn-delete" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// Filter transactions
function filterTransactions() {
    const type = document.getElementById('filter-type').value;
    const categoryId = document.getElementById('filter-category').value;
    const month = document.getElementById('filter-month').value;
    
    let url = 'api.php?action=get_all_transactions';
    if (type) url += `&type=${type}`;
    if (categoryId) url += `&category_id=${categoryId}`;
    if (month) url += `&month=${month}`;
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                displayTransactions(data.data);
            }
        });
}

// Delete transaction
function deleteTransaction(id) {
    if (!confirm('Are you sure you want to delete this transaction?')) {
        return;
    }
    
    const formData = new FormData();
    formData.append('id', id);
    
    fetch('api.php?action=delete_transaction', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showNotification('Transaction deleted successfully!', 'success');
            loadAllTransactions();
        } else {
            showNotification(data.message, 'error');
        }
    });
}

// Open modal
function openModal(type) {
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('modal-title');
    const transactionType = document.getElementById('transaction-type');
    const transactionForm = document.getElementById('transaction-form');
    
    // Reset form and remove transaction ID
    transactionForm.reset();
    const existingIdInput = document.getElementById('transaction-id');
    if (existingIdInput) {
        existingIdInput.remove();
    }
    
    // Auto-fill today's date
    const dateField = document.getElementById('date');
   if (dateField && !dateField.value) {
       dateField.value = new Date().toISOString().split('T')[0];
   }
    
    if (type === 'income') {
        modalTitle.textContent = 'Add Income';
        transactionType.value = 'income';
    } else {
        modalTitle.textContent = 'Add Expense';
        transactionType.value = 'expense';
    }
    
    loadCategoriesForModal(type).then(() => {
        // Setup AI detection after categories are loaded
        setupAIDetection();
    });
    modal.classList.add('active');
}

// Edit transaction
function editTransaction(id, type, amount, description, categoryId, transactionDate) {
    const modal = document.getElementById('transaction-modal');
    const modalTitle = document.getElementById('modal-title');
    const transactionForm = document.getElementById('transaction-form');
    
    // Set modal title
    modalTitle.textContent = type === 'income' ? 'Edit Income' : 'Edit Expense';
    
    // Load categories first
    loadCategoriesForModal(type).then(() => {
        // Set form values
        document.getElementById('transaction-type').value = type;
        document.getElementById('amount').value = amount;
        document.getElementById('description').value = description;
        document.getElementById('category').value = categoryId;
        // FIX DATE FORMAT: Ensure transaction date is in YYYY-MM-DD format
   let formattedDate = transactionDate;
   
   // If it's "Invalid Date" or in an incorrect format
   if (!transactionDate || transactionDate === 'Invalid Date') {
       formattedDate = new Date().toISOString().split('T')[0]; // Default to today
   } else {
       try {
           // Try to parse the date
           const dateObj = new Date(transactionDate);
           
           // Check if the date is valid
           if (!isNaN(dateObj.getTime())) {
               formattedDate = dateObj.toISOString().split('T')[0]; // Convert to YYYY-MM-DD
           } else {
               // Try alternative format parsing if needed
               if (transactionDate.includes('/')) {
                   const parts = transactionDate.split('/');
                   if (parts.length === 3) {
                       // Try European format DD/MM/YYYY
                       const newDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                       if (!isNaN(newDate.getTime())) {
                           formattedDate = newDate.toISOString().split('T')[0];
                       }
                   }
               } else {
                   formattedDate = new Date().toISOString().split('T')[0]; // Default to today as last resort
               }
           }
       } catch (e) {
           console.error('Error formatting date:', e);
           formattedDate = new Date().toISOString().split('T')[0]; // Default to today
       }
   }
        document.getElementById('date').value = formattedDate;
        
        // Add hidden input for transaction ID
        let idInput = document.getElementById('transaction-id');
        if (!idInput) {
            idInput = document.createElement('input');
            idInput.type = 'hidden';
            idInput.id = 'transaction-id';
            idInput.name = 'transaction_id';
            transactionForm.appendChild(idInput);
        }
        idInput.value = id;
        
        // Open modal
        modal.classList.add('active');
    });
}

// Close modal
function closeModal() {
    const modal = document.getElementById('transaction-modal');
    modal.classList.remove('active');
    document.getElementById('transaction-form').reset();
    
    // Hide and reset suggestion
    const suggestionDiv = document.getElementById('category-suggestion');
    if (suggestionDiv) {
        suggestionDiv.style.display = 'none';
    }
    
    // Reset AI detection flag so it can be set up again next time
    const descriptionField = document.getElementById('description');
    if (descriptionField) {
        descriptionField.removeAttribute('data-ai-enabled');
    }
}

// Load categories for modal
function loadCategoriesForModal(type) {
    return fetch(`api.php?action=get_categories&type=${type}`)
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
        });
}

// Handle form submit
function handleTransactionSubmit(e) {
    e.preventDefault();
    
    // Ensure date is properly formatted (YYYY-MM-DD)
   const dateInput = document.getElementById('date');
   if (dateInput) {
       let dateValue = dateInput.value;
       
       // If date is invalid or empty, set to today
       if (!dateValue || dateValue === 'Invalid Date') {
           dateValue = new Date().toISOString().split('T')[0];
           formData.set('transaction_date', dateValue);
       }
   }

    const formData = new FormData(e.target);
    const transactionId = document.getElementById('transaction-id');
    
    // Determine if this is an edit or add
    const isEdit = transactionId && transactionId.value;
    const action = isEdit ? 'update_transaction' : 'add_transaction';
    
    fetch(`api.php?action=${action}`, {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            // Learn from this transaction for future predictions
            const description = formData.get('description');
            const categoryField = document.getElementById('category');
            const categoryName = categoryField.options[categoryField.selectedIndex].text;
            
            categoryDetector.learnFromTransaction(description, categoryName);
            
            closeModal();
            loadAllTransactions();
            showNotification(`Transaction ${isEdit ? 'updated' : 'added'} successfully! 🎉`, 'success');
        } else {
            showNotification(data.message || `Failed to ${isEdit ? 'update' : 'add'} transaction`, 'error');
        }
    });
}

// Export data
function exportData() {
    window.location.href = 'export.php';
}

// Utility functions
function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

function formatDate(dateString) {
       if (!dateString) return 'No date';
       
       try {
           // Fix for date format issues - ensure proper formatting
           const date = new Date(dateString);
           
           // Check if date is valid
           if (isNaN(date.getTime())) {
               console.error('Invalid date format:', dateString);
               
               // Try to parse a date in format 'DD/MM/YYYY'
               if (dateString.includes('/')) {
                   const parts = dateString.split('/');
                   if (parts.length === 3) {
                       // Try European format DD/MM/YYYY
                       const newDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                       if (!isNaN(newDate.getTime())) {
                           return newDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                       }
                   }
               }
               
               // If still invalid, display in a more user-friendly way
               return dateString === 'Invalid Date' ? 'Unknown date' : dateString;
           }
           
           return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
       } catch (e) {
           console.error('Error formatting date:', e);
           return dateString === 'Invalid Date' ? 'Unknown date' : dateString;
       }
   }

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

// Debug functions (can be called from console)
function showLearnedPatterns() {
    console.table(categoryDetector.getLearnedPatterns());
}

function clearAILearning() {
    if (confirm('This will clear all learned patterns. Are you sure?')) {
        categoryDetector.clearLearnedPatterns();
        alert('AI learning data cleared!');
    }
}