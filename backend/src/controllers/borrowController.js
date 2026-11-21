const db = require("../config/db");

// ==========================================
// 1. BORROW A BOOK
// POST /api/borrow
// ==========================================

const borrowBook = async (req, res) => {
  let connection;

  try {
    // Only students can borrow books
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "Only students can borrow books"
      });
    }

    const { book_id } = req.body;
    const bookId = Number(book_id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "A valid book_id is required"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Lock the student row first
    const [students] = await connection.execute(
      `SELECT user_id
       FROM users
       WHERE user_id = ?
       FOR UPDATE`,
      [req.user.userId]
    );

    if (students.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Student not found"
      });
    }

    // Lock the book row
    const [books] = await connection.execute(
      `SELECT book_id, title, available_copies
       FROM books
       WHERE book_id = ?
       FOR UPDATE`,
      [bookId]
    );

    if (books.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Book not found"
      });
    }

    const book = books[0];

    if (book.available_copies <= 0) {
      await connection.rollback();

      return res.status(409).json({
        message: "No copies of this book are currently available"
      });
    }

    // Check the student's active borrowing count
    const [activeBorrowings] = await connection.execute(
      `SELECT COUNT(*) AS borrow_count
       FROM borrow_records
       WHERE student_id = ?
       AND status = 'borrowed'`,
      [req.user.userId]
    );

    const borrowCount = Number(activeBorrowings[0].borrow_count);

    if (borrowCount >= 3) {
      await connection.rollback();

      return res.status(400).json({
        message: "You have reached the maximum limit of 3 active books"
      });
    }

    // Insert the borrowing record with a 14-day due date
    const [result] = await connection.execute(
      `INSERT INTO borrow_records
       (student_id, book_id, borrowed_date, due_date, status)
       VALUES (?, ?, CURRENT_TIMESTAMP,
               DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 14 DAY),
               'borrowed')`,
      [req.user.userId, bookId]
    );

    // Decrease available copies
    await connection.execute(
      `UPDATE books
       SET available_copies = available_copies - 1
       WHERE book_id = ?`,
      [bookId]
    );

    await connection.commit();

    res.status(201).json({
      message: "Book borrowed successfully",
      record_id: result.insertId,
      book: book.title,
      due_period_days: 14
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Borrow book error:", error);

    res.status(500).json({
      message: "Failed to borrow book"
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};


// ==========================================
// 2. STUDENT BORROWING HISTORY
// GET /api/borrow/my
// ==========================================

const getMyBorrowings = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({
        message: "This endpoint is for students only"
      });
    }

    const [records] = await db.execute(
      `SELECT
          br.record_id,
          br.book_id,
          b.title,
          b.author,
          b.isbn,
          b.cover_image,
          br.borrowed_date,
          br.due_date,
          br.returned_date,
          br.status
       FROM borrow_records br
       JOIN books b ON br.book_id = b.book_id
       WHERE br.student_id = ?
       ORDER BY br.borrowed_date DESC`,
      [req.user.userId]
    );

    res.status(200).json({
      count: records.length,
      borrowings: records
    });

  } catch (error) {
    console.error("Get my borrowings error:", error);

    res.status(500).json({
      message: "Failed to fetch borrowing history"
    });
  }
};


// ==========================================
// 3. ADMIN - VIEW ACTIVE BORROWINGS
// GET /api/borrow/active
// ==========================================

const getActiveBorrowings = async (req, res) => {
  try {
    const [records] = await db.execute(
      `SELECT
          br.record_id,
          br.student_id,
          u.username,
          u.full_name,
          u.email,
          br.book_id,
          b.title,
          b.author,
          b.cover_image,
          br.borrowed_date,
          br.due_date,
          br.status
       FROM borrow_records br
       JOIN users u ON br.student_id = u.user_id
       JOIN books b ON br.book_id = b.book_id
       WHERE br.status = 'borrowed'
       ORDER BY br.due_date ASC`,
      []
    );

    res.status(200).json({
      count: records.length,
      borrowings: records
    });

  } catch (error) {
    console.error("Get active borrowings error:", error);

    res.status(500).json({
      message: "Failed to fetch active borrowing records"
    });
  }
};


 // ==========================================
 // 4. RETURN A BOOK
 // PATCH /api/borrow/:id/return
 // ==========================================


