<?php
require_once 'config.php';

if (!isset($_SESSION['user_id'])) {
    header('Location: login.php');
    exit();
}

$user_id = $_SESSION['user_id'];
$username = $_SESSION['username'];
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AI Assistant - Finance Tracker</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="app-wrapper">
        <?php include 'sidebar.php'; ?>

        <main class="main-container ai-chat-main">
            <header class="page-header">
                <h1><i class="fas fa-robot"></i> AI Assistant</h1>
                <div class="header-actions">
                    <a href="logout.php" class="btn-logout" title="Logout">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                </div>
            </header>

            <div class="chat-container">
                <div class="chat-header">
                    <div class="history-status" id="history-status">
                        <i class="fas fa-history"></i>
                        <span class="history-count" id="history-count">0 messages</span>
                    </div>
                    
                    <h2>💬 AI Financial Advisor</h2>
                    <p>I analyze your spending and give personalized advice!</p>
                    
                    <button class="clear-history-btn" onclick="clearChatConversation()" title="Clear entire chat history">
                        <i class="fas fa-trash-alt"></i>
                        Clear History
                    </button>
                </div>

                <div class="chat-messages" id="chat-messages">
                    <div class="welcome-message" id="welcome-message">
                        <h3>👋 Hi! I'm your Smart AI Financial Advisor</h3>
                        <p>I don't just track expenses - I analyze your spending habits and give you personalized advice!</p>
                        <p style="font-size: 12px; color: #999; margin-top: 10px;">
                            <i class="fas fa-info-circle"></i> Your chat history is automatically saved and will be restored when you return
                        </p>
                        
                        <div class="welcome-examples">
                            <div class="example-card" onclick="sendExample('grab 50')">
                                <div class="icon">🚗</div>
                                <div class="text">"grab 50"</div>
                            </div>
                            <div class="example-card" onclick="sendExample('analyze my spending')">
                                <div class="icon">📊</div>
                                <div class="text">"analyze my spending"</div>
                            </div>
                            <div class="example-card" onclick="sendExample('am I overspending?')">
                                <div class="icon">⚠️</div>
                                <div class="text">"am I overspending?"</div>
                            </div>
                            <div class="example-card" onclick="sendExample('suggest daily meals')">
                                <div class="icon">🍳</div>
                                <div class="text">"suggest daily meals"</div>
                            </div>
                        </div>
                    </div>

                    <div class="message message-ai" style="display: none;">
                        <div class="message-avatar">
                            <i class="fas fa-robot"></i>
                        </div>
                        <div class="message-content">
                            <div class="typing-indicator">
                                <span></span>
                                <span></span>
                                <span></span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="quick-actions">
                    <button class="quick-action-btn" onclick="sendQuickAction('analyze my spending')">
                        📊 Analyze Spending
                    </button>
                    <button class="quick-action-btn" onclick="sendQuickAction('am I overspending?')">
                        ⚠️ Budget Check
                    </button>
                    <button class="quick-action-btn" onclick="sendQuickAction('give me advice')">
                        💡 Get Advice
                    </button>
                    <button class="quick-action-btn" onclick="sendQuickAction('suggest daily meals')">
                        🍳 Meal Suggestions
                    </button>
                    <!-- <button class="quick-action-btn" onclick="sendQuickAction('Show my balance')">
                        💰 Balance
                    </button> -->
                </div>

                <div class="chat-input-container">
                    <div class="chat-input-wrapper">
                        <button class="voice-btn" id="voice-btn" title="Click to speak">
                            <i class="fas fa-microphone"></i>
                        </button>

                        <input 
                            type="text" 
                            class="chat-input" 
                            id="chat-input" 
                            placeholder="Type anything... (e.g., 'grab 50' or 'lunch at KFC 25')"
                            autocomplete="off"
                        >
                        <button class="chat-send-btn" id="send-btn" onclick="sendMessage()">
                            <i class="fas fa-paper-plane"></i>
                        </button>
                    </div>
                </div>
            </div>
        </main>
    </div>

    <script src="malaysian-category-patterns.js"></script>
    <script src="category-detector.js"></script>
    <script src="ai-chat.js"></script>
    <script>
        function exportData() {
            window.location.href = 'export.php';
        }

        function updateHistoryCount() {
            const historyCount = document.getElementById('history-count');
            if (historyCount && typeof chatHistory !== 'undefined') {
                const count = chatHistory.length;
                historyCount.textContent = `${count} message${count !== 1 ? 's' : ''}`;
            }
        }

        setInterval(updateHistoryCount, 1000);
    </script>
</body>
</html>