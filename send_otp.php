<?php
/*
    OTP Email Helper for Finance Tracker

    STEP 1: Install PHPMailer in your project folder:
        composer require phpmailer/phpmailer

    STEP 2: Use Gmail App Password, not your normal Gmail password.
    Gmail App Password can be created after enabling 2-Step Verification.
*/

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require_once __DIR__ . '/vendor/autoload.php';

function sendOTPEmail($toEmail, $otp, $purpose = 'verification') {
    $mail = new PHPMailer(true);

    try {
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;

        // CHANGE THESE TWO VALUES
        $mail->Username   = 'chocojoyexpress@gmail.com';
        $mail->Password   = 'ssrp esjg itao dcge';

        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port       = 587;

        $mail->setFrom('your_email@gmail.com', 'Finance Tracker');
        $mail->addAddress($toEmail);

        $mail->isHTML(true);

        if ($purpose === 'reset') {
            $mail->Subject = 'Finance Tracker Password Reset OTP';
            $title = 'Password Reset Verification';
            $message = 'Use this OTP to reset your Finance Tracker password.';
        } else {
            $mail->Subject = 'Finance Tracker Registration OTP';
            $title = 'Account Registration Verification';
            $message = 'Use this OTP to complete your Finance Tracker registration.';
        }

        $mail->Body = "
            <div style='font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e5e7eb; border-radius: 12px;'>
                <h2 style='color:#5b7cff;'>Finance Tracker</h2>
                <h3>{$title}</h3>
                <p>{$message}</p>
                <div style='font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #111827; background: #f3f4f6; padding: 16px; text-align: center; border-radius: 10px;'>
                    {$otp}
                </div>
                <p style='margin-top: 18px; color: #6b7280;'>This OTP will expire in 5 minutes.</p>
                <p style='color: #6b7280;'>If you did not request this, please ignore this email.</p>
            </div>
        ";

        $mail->AltBody = "Your Finance Tracker OTP is: {$otp}. This OTP will expire in 5 minutes.";

        return $mail->send();
    } catch (Exception $e) {
        return false;
    }
}
?>
