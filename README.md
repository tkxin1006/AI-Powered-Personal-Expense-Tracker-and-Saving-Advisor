# AI-Powered Personal Expense Tracker and Saving Advisor
AI-driven personal expense tracker and saving advisor. The platform implements an automated categorization engine using NLP to seamlessly track income, manage budgets, and offer personalized financial insights.

## 🛠️ Required Tools

To run this PHP and MySQL-based application, you will need a local web server stack. The application is optimized for **XAMPP**.

| Tool | Recommended Version | Description | Download Link |
| :--- | :--- | :--- | :--- |
| **XAMPP** | 8.2.12 or higher | Includes Apache Web Server, MySQL (MariaDB 10.4+), and PHP 8.2+. | [Download XAMPP](https://www.apachefriends.org/download.html) |
| **Composer** | 2.6.0 or higher | Dependency manager for PHP (required to install PHPMailer). | [Download Composer](https://getcomposer.org/download/) |
| **Web Browser** | Latest Version | Chrome, Edge, Safari, or Firefox (must support Web Speech API for voice recognition). | [Download Chrome](https://www.google.com/chrome/) |

## 📚 Libraries and Dependencies

The application relies on the following external libraries and CDNs to function correctly:

*   **PHPMailer (v7.1.1):** Used for sending OTP emails during registration and password resets. Installed via Composer.
*   **Chart.js:** Used for rendering the Income vs Expenses and Category Spending charts on the dashboard. Loaded via CDN.
*   **Font Awesome (v6.4.0):** Used for all UI icons throughout the application. Loaded via CDN.
*   **Google Fonts (Poppins):** Used for application typography. Loaded via CDN.

---

## 🚀 Step-by-Step Installation Instructions

Follow these steps carefully to execute the source code on your local environment:

### Step 1: Install and Start XAMPP
1. Download and install XAMPP from the link provided above.
2. Open the XAMPP Control Panel.
3. Start the **Apache** and **MySQL** services.

### Step 2: Setup the Database
1. Open your web browser and navigate to `http://localhost/phpmyadmin`.
2. Create a new database named **finance_tracker**.
3. Click on the "Import" tab at the top of the screen.
4. Click "Choose File" and select the `finance_tracker.sql` file included in your source code.
5. Click the "Import" (or "Go") button at the bottom to create the necessary tables (`users`, `categories`, `transactions`, `goals`, `goal_contributions`).

### Step 3: Install the Application Files
1. Locate your XAMPP installation directory (typically `C:\xampp\` on Windows or `/Applications/XAMPP/` on Mac).
2. Open the `htdocs` folder.
3. Create a new folder named `finance-tracker` inside `htdocs`.
4. Copy all of the provided project files (e.g., `api.php`, `dashboard.php`, `style.css`, `app.js`, etc.) into this new `AI-Powered Personal Expense Tracker and Saving Advisor` folder.

### Step 4: Install PHP Dependencies
1. Open your computer's terminal or command prompt.
2. Navigate to the project directory: `cd C:\xampp\htdocs\AI-Powered Personal Expense Tracker and Saving Advisor` (adjust the path based on your OS).
3. Run the following command to install PHPMailer: 
   ```bash
   composer install

## ✨ ALL Features Included:

### ✅ AI Financial Advisor (Smart Chatbot)
* **Conversational Logging:** Easily add transactions using natural language (e.g., "Lunch at KFC 25").
* **Automated Categorization:** Built-in NLP and merchant-matching logic instantly assigns the correct category.
* **Personalized Insights:** Receive tailored budgeting advice and spending warnings based on your financial habits.

### ✅ Dashboard
* Real-time financial summary
* Income vs Expenses charts
* Spending by category visualization
* Recent transactions list

### ✅ Transactions Page
* View all transactions in table format
* Filter by type, category, and month
* Add new income/expenses
* Delete transactions
* Full transaction history

### ✅ Budgets Page
* Set monthly budgets for each category
* Track spending vs budget
* Visual progress bars
* Budget utilization alerts
* Over-budget warnings

### ✅ Reports Page
* Comprehensive financial reports
* Multiple time period options (current month, last month, 3 months, 6 months, year)
* Income vs Expenses trend charts
* Expense breakdown by category
* Top spending categories
* Average daily spending

### ✅ Savings Goals
* Create multiple savings goals
* Track progress with visual indicators
* Add contributions to goals
* Target date tracking
* Days remaining counter
* Goal achievement notifications

### ✅ Additional Features
* Export data to CSV
* Secure user authentication
* Responsive design (works on all devices)
* Professional UI/UX
* Real-time updates
