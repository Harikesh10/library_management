const db = require("../config/db");

// Admin dashboard statistics
const getAdminDashboard = async (req, res) => {
  try {
    const [bookStats] = await db.execute(`
      SELECT
        COUNT(*) AS total_books,
        COALESCE(SUM(total_copies), 0) AS total_copies,
        COALESCE(SUM(available_copies), 0) AS available_copies
      FROM books
    `);

    const [studentStats] = await db.execute(`
      SELECT COUNT(*) AS total_students
      FROM users
      WHERE role = 'student'
        AND is_active = TRUE
    `);

    const [borrowingStats] = await db.execute(`
      SELECT
        COUNT(*) AS total_borrowings,
        COALESCE(SUM(status = 'borrowed'), 0) AS active_borrowings,
        COALESCE(SUM(status = 'returned'), 0) AS total_returns,
        COALESCE(
        SUM(
            status = 'borrowed'
            AND due_date < CURRENT_TIMESTAMP
        ), 0
        ) AS overdue_borrowings
      FROM borrow_records
    `);

    res.status(200).json({
      dashboard: {
        books: bookStats[0],
        students: studentStats[0],
        borrowings: borrowingStats[0]
      }
    });

  } catch (error) {
    console.error("Admin dashboard error:", error);

    res.status(500).json({
      message: "Failed to fetch admin dashboard statistics"
    });
  }
};


// Student dashboard statistics
const getStudentDashboard = async (req, res) => {
  try {
    const studentId = req.user.userId;

    const [borrowingStats] = await db.execute(`
      SELECT
        COUNT(*) AS total_borrowed,
        COALESCE(SUM(status = 'borrowed'), 0) AS active_borrowings,
        COALESCE(SUM(status = 'returned'), 0) AS returned_books,
        COALESCE(
        SUM(
            status = 'borrowed'
            AND due_date < CURRENT_TIMESTAMP
        ), 0
        ) AS overdue_books
      FROM borrow_records
      WHERE student_id = ?
    `, [studentId]);

    const stats = borrowingStats[0];

    // Handle NULL values when the student has no borrowing records
    const totalBorrowed = Number(stats.total_borrowed || 0);
    const activeBorrowings = Number(stats.active_borrowings || 0);
    const returnedBooks = Number(stats.returned_books || 0);
    const overdueBooks = Number(stats.overdue_books || 0);

    const [activeBooks] = await db.execute(`
      SELECT
        br.record_id,
        br.book_id,
        b.title,
        b.author,
        br.borrowed_date,
        br.due_date,
        br.status
      FROM borrow_records br
      JOIN books b ON br.book_id = b.book_id
      WHERE br.student_id = ?
        AND br.status = 'borrowed'
      ORDER BY br.due_date ASC
    `, [studentId]);

    res.status(200).json({
      dashboard: {
        total_borrowed: totalBorrowed,
        active_borrowings: activeBorrowings,
        returned_books: returnedBooks,
        overdue_books: overdueBooks,
        borrowing_limit: 3,
        remaining_borrowing_capacity: Math.max(0, 3 - activeBorrowings)
      },
      active_books: activeBooks
    });

  } catch (error) {
    console.error("Student dashboard error:", error);

    res.status(500).json({
      message: "Failed to fetch student dashboard statistics"
    });
  }
};


module.exports = {
  getAdminDashboard,
  getStudentDashboard
};

