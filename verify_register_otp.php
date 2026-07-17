<?php
require_once 'config.php';
require_once 'auth_helpers.php';

if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit();
}

$error = '';
$success = '';
$email_display = '';

if (isset($_SESSION['pending_registration']['email'])) {
    $email_display = $_SESSION['pending_registration']['email'];
}

if (!isset($_SESSION['pending_registration']) && !isset($_SESSION['verified_email'])) {
    header('Location: register.php');
    exit();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $otp = trim($_POST['otp'] ?? '');

    if (!isset($_SESSION['pending_registration'])) {
        $error = 'Registration session expired. Please register again.';
    } elseif (empty($otp)) {
        $error = 'Please enter the OTP.';
    } elseif ($otp !== $_SESSION['pending_registration']['otp']) {
        $error = 'Invalid OTP. Please try again.';
    } elseif (time() > $_SESSION['pending_registration']['expires']) { // FIXED: Key changed to 'expires'
        $error = 'OTP has expired. Please register again.';
        unset($_SESSION['pending_registration']);
    } else {
        $username = $_SESSION['pending_registration']['username'];
        $email = $_SESSION['pending_registration']['email'];
        
        // FIXED: Retrieve pre-hashed password correctly instead of trying to hash a missing plain text password
        $hashed_password = $_SESSION['pending_registration']['password_hash']; 

        $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
        $stmt->bind_param("sss", $username, $email, $hashed_password);

        if ($stmt->execute()) {
            $user_id = $stmt->insert_id;

            $default_categories = [
                ['Food & Drinks', 'expense', 'fa-utensils', '#FF6B35', 0],
                ['Transport', 'expense', 'fa-car', '#00B4D8', 0],
                ['Housing & Utilities', 'expense', 'fa-home', '#FFCE56', 0],
                ['Shopping', 'expense', 'fa-shopping-cart', '#7B2FBE', 0],
                ['Entertainment & Lifestyle', 'expense', 'fa-film', '#2EC4B6', 0],
                ['Healthcare', 'expense', 'fa-heart', '#E63946', 0],
                ['Education', 'expense', 'fa-graduation-cap', '#F4A261', 0],
                ['Financial & Obligations', 'expense', 'fa-file-invoice-dollar', '#3A86FF', 0],
                ['Donations & Gifts', 'expense', 'fa-hand-holding-heart', '#E91E8C', 0],
                ['Miscellaneous', 'expense', 'fa-ellipsis-h', '#6B7280', 0],

                ['Salary', 'income', 'fa-money-bill-wave', '#2D6A4F', 0],
                ['Freelance', 'income', 'fa-laptop', '#06D6A0', 0],
                ['Investment', 'income', 'fa-chart-line', '#118AB2', 0],
                ['Gift', 'income', 'fa-gift', '#FFD166', 0],
                ['Other Income', 'income', 'fa-coins', '#9B5DE5', 0],
            ];

            $cat_stmt = $conn->prepare("
                INSERT INTO categories (user_id, name, type, icon, color, budget) 
                VALUES (?, ?, ?, ?, ?, ?)
            ");

            foreach ($default_categories as $cat) {
                $cat_stmt->bind_param("issssd", $user_id, $cat[0], $cat[1], $cat[2], $cat[3], $cat[4]);
                $cat_stmt->execute();
            }

            $cat_stmt->close();

            $_SESSION['verified_email'] = $email;
            unset($_SESSION['pending_registration']);

            $success = 'Email verified successfully! You can now login.';
            $email_display = $_SESSION['verified_email'];
        } else {
            $error = 'Account creation failed. Please try again.';
        }

        $stmt->close();
    }
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Email Verification - Finance Tracker</title>
    <link rel="stylesheet" href="style.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-header">
                <i class="fas fa-shield-alt"></i>
                <h1>Email Verification</h1>
                <p>Enter the OTP sent to <?php echo htmlspecialchars($email_display); ?></p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error">
                    <?php echo htmlspecialchars($error); ?>
                </div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success">
                    <?php echo htmlspecialchars($success); ?>
                </div>

                <div class="auth-footer">
                    <a href="login.php">Go to Login</a>
                </div>
            <?php else: ?>
                <form method="POST" class="auth-form">
                    <div class="form-group">
                        <label>OTP Code</label>
                        <input type="text" name="otp" placeholder="Enter 6-digit OTP" maxlength="6" required>
                    </div>

                    <button type="submit" class="btn-primary btn-block">
                        Verify Email
                    </button>
                </form>

                <div class="auth-footer">
                    <p>Wrong email? <a href="register.php">Register again</a></p>
                </div>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>