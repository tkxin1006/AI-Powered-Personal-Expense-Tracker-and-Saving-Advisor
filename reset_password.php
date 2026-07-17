<?php
require_once 'config.php';
require_once 'auth_helpers.php';

if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit();
}

if (!isset($_SESSION['reset_email']) || empty($_SESSION['reset_verified'])) {
    header('Location: forgot_password.php');
    exit();
}

$error = '';
$success = '';
$email = $_SESSION['reset_email'];

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $new_password = $_POST['new_password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';

    if (empty($new_password) || empty($confirm_password)) {
        $error = 'Please fill in all fields.';
    } elseif ($new_password !== $confirm_password) {
        $error = 'Passwords do not match.';
    } elseif (!isStrongPassword($new_password)) {
        $error = strongPasswordMessage();
    } else {
        $stmt = $conn->prepare("SELECT password FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user) {
            $error = 'Account not found.';
        } elseif (password_verify($new_password, $user['password'])) {
            $error = 'New password cannot be the same as the old password.';
        } else {
            $new_hash = password_hash($new_password, PASSWORD_DEFAULT);

            $stmt = $conn->prepare("UPDATE users SET password = ?, reset_otp = NULL, reset_otp_expires = NULL WHERE email = ?");
            $stmt->bind_param("ss", $new_hash, $email);

            if ($stmt->execute()) {
                unset($_SESSION['reset_email']);
                unset($_SESSION['reset_verified']);
                $success = 'Password changed successfully! You can now login with your new password.';
            } else {
                $error = 'Failed to update password. Please try again.';
            }
        }

        $stmt->close();
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Finance Tracker</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-header">
                <i class="fas fa-lock"></i>
                <h1>Reset Password</h1>
                <p>Create a new strong password</p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> <?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success"><i class="fas fa-check-circle"></i> <?php echo htmlspecialchars($success); ?></div>
                <div class="auth-footer">
                    <p><a href="login.php">Go to Login</a></p>
                </div>
            <?php else: ?>
                <form method="POST" action="" class="auth-form">
                    <div class="form-group">
                        <label for="new_password"><i class="fas fa-lock"></i> New Password</label>
                        <input type="password" id="new_password" name="new_password" required>
                        <small style="color: var(--text-gray); font-size: 12px;">
                            Minimum 8 characters with uppercase, lowercase, number, and special character.
                        </small>
                    </div>

                    <div class="form-group">
                        <label for="confirm_password"><i class="fas fa-lock"></i> Confirm New Password</label>
                        <input type="password" id="confirm_password" name="confirm_password" required>
                    </div>

                    <button type="submit" class="btn btn-primary btn-block">
                        <i class="fas fa-save"></i> Change Password
                    </button>
                </form>
            <?php endif; ?>
        </div>
    </div>
</body>
</html>
