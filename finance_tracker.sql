-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 17, 2026 at 05:04 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `finance_tracker`
--

-- --------------------------------------------------------

--
-- Table structure for table `categories`
--

CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `icon` varchar(50) DEFAULT 'fa-circle',
  `color` varchar(20) DEFAULT '#4361ee',
  `budget` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `categories`
--

INSERT INTO `categories` (`id`, `user_id`, `name`, `type`, `icon`, `color`, `budget`) VALUES
(1, 1, 'Food & Drinks', 'expense', 'fa-utensils', '#FF6B35', 937.44),
(2, 1, 'Transport', 'expense', 'fa-car', '#00B4D8', 468.72),
(3, 1, 'Housing & Utilities', 'expense', 'fa-home', '#FFCE56', 1406.16),
(4, 1, 'Shopping', 'expense', 'fa-shopping-cart', '#7B2FBE', 468.72),
(5, 1, 'Entertainment & Lifestyle', 'expense', 'fa-film', '#2EC4B6', 234.36),
(6, 1, 'Healthcare', 'expense', 'fa-heart', '#E63946', 234.36),
(7, 1, 'Education', 'expense', 'fa-graduation-cap', '#F4A261', 140.62),
(8, 1, 'Financial & Obligations', 'expense', 'fa-file-invoice-dollar', '#3A86FF', 703.08),
(9, 1, 'Donations & Gifts', 'expense', 'fa-hand-holding-heart', '#E91E8C', 93.74),
(10, 1, 'Miscellaneous', 'expense', 'fa-ellipsis-h', '#6B7280', 0.00),
(11, 1, 'Salary', 'income', 'fa-money-bill-wave', '#2D6A4F', 0.00),
(12, 1, 'Freelance', 'income', 'fa-laptop', '#06D6A0', 0.00),
(13, 1, 'Investment', 'income', 'fa-chart-line', '#118AB2', 0.00),
(14, 1, 'Gift', 'income', 'fa-gift', '#FFD166', 0.00),
(15, 1, 'Other Income', 'income', 'fa-coins', '#9B5DE5', 0.00),
(16, 1, 'Savings Goals', 'expense', 'fa-piggy-bank', '#06D6A0', 0.00),
(17, 2, 'Food & Drinks', 'expense', 'fa-utensils', '#FF6B35', 0.00),
(18, 2, 'Transport', 'expense', 'fa-car', '#00B4D8', 0.00),
(19, 2, 'Housing & Utilities', 'expense', 'fa-home', '#FFCE56', 0.00),
(20, 2, 'Shopping', 'expense', 'fa-shopping-cart', '#7B2FBE', 0.00),
(21, 2, 'Entertainment & Lifestyle', 'expense', 'fa-film', '#2EC4B6', 0.00),
(22, 2, 'Healthcare', 'expense', 'fa-heart', '#E63946', 0.00),
(23, 2, 'Education', 'expense', 'fa-graduation-cap', '#F4A261', 0.00),
(24, 2, 'Financial & Obligations', 'expense', 'fa-file-invoice-dollar', '#3A86FF', 0.00),
(25, 2, 'Donations & Gifts', 'expense', 'fa-hand-holding-heart', '#E91E8C', 0.00),
(26, 2, 'Miscellaneous', 'expense', 'fa-ellipsis-h', '#6B7280', 0.00),
(27, 2, 'Salary', 'income', 'fa-money-bill-wave', '#2D6A4F', 0.00),
(28, 2, 'Freelance', 'income', 'fa-laptop', '#06D6A0', 0.00),
(29, 2, 'Investment', 'income', 'fa-chart-line', '#118AB2', 0.00),
(30, 2, 'Gift', 'income', 'fa-gift', '#FFD166', 0.00),
(31, 2, 'Other Income', 'income', 'fa-coins', '#9B5DE5', 0.00);

-- --------------------------------------------------------

--
-- Table structure for table `goals`
--

CREATE TABLE `goals` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `target_amount` decimal(10,2) NOT NULL,
  `current_amount` decimal(10,2) DEFAULT 0.00,
  `target_date` date NOT NULL,
  `color` varchar(20) DEFAULT 'blue',
  `notes` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `goals`
--

