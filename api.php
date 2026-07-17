<?php
require_once 'config.php';
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit();
}

$user_id = $_SESSION['user_id'];
$action = $_GET['action'] ?? '';

/**
 * Automatically allocate budgets based on income
 * 
 * @param mysqli $conn Database connection
 * @param int $user_id User ID
 * @param float $income Income amount
 * @param bool $forceUpdate Whether to update existing budgets
 * @return bool Whether changes were made
 */
function allocateBudgetsAutomatically($conn, $user_id, $income, $forceUpdate = false) {
    // Default budget percentages
    $defaultPercentages = [
        'Food & Drinks'             => 20,
        'Transport'                 => 10,
        'Housing & Utilities'       => 30,
        'Shopping'                  => 10,
        'Entertainment & Lifestyle' => 5,
        'Healthcare'                => 5,
        'Education'                 => 3,
        'Financial & Obligations'   => 15,
        'Donations & Gifts'         => 2,
        'Miscellaneous'             => 0,
    ];
    
    // Check if user already has budget allocations
    $stmt = $conn->prepare("
        SELECT COUNT(*) as count
        FROM categories 
        WHERE user_id = ? AND type = 'expense' AND budget > 0
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    
    // If user already has allocated budgets and not forcing update, don't override them
    if ($result['count'] > 0 && !$forceUpdate) {
        return false; // No changes made
    }
    
    // Get all expense categories
    $stmt = $conn->prepare("
        SELECT id, name 
        FROM categories 
        WHERE user_id = ? AND type = 'expense'
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $categories = [];
    while ($row = $result->fetch_assoc()) {
        $categories[] = $row;
    }
    
    // If no categories found, exit
    if (count($categories) == 0) {
        return false; // No changes made
    }
    
    // Calculate budget allocation based on percentages
    // For categories not in the default percentages, distribute remaining percentage evenly
    $totalAllocated = 0;
    $categoriesWithoutDefault = 0;
    
    foreach ($categories as $category) {
        if (!isset($defaultPercentages[$category['name']])) {
            $categoriesWithoutDefault++;
        } else {
            $totalAllocated += $defaultPercentages[$category['name']];
        }
    }
    
    // Calculate percentage for categories without default allocation
    $remainingPercentage = max(0, 100 - $totalAllocated);
    $percentagePerCategory = $categoriesWithoutDefault > 0 ? $remainingPercentage / $categoriesWithoutDefault : 0;
    
    // Update budgets for all expense categories
    foreach ($categories as $category) {
        $percentage = isset($defaultPercentages[$category['name']]) 
            ? $defaultPercentages[$category['name']] 
            : $percentagePerCategory;
        
        // Calculate budget amount based on percentage (using 90% of the calculated amount to leave some savings)
        $budgetAmount = ($income * ($percentage / 100)) * 0.9;
        
        // Update category budget
        $stmt = $conn->prepare("UPDATE categories SET budget = ? WHERE id = ? AND user_id = ?");
        $stmt->bind_param("dii", $budgetAmount, $category['id'], $user_id);
        $stmt->execute();
    }
    
    return true; // Changes were made
}

/**
 * Get current month's income
 *
 * @param mysqli $conn Database connection
 * @param int $user_id User ID
 * @return float Total income
 */
function getCurrentMonthIncome($conn, $user_id) {
    $month = date('m');
    $year = date('Y');
    
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions
        WHERE user_id = ?
        AND type = 'income'
        AND MONTH(transaction_date) = ?
        AND YEAR(transaction_date) = ?
    ");
    $stmt->bind_param("iii", $user_id, $month, $year);
    $stmt->execute();
    
    return $stmt->get_result()->fetch_assoc()['total'] ?? 0;
}

/**
 * Update budgets when transactions change
 * 
 * @param mysqli $conn Database connection
 * @param int $user_id User ID
 * @return bool Whether budgets were updated
 */
function updateBudgetsAfterTransaction($conn, $user_id) {
    // Get current month's income
    $income = getCurrentMonthIncome($conn, $user_id);
    
    // If no income, can't update budgets
    if ($income <= 0) {
        return false;
    }
    
    // Update existing budgets based on income 
    return allocateBudgetsAutomatically($conn, $user_id, $income, true);
}

switch ($action) {
    case 'get_categories':
        $type = $_GET['type'] ?? '';
        $sql = "SELECT * FROM categories WHERE user_id = ?";
        
        if ($type === 'income' || $type === 'expense') {
            $sql .= " AND type = ?";
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("is", $user_id, $type);
        } else {
            $stmt = $conn->prepare($sql);
            $stmt->bind_param("i", $user_id);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        $categories = [];
        
        while ($row = $result->fetch_assoc()) {
            $categories[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $categories]);
        break;
    
    case 'add_transaction':
        $type = $_POST['type'] ?? '';
        $amount = $_POST['amount'] ?? 0;
        $description = $_POST['description'] ?? '';
        $category_id = $_POST['category_id'] ?? 0;
        $transaction_date = $_POST['transaction_date'] ?? date('Y-m-d');
        $transaction_id = $_POST['transaction_id'] ?? 0;
        
        // Ensure date is in YYYY-MM-DD format
        if (!empty($transaction_date)) {
            // Check if date is in DD/MM/YYYY format and convert it
            if (preg_match('/^\d{2}\/\d{2}\/\d{4}$/', $transaction_date)) {
                $date_parts = explode('/', $transaction_date);
                $transaction_date = $date_parts[2] . '-' . $date_parts[1] . '-' . $date_parts[0];
            }
            
            // Validate the date format
            if (!preg_match('/^\d{4}-\d{2}-\d{2}$/', $transaction_date)) {
                $transaction_date = date('Y-m-d'); // Default to today if format is invalid
            }
        }
        
        if (empty($type) || $amount <= 0 || empty($description) || $category_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid data']);
            exit();
        }
        
        // Check if it's an update (edit) or new transaction
        if ($transaction_id > 0) {
            // Edit existing transaction
            $stmt = $conn->prepare("
                UPDATE transactions 
                SET category_id = ?, type = ?, amount = ?, description = ?, transaction_date = ? 
                WHERE id = ? AND user_id = ?
            ");
            $stmt->bind_param("isdssis", $category_id, $type, $amount, $description, $transaction_date, $transaction_id, $user_id);
        } else {
            // Insert new transaction
            $stmt = $conn->prepare("
                INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");
            $stmt->bind_param("iisdss", $user_id, $category_id, $type, $amount, $description, $transaction_date);
        }
        
        if ($stmt->execute()) {
            // Automatically update budgets if income has been added
            $budgetsUpdated = false;
            if ($type === 'income') {
                // Get the current month's income
                $income = getCurrentMonthIncome($conn, $user_id);
                
                // Try to automatically allocate budgets
                $budgetsUpdated = allocateBudgetsAutomatically($conn, $user_id, $income, true);
            } else {
                // For expense transactions, just update the budget calculations
                $budgetsUpdated = updateBudgetsAfterTransaction($conn, $user_id);
            }
            
            echo json_encode([
                'success' => true, 
                'message' => 'Transaction saved successfully!',
                'budgets_updated' => $budgetsUpdated
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to save transaction']);
        }
        break;
    
    case 'update_transaction':
        $transaction_id = $_POST['transaction_id'] ?? 0;
        $type = $_POST['type'] ?? '';
        $amount = $_POST['amount'] ?? 0;
        $description = $_POST['description'] ?? '';
        $category_id = $_POST['category_id'] ?? 0;
        $transaction_date = $_POST['transaction_date'] ?? date('Y-m-d');
        
        if (empty($transaction_id) || empty($type) || $amount <= 0 || empty($description) || $category_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid data']);
            exit();
        }
        
        $stmt = $conn->prepare("UPDATE transactions SET type = ?, amount = ?, description = ?, category_id = ?, transaction_date = ? WHERE id = ? AND user_id = ?");
        $stmt->bind_param("sdsssii", $type, $amount, $description, $category_id, $transaction_date, $transaction_id, $user_id);
        
        if ($stmt->execute()) {
            // After updating a transaction, update budgets
            $budgetsUpdated = updateBudgetsAfterTransaction($conn, $user_id);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Transaction updated successfully',
                'budgets_updated' => $budgetsUpdated
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update transaction']);
        }
        break;
    
    case 'get_transactions':
        $limit = $_GET['limit'] ?? 10;
        $stmt = $conn->prepare("
            SELECT t.*, c.name as category_name, c.icon, c.color 
            FROM transactions t 
            JOIN categories c ON t.category_id = c.id 
            WHERE t.user_id = ? 
            ORDER BY t.transaction_date DESC, t.created_at DESC 
            LIMIT ?
        ");
        $stmt->bind_param("ii", $user_id, $limit);
        $stmt->execute();
        $result = $stmt->get_result();
        $transactions = [];
        
        while ($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $transactions]);
        break;
    
    case 'get_all_transactions':
        $type = $_GET['type'] ?? '';
        $category_id = isset($_GET['category_id']) ? (int)$_GET['category_id'] : 0;
        $month = $_GET['month'] ?? '';
        
        $sql = "
            SELECT t.*, c.name AS category_name, c.icon, c.color 
            FROM transactions t
            JOIN categories c ON t.category_id = c.id
            WHERE t.user_id = ?
        ";
        
        $params = [$user_id];
        $param_types = "i";
        
        if ($type) {
            $sql .= " AND t.type = ?";
            $params[] = $type;
            $param_types .= "s";
        }
        
        if ($category_id > 0) {
            $sql .= " AND t.category_id = ?";
            $params[] = $category_id;
            $param_types .= "i";
        }
        
        if ($month) {
            // If month is in format MM-YYYY or MM/YYYY
            if (preg_match('/^(\d{1,2})[-\/](\d{4})$/', $month, $matches)) {
                $month_number = $matches[1];
                $year_number = $matches[2];
                $sql .= " AND MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?";
                $params[] = $month_number;
                $params[] = $year_number;
                $param_types .= "ii";
            } else {
                $sql .= " AND MONTH(t.transaction_date) = ?";
                $params[] = $month;
                $param_types .= "i";
            }
        }
        
        $sql .= " ORDER BY t.transaction_date DESC, t.created_at DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->bind_param($param_types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();
        $transactions = [];
        
        while ($row = $result->fetch_assoc()) {
            $transactions[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $transactions]);
        break;
    
    case 'get_summary':
        $month = date('m');
        $year = date('Y');
        
        // Get income
        $stmt = $conn->prepare("
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = ? AND type = 'income'
            AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
        ");
        $stmt->bind_param("iii", $user_id, $month, $year);
        $stmt->execute();
        $income = $stmt->get_result()->fetch_assoc()['total'];
        
        // Get expenses
        $stmt = $conn->prepare("
            SELECT COALESCE(SUM(amount), 0) as total
            FROM transactions
            WHERE user_id = ? AND type = 'expense'
            AND MONTH(transaction_date) = ? AND YEAR(transaction_date) = ?
        ");
        $stmt->bind_param("iii", $user_id, $month, $year);
        $stmt->execute();
        $expenses = $stmt->get_result()->fetch_assoc()['total'];
        
        // Calculate balance
        $balance = $income - $expenses;
        
        // Calculate savings rate
        $savings_rate = $income > 0 ? ($balance / $income) * 100 : 0;
        
        echo json_encode([
            'success' => true,
            'data' => [
                'income' => floatval($income),
                'expenses' => floatval($expenses),
                'balance' => floatval($balance),
                'savings_rate' => round($savings_rate, 1)
            ]
        ]);
        break;
    
    case 'get_expense_breakdown':
        $month = $_GET['month'] ?? date('m');
        $year = $_GET['year'] ?? date('Y');
        
        $stmt = $conn->prepare("
            SELECT c.name, c.color, COALESCE(SUM(t.amount), 0) as total
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id 
                AND t.user_id = ? 
                AND t.type = 'expense'
                AND MONTH(t.transaction_date) = ? 
                AND YEAR(t.transaction_date) = ?
            WHERE c.user_id = ? AND c.type = 'expense'
            GROUP BY c.id, c.name, c.color
            HAVING total > 0
            ORDER BY total DESC
        ");
        $stmt->bind_param("iiii", $user_id, $month, $year, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = [];
        
        while ($row = $result->fetch_assoc()) {
            $data[] = [
                'name' => $row['name'],
                'value' => floatval($row['total']),
                'color' => $row['color']
            ];
        }
        
        echo json_encode(['success' => true, 'data' => $data]);
        break;
    
    case 'delete_transaction':
        $id = $_POST['id'] ?? 0;
        
        $stmt = $conn->prepare("DELETE FROM transactions WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $id, $user_id);
        
        if ($stmt->execute()) {
            // After deleting a transaction, update budgets
            $budgetsUpdated = updateBudgetsAfterTransaction($conn, $user_id);
            
            echo json_encode([
                'success' => true, 
                'message' => 'Transaction deleted',
                'budgets_updated' => $budgetsUpdated
            ]);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete']);
        }
        break;
    
    case 'update_budgets_after_transaction':
        // Special endpoint to force budget recalculation
        $budgetsUpdated = updateBudgetsAfterTransaction($conn, $user_id);
        
        echo json_encode([
            'success' => true, 
            'message' => $budgetsUpdated ? 'Budgets updated successfully' : 'No budget updates needed',
            'budgets_updated' => $budgetsUpdated
        ]);
        break;
        
    // Budget endpoints
    case 'get_budgets':
        $month = $_GET['month'] ?? date('m');
        $year = $_GET['year'] ?? date('Y');
        
        $stmt = $conn->prepare("
            SELECT c.id, c.name, c.icon, c.color, c.budget,
                   COALESCE(SUM(t.amount), 0) as spent
            FROM categories c
            LEFT JOIN transactions t ON c.id = t.category_id 
                AND t.user_id = ? 
                AND t.type = 'expense'
                AND MONTH(t.transaction_date) = ?
                AND YEAR(t.transaction_date) = ?
            WHERE c.user_id = ? AND c.type = 'expense'
            GROUP BY c.id, c.name, c.icon, c.color, c.budget
            ORDER BY c.name ASC
        ");
        $stmt->bind_param("iiii", $user_id, $month, $year, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $budgets = [];
        
        while ($row = $result->fetch_assoc()) {
            $budgets[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $budgets]);
        break;
    
    case 'update_budget':
        $category_id = $_POST['category_id'] ?? 0;
        $category_name = $_POST['category_name'] ?? '';
        $icon = $_POST['icon'] ?? 'fa-tag';
        $color = $_POST['color'] ?? '#3b82f6';
        $budget = $_POST['budget'] ?? 0;
        
        $stmt = $conn->prepare("
            UPDATE categories 
            SET name = ?, icon = ?, color = ?, budget = ?
            WHERE id = ? AND user_id = ?
        ");
        $stmt->bind_param("sssdii", $category_name, $icon, $color, $budget, $category_id, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Budget updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update budget']);
        }
        break;
    
    case 'add_category':
        $name = $_POST['name'] ?? '';
        $type = $_POST['type'] ?? 'expense';
        $icon = $_POST['icon'] ?? 'fa-tag';
        $color = $_POST['color'] ?? '#3b82f6';
        $budget = $_POST['budget'] ?? 0;
        
        if (empty($name) || empty($type)) {
            echo json_encode(['success' => false, 'message' => 'Invalid data']);
            exit();
        }
        
        $stmt = $conn->prepare("INSERT INTO categories (user_id, name, type, icon, color, budget) VALUES (?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("issssd", $user_id, $name, $type, $icon, $color, $budget);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Category added successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add category']);
        }
        break;
    
    case 'delete_category':
        $category_id = $_POST['category_id'] ?? 0;
        
        // Start transaction
        $conn->begin_transaction();
        
        try {
            // First, delete all transactions in this category
            $stmt = $conn->prepare("DELETE FROM transactions WHERE category_id = ? AND user_id = ?");
            $stmt->bind_param("ii", $category_id, $user_id);
            $stmt->execute();
            
            // Then, delete the category
            $stmt = $conn->prepare("DELETE FROM categories WHERE id = ? AND user_id = ?");
            $stmt->bind_param("ii", $category_id, $user_id);
            $stmt->execute();
            
            // Commit the transaction
            $conn->commit();
            
            echo json_encode(['success' => true, 'message' => 'Category deleted successfully']);
        } catch (Exception $e) {
            // Rollback the transaction if something went wrong
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Failed to delete category']);
        }
        break;
    
    case 'get_category_expenses':
        $category_id = $_GET['category_id'] ?? 0;
        $month = $_GET['month'] ?? date('m');
        $year = $_GET['year'] ?? date('Y');
        
        if ($category_id <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid category ID']);
            exit();
        }
        
        $stmt = $conn->prepare("
            SELECT t.id, t.amount, t.description, t.transaction_date as date
            FROM transactions t
            WHERE t.user_id = ? AND t.category_id = ? AND t.type = 'expense'
            AND MONTH(t.transaction_date) = ? AND YEAR(t.transaction_date) = ?
            ORDER BY t.transaction_date DESC
        ");
        $stmt->bind_param("iiii", $user_id, $category_id, $month, $year);
        $stmt->execute();
        $result = $stmt->get_result();
        $expenses = [];
        
        while ($row = $result->fetch_assoc()) {
            $expenses[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $expenses]);
        break;
    
    // Reports endpoints
    // Add this to your api.php file - Replace the entire 'get_reports' case

case 'get_reports':
    $period = $_GET['period'] ?? 'current';
    
    // Calculate date range
    $start_date = '';
    $end_date = date('Y-m-d');
    
    switch ($period) {
        case 'current':
            // Current month - from 1st of this month to today
            $start_date = date('Y-m-01');
            $end_date = date('Y-m-d');
            break;
        case 'last':
            // Last month - from 1st to last day of previous month
            $start_date = date('Y-m-01', strtotime('first day of last month'));
            $end_date = date('Y-m-t', strtotime('last day of last month'));
            break;
        case '3months':
            // Last 3 months
            $start_date = date('Y-m-01', strtotime('-3 months'));
            break;
        case '6months':
            // Last 6 months
            $start_date = date('Y-m-01', strtotime('-6 months'));
            break;
        case 'year':
            // This year - from January 1st to today
            $start_date = date('Y-01-01');
            break;
    }
    
    // Debug - you can remove this after confirming it works
    error_log("Period: $period, Start: $start_date, End: $end_date");
    
    // Get income
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = ? AND type = 'income' 
        AND transaction_date BETWEEN ? AND ?
    ");
    $stmt->bind_param("iss", $user_id, $start_date, $end_date);
    $stmt->execute();
    $income = $stmt->get_result()->fetch_assoc()['total'];
    
    // Get expenses
    $stmt = $conn->prepare("
        SELECT COALESCE(SUM(amount), 0) as total 
        FROM transactions 
        WHERE user_id = ? AND type = 'expense' 
        AND transaction_date BETWEEN ? AND ?
    ");
    $stmt->bind_param("iss", $user_id, $start_date, $end_date);
    $stmt->execute();
    $expenses = $stmt->get_result()->fetch_assoc()['total'];
    
    $savings = $income - $expenses;
    $days = max(1, (strtotime($end_date) - strtotime($start_date)) / (60 * 60 * 24));
    $daily_avg = $expenses / $days;
    
    // FIXED: Get trend data - GROUP BY DAY for current/last month, BY MONTH for longer periods
    if ($period === 'current' || $period === 'last') {
        // Group by DAY for current month and last month
        $stmt = $conn->prepare("
            SELECT DATE(transaction_date) as period,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
            FROM transactions
            WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
            GROUP BY DATE(transaction_date)
            ORDER BY period
        ");
    } else {
        // Group by MONTH for 3 months, 6 months, year
        $stmt = $conn->prepare("
            SELECT DATE_FORMAT(transaction_date, '%Y-%m') as period,
                SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
            FROM transactions
            WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
            GROUP BY period
            ORDER BY period
        ");
    }
    
    $stmt->bind_param("iss", $user_id, $start_date, $end_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $trend = ['labels' => [], 'income' => [], 'expenses' => []];
    while ($row = $result->fetch_assoc()) {
        // Format the label based on period type
        if ($period === 'current' || $period === 'last') {
            // Format as "Jan 1", "Jan 2", etc. for daily view
            $date = new DateTime($row['period']);
            $trend['labels'][] = $date->format('M j'); // "Jan 1", "Jan 2"
        } else {
            // Format as "Jan", "Feb", etc. for monthly view
            $date = new DateTime($row['period'] . '-01');
            $trend['labels'][] = $date->format('M Y'); // "Jan 2026", "Feb 2026"
        }
        
        $trend['income'][] = floatval($row['income']);
        $trend['expenses'][] = floatval($row['expenses']);
    }
    
    // Get category breakdown
    $stmt = $conn->prepare("
        SELECT c.name, c.icon, c.color, SUM(t.amount) as total
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.user_id = ? AND t.type = 'expense'
        AND t.transaction_date BETWEEN ? AND ?
        GROUP BY c.id
        ORDER BY total DESC
    ");
    $stmt->bind_param("iss", $user_id, $start_date, $end_date);
    $stmt->execute();
    $result = $stmt->get_result();
    
    $categories = [];
    $total_expenses = floatval($expenses);
    
    while ($row = $result->fetch_assoc()) {
        $categories[] = [
            'name' => $row['name'],
            'icon' => $row['icon'],
            'color' => $row['color'],
            'total' => floatval($row['total']),
            'percentage' => $total_expenses > 0 ? (floatval($row['total']) / $total_expenses) * 100 : 0
        ];
    }

    echo json_encode([
        'success' => true,
        'data' => [
            'period' => $period,
            'date_range' => [
                'start' => $start_date,
                'end' => $end_date
            ],
            'summary' => [
                'income' => floatval($income),
                'expenses' => floatval($expenses),
                'savings' => floatval($savings),
                'daily_avg' => floatval($daily_avg)
            ],
            'trend' => $trend,
            'categories' => $categories
        ]
    ]);
    break;
            
            // Debug - you can remove this after confirming it works
            error_log("Period: $period, Start: $start_date, End: $end_date");
            
            // Get income
            $stmt = $conn->prepare("
                SELECT COALESCE(SUM(amount), 0) as total 
                FROM transactions 
                WHERE user_id = ? AND type = 'income' 
                AND transaction_date BETWEEN ? AND ?
            ");
            $stmt->bind_param("iss", $user_id, $start_date, $end_date);
            $stmt->execute();
            $income = $stmt->get_result()->fetch_assoc()['total'];
            
            // Get expenses
            $stmt = $conn->prepare("
                SELECT COALESCE(SUM(amount), 0) as total 
                FROM transactions 
                WHERE user_id = ? AND type = 'expense' 
                AND transaction_date BETWEEN ? AND ?
            ");
            $stmt->bind_param("iss", $user_id, $start_date, $end_date);
            $stmt->execute();
            $expenses = $stmt->get_result()->fetch_assoc()['total'];
            
            $savings = $income - $expenses;
            $days = max(1, (strtotime($end_date) - strtotime($start_date)) / (60 * 60 * 24));
            $daily_avg = $expenses / $days;
            
            // Get trend data
            $stmt = $conn->prepare("
                SELECT DATE_FORMAT(transaction_date, '%Y-%m') as month,
                    SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
                    SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
                FROM transactions
                WHERE user_id = ? AND transaction_date BETWEEN ? AND ?
                GROUP BY month
                ORDER BY month
            ");
            $stmt->bind_param("iss", $user_id, $start_date, $end_date);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $trend = ['labels' => [], 'income' => [], 'expenses' => []];
            while ($row = $result->fetch_assoc()) {
                $trend['labels'][] = $row['month'];
                $trend['income'][] = floatval($row['income']);
                $trend['expenses'][] = floatval($row['expenses']);
            }
            
            // Get category breakdown
            $stmt = $conn->prepare("
                SELECT c.name, c.icon, c.color, SUM(t.amount) as total
                FROM transactions t
                JOIN categories c ON t.category_id = c.id
                WHERE t.user_id = ? AND t.type = 'expense'
                AND t.transaction_date BETWEEN ? AND ?
                GROUP BY c.id
                ORDER BY total DESC
            ");
            $stmt->bind_param("iss", $user_id, $start_date, $end_date);
            $stmt->execute();
            $result = $stmt->get_result();
            
            $categories = [];
            $total_expenses = floatval($expenses);
            
            while ($row = $result->fetch_assoc()) {
                $categories[] = [
                    'name' => $row['name'],
                    'icon' => $row['icon'],
                    'color' => $row['color'],
                    'total' => floatval($row['total']),
                    'percentage' => $total_expenses > 0 ? (floatval($row['total']) / $total_expenses) * 100 : 0
                ];
            }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'period' => $period,
                'date_range' => [
                    'start' => $start_date,
                    'end' => $end_date
                ],
                'summary' => [
                    'income' => floatval($income),
                    'expenses' => floatval($expenses),
                    'savings' => floatval($savings),
                    'daily_avg' => floatval($daily_avg)
                ],
                'trend' => $trend,
                'categories' => $categories
            ]
        ]);
        break;
        
        echo json_encode([
            'success' => true,
            'data' => [
                'summary' => [
                    'income' => floatval($income),
                    'expenses' => floatval($expenses),
                    'savings' => floatval($savings),
                    'daily_avg' => floatval($daily_avg)
                ],
                'trend' => $trend,
                'categories' => $categories
            ]
        ]);
        break;
    
    // Goals endpoints
    case 'get_goals':
        $stmt = $conn->prepare("
            SELECT * FROM goals 
            WHERE user_id = ? 
            ORDER BY target_date ASC
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $goals = [];
        
        while ($row = $result->fetch_assoc()) {
            $goals[] = $row;
        }
        
        echo json_encode(['success' => true, 'data' => $goals]);
        break;
    
    case 'add_goal':
        $name = $_POST['name'] ?? '';
        $target_amount = $_POST['target_amount'] ?? 0;
        $current_amount = $_POST['current_amount'] ?? 0;
        $target_date = $_POST['target_date'] ?? '';
        $color = $_POST['color'] ?? 'blue';
        $notes = $_POST['notes'] ?? '';
        
        if (empty($name) || $target_amount <= 0 || empty($target_date)) {
            echo json_encode(['success' => false, 'message' => 'Invalid data']);
            exit();
        }
        
        $stmt = $conn->prepare("INSERT INTO goals (user_id, name, target_amount, current_amount, target_date, color, notes) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("isddsss", $user_id, $name, $target_amount, $current_amount, $target_date, $color, $notes);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Goal added successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add goal']);
        }
        break;
    
    case 'update_goal':
        $goal_id = $_POST['goal_id'] ?? 0;
        $name = $_POST['name'] ?? '';
        $target_amount = $_POST['target_amount'] ?? 0;
        $current_amount = $_POST['current_amount'] ?? 0;
        $target_date = $_POST['target_date'] ?? '';
        $color = $_POST['color'] ?? 'blue';
        $notes = $_POST['notes'] ?? '';
        
        $stmt = $conn->prepare("UPDATE goals SET name = ?, target_amount = ?, current_amount = ?, target_date = ?, color = ?, notes = ? WHERE id = ? AND user_id = ?");
        $stmt->bind_param("sddsssii", $name, $target_amount, $current_amount, $target_date, $color, $notes, $goal_id, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Goal updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update goal']);
        }
        break;
    
    case 'delete_goal':
        $goal_id = $_POST['goal_id'] ?? 0;
        
        $stmt = $conn->prepare("DELETE FROM goals WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $goal_id, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Goal deleted']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete goal']);
        }
        break;
    
    case 'contribute_goal':
        $goal_id = $_POST['goal_id'] ?? 0;
        $amount = $_POST['amount'] ?? 0;
        
        $stmt = $conn->prepare("UPDATE goals SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?");
        $stmt->bind_param("dii", $amount, $goal_id, $user_id);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Contribution added']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add contribution']);
        }
        break;

    case 'contribute_goal_v2':
        $goal_id  = $_POST['goal_id']  ?? 0;
        $amount   = floatval($_POST['amount']  ?? 0);
        $source   = $_POST['source']   ?? 'balance';
        $note     = $_POST['note']     ?? 'Savings contribution';

        if ($goal_id <= 0 || $amount <= 0) {
            echo json_encode(['success' => false, 'message' => 'Invalid amount or goal']);
            break;
        }

        // Verify goal belongs to user
        $stmt = $conn->prepare("SELECT id FROM goals WHERE id = ? AND user_id = ?");
        $stmt->bind_param("ii", $goal_id, $user_id);
        $stmt->execute();
        if ($stmt->get_result()->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Goal not found']);
            break;
        }

        $conn->begin_transaction();
        try {
            // If source is balance, record as a transaction (expense)
            $budgets_updated = false;
            if ($source !== 'manual') {
                // Find or create a "Savings" category for this user
                $cat_stmt = $conn->prepare(
                    "SELECT id FROM categories WHERE user_id = ? AND name = 'Savings Goals' AND type = 'expense' LIMIT 1"
                );
                $cat_stmt->bind_param("i", $user_id);
                $cat_stmt->execute();
                $cat_result = $cat_stmt->get_result()->fetch_assoc();

                if ($cat_result) {
                    $cat_id = $cat_result['id'];
                } else {
                    $ins = $conn->prepare(
                        "INSERT INTO categories (user_id, name, type, icon, color, budget) VALUES (?, 'Savings Goals', 'expense', 'fa-piggy-bank', '#06D6A0', 0)"
                    );
                    $ins->bind_param("i", $user_id);
                    $ins->execute();
                    $cat_id = $conn->insert_id;
                }

                $tx_desc = $note ?: 'Savings contribution';
                $tx_date = date('Y-m-d');
                $tx_stmt = $conn->prepare(
                    "INSERT INTO transactions (user_id, category_id, type, amount, description, transaction_date) VALUES (?, ?, 'expense', ?, ?, ?)"
                );
                $tx_stmt->bind_param("iidss", $user_id, $cat_id, $amount, $tx_desc, $tx_date);
                $tx_stmt->execute();
                $budgets_updated = true;
            }

            // Update goal current_amount
            $upd = $conn->prepare("UPDATE goals SET current_amount = current_amount + ? WHERE id = ? AND user_id = ?");
            $upd->bind_param("dii", $amount, $goal_id, $user_id);
            $upd->execute();

            // Record in goal_contributions (if table exists)
            $source_label = $source === 'manual' ? 'Cash / Manual' : 'Available Balance';
            $contrib_check = $conn->query("SHOW TABLES LIKE 'goal_contributions'");
            if ($contrib_check->num_rows > 0) {
                $c_stmt = $conn->prepare(
                    "INSERT INTO goal_contributions (goal_id, user_id, amount, source, note, source_label) VALUES (?, ?, ?, ?, ?, ?)"
                );
                $c_stmt->bind_param("iidsss", $goal_id, $user_id, $amount, $source, $note, $source_label);
                $c_stmt->execute();
            }

            $conn->commit();
            echo json_encode([
                'success'         => true,
                'message'         => 'Contribution saved!',
                'budgets_updated' => $budgets_updated
            ]);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Failed to save contribution: ' . $e->getMessage()]);
        }
        break;

    case 'get_contributions':
        $goal_id = $_GET['goal_id'] ?? 0;
        // Check if table exists first
        $contrib_check = $conn->query("SHOW TABLES LIKE 'goal_contributions'");
        if ($contrib_check->num_rows === 0) {
            echo json_encode(['success' => true, 'data' => []]);
            break;
        }
        $stmt = $conn->prepare(
            "SELECT * FROM goal_contributions WHERE goal_id = ? AND user_id = ? ORDER BY created_at DESC LIMIT 50"
        );
        $stmt->bind_param("ii", $goal_id, $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $contributions = [];
        while ($row = $result->fetch_assoc()) {
            $contributions[] = $row;
        }
        echo json_encode(['success' => true, 'data' => $contributions]);
        break;

    case 'delete_contribution':
        $contribution_id = $_POST['contribution_id'] ?? 0;
        // Check if table exists
        $contrib_check = $conn->query("SHOW TABLES LIKE 'goal_contributions'");
        if ($contrib_check->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Contributions table not found']);
            break;
        }
        // Get contribution details to reverse the goal amount
        $stmt = $conn->prepare(
            "SELECT gc.*, g.user_id as goal_user FROM goal_contributions gc JOIN goals g ON gc.goal_id = g.id WHERE gc.id = ? AND gc.user_id = ?"
        );
        $stmt->bind_param("ii", $contribution_id, $user_id);
        $stmt->execute();
        $contrib = $stmt->get_result()->fetch_assoc();
        if (!$contrib) {
            echo json_encode(['success' => false, 'message' => 'Contribution not found']);
            break;
        }
        $conn->begin_transaction();
        try {
            // Reverse goal amount
            $upd = $conn->prepare("UPDATE goals SET current_amount = GREATEST(current_amount - ?, 0) WHERE id = ? AND user_id = ?");
            $upd->bind_param("dii", $contrib['amount'], $contrib['goal_id'], $user_id);
            $upd->execute();
            // Delete contribution record
            $del = $conn->prepare("DELETE FROM goal_contributions WHERE id = ? AND user_id = ?");
            $del->bind_param("ii", $contribution_id, $user_id);
            $del->execute();
            $conn->commit();
            echo json_encode(['success' => true, 'message' => 'Contribution removed']);
        } catch (Exception $e) {
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => 'Failed to remove contribution']);
        }
        break;

    case 'check_first_time_user':
        // Check if the user has any income transactions
        $stmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM transactions 
            WHERE user_id = ? AND type = 'income'
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        $is_first_time = ($result['count'] == 0);
        
        echo json_encode([
            'success' => true,
            'is_first_time' => $is_first_time
        ]);
        break;

    case 'check_recent_income':
        // Check if the user has added income in the last 5 minutes
        $fiveMinutesAgo = date('Y-m-d H:i:s', strtotime('-5 minutes'));
        
        $stmt = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM transactions 
            WHERE user_id = ? AND type = 'income' AND created_at > ?
        ");
        $stmt->bind_param("is", $user_id, $fiveMinutesAgo);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        $has_recent_income = ($result['count'] > 0);
        
        echo json_encode([
            'success' => true,
            'has_recent_income' => $has_recent_income
        ]);
        break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
}

$conn->close();
?>