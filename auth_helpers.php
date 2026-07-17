<?php
function isStrongPassword($password) {
    return strlen($password) >= 8 &&
           preg_match('/[A-Z]/', $password) &&
           preg_match('/[a-z]/', $password) &&
           preg_match('/[0-9]/', $password) &&
           preg_match('/[\W_]/', $password);
}

function strongPasswordMessage() {
    return 'Password must be at least 8 characters and include uppercase letter, lowercase letter, number, and special character.';
}

function generateOTP() {
    return (string) random_int(100000, 999999);
}

function otpNotExpired($expires) {
    return !empty($expires) && strtotime($expires) >= time();
}

function insertDefaultCategories($conn, $user_id) {
    $default_categories = [
        ['Food & Drinks',              'expense', 'fa-utensils',           '#FF6B35', 0],
        ['Transport',                  'expense', 'fa-car',                '#00B4D8', 0],
        ['Housing & Utilities',        'expense', 'fa-home',               '#FFCE56', 0],
        ['Shopping',                   'expense', 'fa-shopping-cart',      '#7B2FBE', 0],
        ['Entertainment & Lifestyle',  'expense', 'fa-film',               '#2EC4B6', 0],
        ['Healthcare',                 'expense', 'fa-heart',              '#E63946', 0],
        ['Education',                  'expense', 'fa-graduation-cap',     '#F4A261', 0],
        ['Financial & Obligations',    'expense', 'fa-file-invoice-dollar','#3A86FF', 0],
        ['Donations & Gifts',          'expense', 'fa-hand-holding-heart', '#E91E8C', 0],
        ['Miscellaneous',              'expense', 'fa-ellipsis-h',         '#6B7280', 0],
        ['Salary',       'income', 'fa-money-bill-wave', '#2D6A4F', 0],
        ['Freelance',    'income', 'fa-laptop',          '#06D6A0', 0],
        ['Investment',   'income', 'fa-chart-line',      '#118AB2', 0],
        ['Gift',         'income', 'fa-gift',            '#FFD166', 0],
        ['Other Income', 'income', 'fa-coins',           '#9B5DE5', 0],
    ];

    $cat_stmt = $conn->prepare("INSERT INTO categories (user_id, name, type, icon, color, budget) VALUES (?, ?, ?, ?, ?, ?)");
    foreach ($default_categories as $cat) {
        $cat_stmt->bind_param("issssd", $user_id, $cat[0], $cat[1], $cat[2], $cat[3], $cat[4]);
        $cat_stmt->execute();
    }
    $cat_stmt->close();
}
?>
