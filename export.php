<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

$user_id = $_SESSION['user_id'];

// Get all transactions
$stmt = $conn->prepare("
    SELECT t.*, c.name as category_name 
    FROM transactions t 
    JOIN categories c ON t.category_id = c.id 
    WHERE t.user_id = ? 
    ORDER BY t.transaction_date DESC
");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

// Set headers for CSV download
header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="transactions_' . date('Y-m-d') . '.csv"');

// Create output stream
$output = fopen('php://output', 'w');

// Add CSV headers
fputcsv($output, ['Date', 'Type', 'Category', 'Description', 'Amount']);

// Add data rows
while ($row = $result->fetch_assoc()) {
    fputcsv($output, [
        $row['transaction_date'],
        ucfirst($row['type']),
        $row['category_name'],
        $row['description'],
        number_format($row['amount'], 2)
    ]);
}

fclose($output);
$stmt->close();
$conn->close();
?>
