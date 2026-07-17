<?php
require_once 'config.php';
require_once 'send_otp.php';
require_once 'auth_helpers.php';

if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit();
}

$error = '';
$success = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');

    if (empty($email)) {
        $error = 'Please enter your email address.';
    } elseif (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Please enter a valid email address.';
    } else {
        $stmt = $conn->prepare("SELECT id, email FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user) {
            $error = 'No account found with this email.';
        } else {
            $otp = generateOTP();
            $expires = date('Y-m-d H:i:s', time() + 300);

            $stmt = $conn->prepare("UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE email = ?");
            $stmt->bind_param("sss", $otp, $expires, $email);

            if ($stmt->execute() && sendOTPEmail($email, $otp, 'reset')) {
                $_SESSION['reset_email'] = $email;
                header('Location: verify_reset_otp.php');
                exit();
            } else {
                $error = 'Failed to send OTP. Please check your SMTP settings.';
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
    <title>Forgot Password - Finance Tracker</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-header">
                <i class="fas fa-unlock-alt"></i>
                <h1>Forgot Password</h1>
                <p>Enter your email to receive an OTP</p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> <?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success"><i class="fas fa-check-circle"></i> <?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>

            <form method="POST" action="" class="auth-form">
                <div class="form-group">
                    <label for="email"><i class="fas fa-envelope"></i> Email Address</label>
                    <input type="email" id="email" name="email" required value="<?php echo htmlspecialchars($_POST['email'] ?? ''); ?>">
                </div>

                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-paper-plane"></i> Send OTP
                </button>
            </form>

            <div class="auth-footer">
                <p>Remember your password? <a href="login.php">Login here</a></p>
            </div>
        </div>
    </div>
</body>
</html>