INSERT INTO `goals` (`id`, `user_id`, `name`, `target_amount`, `current_amount`, `target_date`, `color`, `notes`, `created_at`) VALUES
(1, 1, 'Bangkok Trip', 2000.00, 2000.00, '2026-10-06', 'rose', '', '2026-06-14 15:01:55'),
(2, 1, 'SHANGHAI TRIP', 2000.00, 300.00, '2026-07-31', 'teal', '', '2026-06-17 07:29:25');

-- --------------------------------------------------------

--
-- Table structure for table `goal_contributions`
--

CREATE TABLE `goal_contributions` (
  `id` int(11) NOT NULL,
  `goal_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `source` varchar(50) DEFAULT 'balance',
  `source_label` varchar(100) DEFAULT 'Balance',
  `note` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `goal_contributions`
--

INSERT INTO `goal_contributions` (`id`, `goal_id`, `user_id`, `amount`, `source`, `source_label`, `note`, `created_at`) VALUES
(1, 1, 1, 30.00, 'balance', 'Available Balance', 'Savings contribution', '2026-06-14 15:03:07'),
(5, 1, 1, 1970.00, 'balance', 'Available Balance', 'Savings contribution', '2026-06-17 13:23:58');

-- --------------------------------------------------------

--
-- Table structure for table `transactions`
--

CREATE TABLE `transactions` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `description` varchar(255) NOT NULL,
  `transaction_date` date NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `transactions`
--

INSERT INTO `transactions` (`id`, `user_id`, `category_id`, `type`, `amount`, `description`, `transaction_date`, `created_at`) VALUES
(1, 1, 1, 'expense', 12.00, 'MCD', '2026-06-14', '2026-06-14 14:15:56'),
(2, 1, 1, 'expense', 12.00, 'KFC', '2026-06-14', '2026-06-14 14:16:49'),
(3, 1, 8, 'expense', 120.00, 'AIA', '2026-06-14', '2026-06-14 14:16:54'),
(4, 1, 4, 'expense', 98.00, 'MR DIY', '2026-06-14', '2026-06-14 14:17:02'),
(5, 1, 11, 'income', 1500.00, 'may salary', '2026-05-14', '2026-06-14 14:19:28'),
(6, 1, 2, 'expense', 25.00, 'grab', '2026-06-14', '2026-06-14 14:20:06'),
(7, 1, 1, 'expense', 24.00, 'grabfood', '2026-05-13', '2026-06-14 14:20:29'),
(8, 1, 11, 'income', 3000.00, 'june salary', '2026-06-14', '2026-06-14 14:20:57'),
(9, 1, 3, 'expense', 25.66, 'tnb', '2026-06-01', '2026-06-14 14:27:46'),
(10, 1, 12, 'income', 150.00, 'grab driver', '2026-06-04', '2026-06-14 14:28:46'),
(11, 1, 4, 'expense', 15.99, 'pdd', '2026-06-05', '2026-06-14 14:30:02'),
(12, 1, 1, 'expense', 12.00, 'foodpanda', '2026-06-07', '2026-06-14 14:30:39'),
(13, 1, 1, 'expense', 17.00, 'lunch at madam yam foodcourt', '2026-06-13', '2026-06-14 14:32:49'),
(14, 1, 3, 'expense', 15.90, 'tnb', '2026-05-07', '2026-06-14 14:34:18'),
(15, 1, 4, 'expense', 438.25, 'huawei watch', '2026-05-25', '2026-06-14 14:35:18'),
(16, 1, 3, 'expense', 250.00, 'room rental', '2026-06-02', '2026-06-14 14:36:34'),
(17, 1, 2, 'expense', 2.50, 'lrt ', '2026-06-12', '2026-06-14 14:36:53'),
(18, 1, 1, 'expense', 18.00, 'grab food', '2026-06-08', '2026-06-14 14:37:09'),
(19, 1, 5, 'expense', 20.00, 'gsc cinema', '2026-05-18', '2026-06-14 14:39:13'),
(20, 1, 5, 'expense', 18.00, 'gsc', '2026-06-07', '2026-06-14 14:40:01'),
(21, 1, 12, 'income', 58.00, 'lalamove driver', '2026-06-08', '2026-06-14 14:40:35'),
(22, 1, 1, 'expense', 12.00, 'mamak', '2026-06-12', '2026-06-14 14:40:59'),
(23, 1, 1, 'expense', 12.00, 'mamak', '2026-06-08', '2026-06-14 14:41:10'),
(24, 1, 7, 'expense', 12.00, 'popular book store', '2026-06-09', '2026-06-14 14:42:21'),
(25, 1, 1, 'expense', 8.90, 'nasi goreng kampung', '2026-06-14', '2026-06-14 14:56:35'),
(26, 1, 16, 'expense', 30.00, 'Savings contribution', '2026-06-14', '2026-06-14 15:03:07'),
(27, 1, 4, 'expense', 150.00, 'yonex badminton racket', '2026-06-15', '2026-06-14 18:05:00'),
(28, 1, 5, 'expense', 20.00, 'afa badminton court booking', '2026-06-15', '2026-06-14 18:05:20'),
(29, 1, 1, 'expense', 12.00, 'llao llao gelato', '2026-06-15', '2026-06-14 18:06:52'),
(30, 1, 7, 'expense', 12.00, 'magicbook', '2026-06-15', '2026-06-14 18:08:28'),
(33, 1, 1, 'expense', 150.00, 'seafood restaurant', '2026-06-17', '2026-06-17 13:08:56'),
(34, 1, 1, 'expense', 600.00, 'food', '2026-06-17', '2026-06-17 13:09:38'),
(36, 1, 12, 'income', 2000.00, 'freelance', '2026-06-17', '2026-06-17 13:21:55'),
(38, 1, 16, 'expense', 150.00, 'Savings contribution', '2026-06-17', '2026-06-17 13:23:03'),
(39, 1, 16, 'expense', 1970.00, 'Savings contribution', '2026-06-17', '2026-06-17 13:23:58'),
(41, 2, 18, 'expense', 13.00, 'grab', '2026-06-17', '2026-06-17 14:29:27'),
(42, 2, 20, 'expense', 12.00, 'padini', '2026-06-17', '2026-06-17 14:29:47'),
(43, 2, 17, 'expense', 12.00, 'grabfood', '2026-06-17', '2026-06-17 14:29:55'),
(44, 2, 18, 'expense', 12.00, 'grabcar', '2026-06-17', '2026-06-17 14:30:04'),
(45, 2, 18, 'expense', 12.00, 'petronas', '2026-06-17', '2026-06-17 14:30:09'),
(46, 2, 17, 'expense', 12.00, 'madam yam food court', '2026-06-17', '2026-06-17 14:30:47'),
(47, 2, 17, 'expense', 1.00, 'teh o ais limau', '2026-06-17', '2026-06-17 14:31:05'),
(48, 2, 17, 'expense', 4.00, 'mee goreng', '2026-06-17', '2026-06-17 14:31:12');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_verified` tinyint(1) DEFAULT 1,
  `reset_otp` varchar(10) DEFAULT NULL,
  `reset_otp_expires` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password`, `created_at`, `is_verified`, `reset_otp`, `reset_otp_expires`) VALUES
(1, 'KAI XIN', 'teekxin1006@gmail.com', '$2y$10$qpJqHhqhqGlkoc3tvEgaXesTLUkGKEUnvR.VCguaWVU118gfnzUtO', '2026-06-14 14:13:18', 1, NULL, NULL),
(2, 'tee', 'vanessatee88@gmail.com', '$2y$10$3SzCrV5fACswtjf3Kcx4ie7X6vS3nsHI2gWoWQZONqCh3B3/9U7pm', '2026-06-17 14:29:01', 1, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `categories`
--
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `goals`
--
ALTER TABLE `goals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `goal_contributions`
--
ALTER TABLE `goal_contributions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `goal_id` (`goal_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `transactions`
--
ALTER TABLE `transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `category_id` (`category_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `categories`
--
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `goals`
--
ALTER TABLE `goals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `goal_contributions`
--
ALTER TABLE `goal_contributions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `transactions`
--
ALTER TABLE `transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=49;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `categories`
--
ALTER TABLE `categories`
  ADD CONSTRAINT `categories_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `goals`
--
ALTER TABLE `goals`
  ADD CONSTRAINT `goals_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `goal_contributions`
--
ALTER TABLE `goal_contributions`
  ADD CONSTRAINT `goal_contributions_ibfk_1` FOREIGN KEY (`goal_id`) REFERENCES `goals` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `goal_contributions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `transactions`
--
ALTER TABLE `transactions`
  ADD CONSTRAINT `transactions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `transactions_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