const returnBook = async (req, res) => {
  let connection;

  try {
    const recordId = Number(req.params.id);

    if (!Number.isInteger(recordId) || recordId <= 0) {
      return res.status(400).json({
        message: "Invalid borrowing record ID"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Lock the borrowing record
    const [records] = await connection.execute(
      `SELECT record_id, student_id, book_id, status
       FROM borrow_records
       WHERE record_id = ?
       FOR UPDATE`,
      [recordId]
    );

    if (records.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Borrowing record not found"
      });
    }

    const record = records[0];

    // Students can only return their own books
    if (
      req.user.role === "student" &&
      record.student_id !== req.user.userId
    ) {
      await connection.rollback();

      return res.status(403).json({
        message: "You are not authorized to return this book"
      });
    }

    // Only admins and students are allowed
    if (req.user.role !== "admin" && req.user.role !== "student") {
      await connection.rollback();

      return res.status(403).json({
        message: "You are not authorized to return books"
      });
    }

    // Prevent double returns
    if (record.status === "returned") {
      await connection.rollback();

      return res.status(409).json({
        message: "This book has already been returned"
      });
    }

    // Mark the borrowing record as returned
    await connection.execute(
      `UPDATE borrow_records
       SET returned_date = CURRENT_TIMESTAMP,
           status = 'returned'
       WHERE record_id = ?`,
      [recordId]
    );

    // Restore one available copy
    await connection.execute(
      `UPDATE books
       SET available_copies = available_copies + 1
       WHERE book_id = ?`,
      [record.book_id]
    );

    await connection.commit();

    res.status(200).json({
      message: "Book returned successfully",
      record_id: recordId
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error("Return book error:", error);

    res.status(500).json({
      message: "Failed to process book return"
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};



// ==========================================
// 5. GET A SPECIFIC BORROWING RECORD
// GET /api/borrow/:id
// ==========================================

const getBorrowRecordById = async (req, res) => {
  try {
    const recordId = Number(req.params.id);

    if (!Number.isInteger(recordId) || recordId <= 0) {
      return res.status(400).json({
        message: "Invalid borrowing record ID"
      });
    }

    const [records] = await db.execute(
      `SELECT
          br.record_id,
          br.student_id,
          u.username,
          u.full_name,
          br.book_id,
          b.title,
          b.author,
          b.cover_image,
          br.borrowed_date,
          br.due_date,
          br.returned_date,
          br.status
       FROM borrow_records br
       JOIN users u ON br.student_id = u.user_id
       JOIN books b ON br.book_id = b.book_id
       WHERE br.record_id = ?`,
      [recordId]
    );

    if (records.length === 0) {
      return res.status(404).json({
        message: "Borrowing record not found"
      });
    }

    const record = records[0];

    // Students can only view their own records
    if (
      req.user.role !== "admin" &&
      record.student_id !== req.user.userId
    ) {
      return res.status(403).json({
        message: "You are not authorized to view this record"
      });
    }

    res.status(200).json({
      record
    });

  } catch (error) {
    console.error("Get borrowing record error:", error);

    res.status(500).json({
      message: "Failed to fetch borrowing record"
    });
  }
};


// ==========================================
// 6. ADMIN - VIEW OVERDUE BOOKS
// GET /api/borrow/overdue
// ==========================================

const getOverdueBorrowings = async (req, res) => {
  try {
    const [records] = await db.execute(
      `SELECT
          br.record_id,
          br.student_id,
          u.username,
          u.full_name,
          u.email,
          br.book_id,
          b.title,
          b.author,
          b.cover_image,
          br.borrowed_date,
          br.due_date,
          DATEDIFF(CURRENT_DATE, DATE(br.due_date)) AS days_overdue
       FROM borrow_records br
       JOIN users u ON br.student_id = u.user_id
       JOIN books b ON br.book_id = b.book_id
       WHERE br.status = 'borrowed'
       AND br.due_date < CURRENT_TIMESTAMP
       ORDER BY br.due_date ASC`,
      []
    );

    res.status(200).json({
      count: records.length,
      overdue: records
    });

  } catch (error) {
    console.error("Get overdue borrowings error:", error);

    res.status(500).json({
      message: "Failed to fetch overdue books"
    });
  }
};


module.exports = {
  borrowBook,
  getMyBorrowings,
  getActiveBorrowings,
  returnBook,
  getBorrowRecordById,
  getOverdueBorrowings
};
