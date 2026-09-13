-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Sep 13, 2026 at 10:11 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.1.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `banki_mahotsav`
--

-- --------------------------------------------------------

--
-- Table structure for table `books`
--

CREATE TABLE `books` (
  `id` varchar(64) NOT NULL,
  `slug` varchar(191) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `author` varchar(255) DEFAULT NULL,
  `publisher` varchar(255) DEFAULT NULL,
  `published_year` varchar(32) DEFAULT NULL,
  `language` varchar(64) DEFAULT NULL,
  `category` varchar(128) DEFAULT NULL,
  `pages` varchar(32) DEFAULT NULL,
  `excerpt` text DEFAULT NULL,
  `body` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `highlights` text DEFAULT NULL,
  `featured` tinyint(1) DEFAULT 0,
  `pdf` varchar(500) DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `books`
--

INSERT INTO `books` (`id`, `slug`, `title`, `author`, `publisher`, `published_year`, `language`, `category`, `pages`, `excerpt`, `body`, `image`, `highlights`, `featured`, `pdf`, `active`, `sort_order`) VALUES
('4cbb79d8-53f6-4d78-9588-25056e95f615', 'shakti-peethas-of-coastal-odisha', 'Shakti Peethas of Coastal Odisha', 'Regional research notes', 'Heritage series', '2021', 'English', 'History', '128', 'A readable introduction to coastal Odisha\'s Shakti shrines, with a chapter on Charchika Temple, Ruchika Parvata, and the Renuka river.', 'This book places Charchika Temple among the Shakti peethas of coastal Odisha. It describes the hill shrine, the river below, and how local worship sits beside wider Chamunda and Durga traditions.\n\nA dedicated chapter follows the pilgrim path at Banki and the seasonal gatherings of Chaitra and Sharadiya.\n\nMaps, short notes, and a glossary help first-time visitors and students of Odisha\'s sacred geography.', 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Temple geography, Chamunda tradition, Pilgrim path, Glossary', 0, '/books/sample.pdf', 1, 4),
('7dbb9cba-872a-4237-91ec-9f0106b780f6', 'pala-and-sankirtan-of-banki', 'Pala and Sankirtan of Banki', 'Folk arts archive', 'Mahotsav cultural cell', '2019', 'Odia', 'Folk arts', '112', 'Notes on pala, sankirtan, and night-long kirtan that fill Banki during Mahotsav and temple festivals.', 'Banki\'s festivals are not only puja. Stages and courtyards fill with pala, sankirtan, and folk song. This book records performers, typical sequences, and the way these arts sit beside Charchika worship.\n\nIt is written for students, artistes, and families who want to follow the cultural nights of the Mahotsav with more understanding.\n\nPhotographs and programme notes from past editions are included as a small archive.', 'https://images.pexels.com/photos/694740/pexels-photo-694740.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Pala, Sankirtan, Cultural nights, Performer notes', 0, '/books/sample.pdf', 1, 3),
('de3b3fb6-2738-42a2-b486-a4c3e624ee88', 'banki-mahotsav-smriti-grantha', 'Banki Mahotsav Smriti Grantha', 'Banki Mahotsav Committee', 'Banki Mahotsav', '2024', 'Odia & English', 'Literature', '180', 'The souvenir volume of Banki Mahotsav — essays, poems, photographs, and Charchika Samman notes from writers and artistes of the region.', 'Each edition of Banki Mahotsav publishes a smriti grantha that records the year\'s literature, folk arts, and community programmes. This volume brings together Odia poems, essays on Banki\'s cultural memory, and photographs from the stage and the shrine.\n\nIt also documents Charchika Samman and the social harmony that the Mahotsav tries to keep alive.\n\nKeep this book as a companion to the festival: it is meant for readers at home as much as for visitors in Banki.', 'https://images.pexels.com/photos/256450/pexels-photo-256450.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Poems and essays, Festival photographs, Charchika Samman, Bilingual notes', 1, '/books/sample.pdf', 1, 1),
('f154147f-446d-45b5-8d59-51d2ae7f2238', 'charchika-mahatmya', 'Charchika Mahatmya', 'Temple literary committee', 'Banki Mahotsav', '2018', 'Odia', 'Devotional', '96', 'A short mahatmya of Maa Charchika — the eight-armed goddess of Ruchika Parvata, her legends, daily seva, and the faith of Banki.', 'Charchika Mahatmya gathers the living stories of Maa Charchika, the Ashta-bhuja Chamunda of Banki. It retells how the shrine on Ruchika Parvata became a Shakti peetha for Cuttack district, and how families still climb the hill for darshan, anjali, and vows.\n\nThe booklet also describes daily puja, special Ashtami rites, and the way Banki Mahotsav keeps the goddess at the centre of public life.\n\nReaders will find simple Odia verse, local memory, and a short guide for pilgrims who wish to understand the shrine before they visit.', 'https://images.pexels.com/photos/159866/books-book-pages-read-literature-159866.jpeg?auto=compress&cs=tinysrgb&w=1200', 'Temple legend, Daily seva, Pilgrim notes, Odia verse', 1, '/books/sample.pdf', 0, 2);

-- --------------------------------------------------------

--
-- Table structure for table `events`
--

CREATE TABLE `events` (
  `id` varchar(64) NOT NULL,
  `slug` varchar(191) DEFAULT NULL,
  `title` varchar(255) DEFAULT NULL,
  `starts_at` date DEFAULT NULL,
  `ends_at` date DEFAULT NULL,
  `description` text DEFAULT NULL,
  `cta` varchar(128) DEFAULT NULL,
  `featured` tinyint(1) DEFAULT 0,
  `excerpt` text DEFAULT NULL,
  `body` text DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `timing` varchar(255) DEFAULT NULL,
  `duration` varchar(128) DEFAULT NULL,
  `footfall` varchar(128) DEFAULT NULL,
  `location` varchar(255) DEFAULT NULL,
  `highlights` text DEFAULT NULL,
  `rituals` text DEFAULT NULL,
  `active` tinyint(1) DEFAULT 1,
  `sort_order` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `events`
--

INSERT INTO `events` (`id`, `slug`, `title`, `starts_at`, `ends_at`, `description`, `cta`, `featured`, `excerpt`, `body`, `image`, `timing`, `duration`, `footfall`, `location`, `highlights`, `rituals`, `active`, `sort_order`) VALUES
('015639a5-6a4b-49b7-8c75-c2bb8609098b', 'banki-mahotsav', 'Banki Mahotsav', '0000-00-00', '0000-00-00', 'The cultural and spiritual gathering of Banki, with Charchika puja, folk arts, literature, and community seva.', 'Send Puja', 1, 'Banki Mahotsav brings artistes, writers, and devotees together around Maa Charchika — cultural nights, crafts, and festival puja at Ruchika Parvata.', 'Banki Mahotsav is the living festival of Banki, Odisha. Stages host Odissi, pala, sankirtan, and local crafts while the Charchika shrine remains the spiritual heart of the town.\n\nFamilies travel from across Cuttack district for darshan, prasad, and night-long kirtan. The Mahotsav also honours Odia literature and social harmony through Charchika Samman and community programmes.\n\nIf you cannot attend in person, you may still book puja and offerings through this portal.', 'https://images.pexels.com/photos/10931719/pexels-photo-10931719.jpeg?auto=compress&cs=tinysrgb&w=1200', 'January (Magha)', '4–5 days', 'Thousands daily', 'Banki, Cuttack, Odisha', 'Charchika puja, Cultural nights, Folk arts, Community seva', 'Charchika special puja\nEvening deepa seva\nSankirtan and pala\nPrasad distribution', 0, 1),
('6c3a8a74-b8a7-4b1e-ba81-69d262b52739', 'chaitra-jatra', 'Chaitra Jatra', '0000-00-00', '0000-00-00', 'Chaitra month celebration at Charchika Temple with special pujas, cultural programmes, and large gatherings of devotees.', 'Learn More', 1, 'The most important seasonal festival at Charchika Temple, held in Chaitra (March–April), with special pujas, cultural programmes, and grand meals.', 'Chaitra Jatra is among the most significant annual observances at Maa Charchika Temple. During the Odia month of Chaitra, devotees gather on Ruchika Parvata for special anjali, cultural programmes, and community bhog.\n\nThe temple extends its hours on peak days to welcome pilgrims. Families offer flowers, sindoor, and vows, believing the goddess grants protection and fulfilment of sincere wishes.\n\nBanki Mahotsav committee and local seva groups support crowd arrangements, prasad, and night-long kirtan through the fortnight.', 'https://images.pexels.com/photos/37862812/pexels-photo-37862812.jpeg?auto=compress&cs=tinysrgb&w=1200', 'March–April (Chaitra month)', '15–21 days', '80,000+ daily', 'Charchika Temple, Banki', 'Mass tonsure ceremony, Special pujas and rituals, Cultural programmes, Grand feast (maha)', 'Chaitra special puja\nMundan / tonsure seva\nPushpanjali and deepa\nCommunity maha prasad', 0, 4),
('9db04107-d02c-4df2-ac00-893adbaa26ae', 'banki-mahotsav-2026', 'Banki Mahotsav 2026', '0000-00-00', '0000-00-00', 'Join the next Banki Mahotsav — cultural nights, Charchika puja, crafts, and community gatherings. Send puja if you cannot attend in person.', 'Send Puja', 1, 'Join the next Banki Mahotsav — cultural nights, Charchika puja, crafts, and community gatherings. Send puja if you cannot attend in person.', 'Join the next Banki Mahotsav — cultural nights, Charchika puja, crafts, and community gatherings. Send puja if you cannot attend in person.', NULL, '', '', '', '', '', '', 1, 5),
('d5430a64-2bfd-4705-9f7e-c671255f128d', 'durga-puja', 'Durga Puja at Charchika', '0000-00-00', '0000-00-00', 'Sharadiya Durga Puja at the Charchika shrine with navratri rituals, sandhya aarti, and festive gatherings.', 'Book Puja', 0, 'Sharadiya Navratri at Charchika Temple — nine nights of aarti, cultural programmes, and Ashtami-Navami special puja.', 'During Sharadiya Durga Puja, Charchika Temple becomes the centre of Navratri worship in Banki. The eight-armed goddess is honoured with daily sandhya aarti, special Ashtami and Navami pujas, and cultural evenings.\n\nDevotees offer sarees, bhog, and anjali. The hill shrine and the town below fill with lamps, pala, and family gatherings.\n\nBook a puja in advance if you wish the sankalp to be performed in your name during the festival days.', 'https://images.pexels.com/photos/5458388/pexels-photo-5458388.jpeg?auto=compress&cs=tinysrgb&w=1200', 'September–October (Ashwina)', '9–10 days', 'Large festive crowds', 'Charchika Temple, Banki', 'Navratri aarti, Ashtami-Navami puja, Cultural evenings, Saree offering', 'Daily sandhya aarti\nAshtami special puja\nNavami hawan\nVijaya dashami visarjan prayers', 1, 3);

-- --------------------------------------------------------

--
-- Table structure for table `gallery`
--

CREATE TABLE `gallery` (
  `id` varchar(64) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `category` varchar(64) DEFAULT NULL,
  `image` varchar(500) DEFAULT NULL,
  `sort_order` int(11) DEFAULT 0,
  `active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `gallery`
--

INSERT INTO `gallery` (`id`, `title`, `category`, `image`, `sort_order`, `active`) VALUES
('07b17b31-a53c-4f51-9e95-e050ee9b569b', 'Dawn at the Shrine', 'Temple', 'https://images.pexels.com/photos/5458388/pexels-photo-5458388.jpeg?auto=compress&cs=tinysrgb&w=900', 5, 1),
('510c11c4-78c8-42ef-a687-567ae5556b0f', 'Temple Grove', 'Temple', 'https://images.pexels.com/photos/1051838/pexels-photo-1051838.jpeg?auto=compress&cs=tinysrgb&w=900', 8, 1),
('6b451bed-2efa-4c64-b89f-489e7e1cf5bb', 'Temple Vimana', 'Temple', 'https://images.pexels.com/photos/37862812/pexels-photo-37862812.jpeg?auto=compress&cs=tinysrgb&w=900', 2, 1),
('9349b3fe-61ea-43e9-9b43-f3dedf4f3407', 'Charchika Temple', 'Temple', 'https://images.pexels.com/photos/10931719/pexels-photo-10931719.jpeg?auto=compress&cs=tinysrgb&w=900', 1, 0),
('aadf15c6-f7f1-47dd-8c98-daa2a6691d57', 'Evening Deepa', 'Festivals', 'https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=900', 6, 1),
('b31085e7-2858-4209-a834-2b6f2c85fad1', 'Stone Archway', 'Temple', 'https://images.pexels.com/photos/1603650/pexels-photo-1603650.jpeg?auto=compress&cs=tinysrgb&w=900', 3, 0),
('b9e993e7-712b-4e39-92ff-fb6b1a440331', 'Maa Charchika Altar', 'Deities', 'https://images.pexels.com/photos/1624496/pexels-photo-1624496.jpeg?auto=compress&cs=tinysrgb&w=900', 4, 1),
('cbb9cd31-f998-4044-a919-ed074d82eded', 'Mahotsav Gathering', 'Events', 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=900', 7, 1);

-- --------------------------------------------------------

--
-- Table structure for table `messages`
--

CREATE TABLE `messages` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(64) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `read` tinyint(1) DEFAULT 0,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `messages`
--

INSERT INTO `messages` (`id`, `name`, `email`, `phone`, `message`, `read`, `created_at`) VALUES
('1e1e457e-64a5-4d0c-b48b-1e15e1dab994', 'RAHUL PANDA', 'rahulpanda@qolarisdata.com', '7894266108', 'test rahul', 1, '2026-09-12 22:16:16'),
('552449e0-dc9b-4179-a172-c8275ce51b72', 'RAHUL PANDA', 'panda.rahul174@gmail.com', '7894266108', 'ttttttese', 0, '2026-09-13 03:21:00'),
('65a9e8ff-6ce5-46cd-a05d-e81ca4b5144f', 'Test Devotee', 'devotee@example.com', '9876543210', 'Puja enquiry\n\nPlease share darshan timings for Banki Mahotsav.', 0, '2026-09-11 00:03:48'),
('a671a5da-28fa-49bd-ada1-c3ccbd2f06c5', 'rahuk', 'rajj@gmail.com', '7894266108', 'hhhhhhhhhhhh', 0, '2026-09-14 01:11:51'),
('a67e4026-c08a-44f2-b162-718f164bc53c', 'yhhhhhhhhhhhhh', 'panda.rahul174@gmail.com', '7777777777', 'hghhhhhhbbbbbbbbbbbbbb', 0, '2026-09-14 01:38:42'),
('a6d4bbf5-de7e-43b4-9078-4a3759c32956', 'RAHUL PANDA', 'panda.rahul174@gmail.com', '7894266108', 'adhgdggda', 0, '2026-09-14 00:46:36'),
('ef19886b-2c9a-4d13-a63c-dfc3b8b57fb5', 'Test Devotee', 'test@example.com', '9876543210', 'Namaskar. Checking that the contact form works.', 0, '2026-09-13 13:51:13');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `site_name` varchar(255) DEFAULT NULL,
  `tagline` varchar(255) DEFAULT NULL,
  `priest_name` varchar(255) DEFAULT NULL,
  `priest_father` varchar(255) DEFAULT NULL,
  `phone` varchar(64) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `whatsapp` varchar(64) DEFAULT NULL,
  `address` varchar(500) DEFAULT NULL,
  `welcome_title` varchar(255) DEFAULT NULL,
  `welcome_subtitle` varchar(255) DEFAULT NULL,
  `hero_image` varchar(500) DEFAULT NULL,
  `about` text DEFAULT NULL,
  `disclaimer` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`disclaimer`)),
  `about_eyebrow` varchar(255) DEFAULT NULL,
  `about_title` varchar(255) DEFAULT NULL,
  `about_lead` text DEFAULT NULL,
  `about_image` varchar(500) DEFAULT NULL,
  `about_darshan` varchar(255) DEFAULT NULL,
  `about_hill` varchar(255) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `favicon` varchar(500) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `footer_about` text DEFAULT NULL,
  `copyright` varchar(255) DEFAULT NULL,
  `footer_title` varchar(255) DEFAULT NULL,
  `footer_address` varchar(500) DEFAULT NULL,
  `footer_phone` varchar(64) DEFAULT NULL,
  `footer_email` varchar(255) DEFAULT NULL,
  `footer_links_title` varchar(128) DEFAULT NULL,
  `footer_contact_title` varchar(128) DEFAULT NULL,
  `footer_links` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`footer_links`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `site_name`, `tagline`, `priest_name`, `priest_father`, `phone`, `email`, `whatsapp`, `address`, `welcome_title`, `welcome_subtitle`, `hero_image`, `about`, `disclaimer`, `about_eyebrow`, `about_title`, `about_lead`, `about_image`, `about_darshan`, `about_hill`, `logo`, `favicon`, `contact_email`, `footer_about`, `copyright`, `footer_title`, `footer_address`, `footer_phone`, `footer_email`, `footer_links_title`, `footer_contact_title`, `footer_links`) VALUES
(1, 'Banki Mahotsav', 'Maa Charchika · Banki, Odisha', 'Banki Mahotsav Committee', 'Charchika Temple Seva', '+91 9876543210', 'info@bankimahotsav.com', '+91 9876543210', 'Charchika Temple Road, Banki, Cuttack, Odisha 754008', 'Welcome to Banki Mahotsav', 'Jai Maa Charchika', '/hero.svg', 'Banki Mahotsav is the cultural and spiritual gathering of Banki, Odisha — celebrating Maa Charchika, Odia folk arts, literature, and community seva. Book pujas, send offerings, and support the festival from anywhere.', '[]', 'Adi Shakti Peetha', 'Maa Charchika Temple', '', '', '6:00 AM – 10:00 PM', '', '/logo.svg', '/favicon.svg', 'panda.rahul174@gmail.com', 'Maa Charchika · Banki, Odisha', '© 2026 Banki Mahotsav. All rights reserved.', 'Banki Mahotsav', 'Charchika Temple Road, Banki, Cuttack, Odisha 754008', '+91 9876543210', 'info@bankimahotsav.com', 'Quick Links', 'Contact', '[{\"label\":\"About\",\"path\":\"/about\"},{\"label\":\"Events\",\"path\":\"/events\"},{\"label\":\"Books\",\"path\":\"/books\"},{\"label\":\"Gallery\",\"path\":\"/gallery\"},{\"label\":\"Contact\",\"path\":\"/contact\"}]');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(32) NOT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `created_at`) VALUES
('admin-1', 'Administrator', 'admin@bankimahotsav.com', '$2a$10$i1lpS6IEz6dSEyG.s/wr/.1a6umAuXpK9s.deZ6OvOUKKszmJ/cOG', 'admin', '2026-09-10 23:16:51'),
('user-1', 'Demo Devotee', 'devotee@bankimahotsav.com', '$2a$10$wBm.A3o25DEk0dd0GQ2SEuH10T9.iAxwgqITn0DfK9ESwv3Rm0Axi', 'devotee', '2026-09-10 23:16:51');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `books`
--
ALTER TABLE `books`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `events`
--
ALTER TABLE `events`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`);

--
-- Indexes for table `gallery`
--
ALTER TABLE `gallery`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `messages`
--
ALTER TABLE `messages`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
