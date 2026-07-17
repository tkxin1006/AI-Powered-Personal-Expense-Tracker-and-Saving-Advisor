<?php
require_once 'config.php';
require_once 'send_otp.php';
require_once 'auth_helpers.php';

if (isset($_SESSION['user_id'])) {
    header('Location: dashboard.php');
    exit();
}

if (!isset($_SESSION['reset_email'])) {
    header('Location: forgot_password.php');
    exit();
}

$error = '';
$success = '';
$email = $_SESSION['reset_email'];

if (isset($_GET['resend']) && $_GET['resend'] == '1') {
    $otp = generateOTP();
    $expires = date('Y-m-d H:i:s', time() + 300);

    $stmt = $conn->prepare("UPDATE users SET reset_otp = ?, reset_otp_expires = ? WHERE email = ?");
    $stmt->bind_param("sss", $otp, $expires, $email);

    if ($stmt->execute() && sendOTPEmail($email, $otp, 'reset')) {
        $success = 'A new OTP has been sent to your email.';
    } else {
        $error = 'Failed to resend OTP.';
    }

    $stmt->close();
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $otp_input = trim($_POST['otp'] ?? '');

    if (empty($otp_input)) {
        $error = 'Please enter the OTP.';
    } else {
        $stmt = $conn->prepare("SELECT reset_otp, reset_otp_expires FROM users WHERE email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $user = $stmt->get_result()->fetch_assoc();

        if (!$user) {
            $error = 'Account not found.';
        } elseif (!otpNotExpired($user['reset_otp_expires'])) {
            $error = 'OTP expired. Please request a new OTP.';
        } elseif ($otp_input !== $user['reset_otp']) {
            $error = 'Invalid OTP. Please try again.';
        } else {
            $_SESSION['reset_verified'] = true;
            header('Location: reset_password.php');
            exit();
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
    <title>Verify Reset OTP - Finance Tracker</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-box">
            <div class="auth-header">
                <i class="fas fa-key"></i>
                <h1>Verify OTP</h1>
                <p>Enter the OTP sent to <?php echo htmlspecialchars($email); ?></p>
            </div>

            <?php if ($error): ?>
                <div class="alert alert-error"><i class="fas fa-exclamation-circle"></i> <?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <?php if ($success): ?>
                <div class="alert alert-success"><i class="fas fa-check-circle"></i> <?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>

            <form method="POST" action="" class="auth-form">
                <div class="form-group">
                    <label for="otp"><i class="fas fa-key"></i> OTP Code</label>
                    <input type="text" id="otp" name="otp" maxlength="6" required placeholder="Enter 6-digit OTP">
                </div>

                <button type="submit" class="btn btn-primary btn-block">
                    <i class="fas fa-check"></i> Verify OTP
                </button>
            </form>

            <div class="auth-footer">
                <p>Didn't receive OTP? <a href="verify_reset_otp.php?resend=1">Resend OTP</a></p>
                <p><a href="forgot_password.php">Back</a></p>
            </div>
        </div>
    </div>
</body>
</html>
