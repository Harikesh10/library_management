# 📚 Library Management System

A full-stack Library Management System designed to simplify library
operations such as book management, borrowing, returning, user
authentication, and tracking library activity.

The application provides separate functionalities for administrators and
students through a modern, responsive web interface.

## 🚀 Project Overview

The Library Management System allows administrators to manage books,
monitor borrowing activity, track overdue books, and manage library
inventory. Students can browse the catalogue, search for books, borrow
books, and track their borrowing history.

The project uses a REST API backend built with Node.js and Express, a
MySQL-compatible database hosted on TiDB Cloud, and a frontend developed
using HTML, CSS and JavaScript.

## ✨ Features

### 🔐 Authentication

-   Secure login system.
-   JWT-based authentication.
-   Role-based access control for administrators and students.
-   Logout functionality.
-   Account status verification.
-   Session inactivity logout.

### 👨‍💼 Admin Features

-   Admin dashboard with library statistics.
-   Add new books.
-   Update book details.
-   Delete books.
-   Manage library inventory.
-   View active borrowing records.
-   View overdue books.
-   Return borrowed books.
-   Monitor students and borrowing activity.

### 👨‍🎓 Student Features

-   Student dashboard.
-   Browse the book catalogue.
-   Search books by title, author and ISBN.
-   Filter books by category and availability.
-   Sort books.
-   View book details.
-   Borrow books.
-   View current borrowings.
-   View borrowing history.
-   View profile information.

### 📖 Borrowing System

-   Maximum of 3 active books per student.
-   14-day borrowing period.
-   Track borrowing and return dates.
-   Overdue book tracking.
-   Inventory availability management.
-   Transaction-based borrowing and returning.

### 🛡️ Security

-   Password hashing using bcrypt.
-   JWT authentication.
-   Role-based authorization.
-   Token versioning for logout invalidation.
-   Input validation.
-   Rate limiting on login requests.
-   Helmet security middleware.
-   CORS configuration.
-   JSON request size limitation.
-   Error handling.

## 🛠️ Technologies Used

### Frontend

-   HTML5
-   CSS3
-   JavaScript
-   Fetch API
-   Lucide Icons

### Backend

-   Node.js
-   Express.js
-   MySQL2
-   JWT (jsonwebtoken)
-   bcryptjs
-   Helmet
-   express-rate-limit
-   dotenv
-   CORS

### Database

-   MySQL

## 🧪 Testing

The backend APIs were tested using Postman.

Testing included:

-   Authentication and authorization.
-   Book CRUD operations.
-   Borrowing and returning books.
-   Inventory consistency.
-   Borrowing limits.
-   Dashboard statistics.
-   Search and filtering.
-   Input validation.
-   Security checks.
-   Rate limiting.
-   Error handling.
-   Overdue record testing.

## 🎨 UI Design

The application uses a clean, modern and responsive interface with a
combination of:

-   Light blue
-   Black
-   White
-   Grey

The interface provides separate navigation and functionality for
administrators and students.

## 🔮 Future Enhancements

-   Email notifications for overdue books.
-   Book reservation system.
-   Fine calculation for overdue books.
-   Advanced analytics and reports.
-   Barcode or QR code-based book management.
-   Notifications for upcoming due dates.
-   Pagination for large book catalogues.

## 👨‍💻 Author

**Harikesh C**

Computer Science Engineering

## 📄 License

This project was developed for academic and learning purposes.
