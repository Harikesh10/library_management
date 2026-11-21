
const db = require("../config/db");


  // GET /api/books
// Get all books with search, filters and sorting
const getAllBooks = async (req, res) => {
  try {
    const { search, category, available, sort, order } = req.query;

    let sql = `
      SELECT book_id, isbn, title, author, publisher,
             category, published_year, total_copies,
             available_copies, shelf_location, description, cover_image
      FROM books
      WHERE 1 = 1
    `;

    const values = [];

    // Search by title, author or ISBN
    if (search && search.trim() !== "") {
      sql += ` AND (title LIKE ? OR author LIKE ? OR isbn LIKE ?)`;

      const term = `%${search.trim()}%`;
      values.push(term, term, term);
    }

    // Filter by category
    if (category && category.trim() !== "") {
      sql += ` AND category = ?`;
      values.push(category.trim());
    }

    // Filter by availability
    if (available === "true") {
      sql += ` AND available_copies > 0`;
    } else if (available === "false") {
      sql += ` AND available_copies = 0`;
    }

    // Allowed sorting fields
    const sortOptions = {
      title: "title",
      author: "author",
      published_year: "published_year",
      available_copies: "available_copies",
      created_at: "created_at"
    };

    // Validate sorting field
    const sortColumn = sortOptions[sort] || "created_at";

    // Validate sorting order
    const sortOrder = order === "asc" ? "ASC" : "DESC";

    sql += ` ORDER BY ${sortColumn} ${sortOrder}`;

    const [books] = await db.execute(sql, values);

    res.status(200).json({
      count: books.length,
      books
    });

  } catch (error) {
    console.error("Get books error:", error);

    res.status(500).json({
      message: "Failed to fetch books"
    });
  }
};


// GET /api/books/:id
const getBookById = async (req, res) => {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const [books] = await db.execute(
      `SELECT * FROM books WHERE book_id = ?`,
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({ book: books[0] });
  } catch (error) {
    console.error("Get book error:", error);
    res.status(500).json({ message: "Failed to fetch book" });
  }
};


// POST /api/books
const createBook = async (req, res) => {
  try {
    const {
      isbn,
      title,
      author,
      publisher,
      category,
      published_year,
      total_copies,
      shelf_location,
      description,
      cover_image
    } = req.body;

    if (!title?.trim() || !author?.trim()) {
      return res.status(400).json({
        message: "Book title and author are required"
      });
    }

    const copies = total_copies === undefined ? 1 : Number(total_copies);

    if (!Number.isInteger(copies) || copies < 0) {
      return res.status(400).json({
        message: "Total copies must be a non-negative integer"
      });
    }

    const year = published_year === undefined || published_year === null || published_year === ""
      ? null
      : Number(published_year);

    if (year !== null && (!Number.isInteger(year) || year < 1000 || year > 2155)) {
      return res.status(400).json({
        message: "Please provide a valid publication year"
      });
    }

    const [result] = await db.execute(
      `INSERT INTO books
       (isbn, title, author, publisher, category,
        published_year, total_copies, available_copies,
        shelf_location, description, cover_image, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        isbn || null,
        title.trim(),
        author.trim(),
        publisher || null,
        category || null,
        year,
        copies,
        copies,
        shelf_location || null,
        description || null,
        cover_image || null,
        req.user.userId
      ]
    );

    res.status(201).json({
      message: "Book added successfully",
      book_id: result.insertId
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "A book with this ISBN already exists"
      });
    }

    console.error("Create book error:", error);
    res.status(500).json({ message: "Failed to add book" });
  }
};

// PUT /api/books/:id
const updateBook = async (req, res) => {
  let connection;

  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Invalid book ID"
      });
    }

    const {
      isbn,
      title,
      author,
      publisher,
      category,
      published_year,
      total_copies,
      shelf_location,
      description,
      cover_image
    } = req.body;

    if (!title?.trim() || !author?.trim()) {
      return res.status(400).json({
        message: "Book title and author are required"
      });
    }

    const copies = Number(total_copies);

    if (!Number.isInteger(copies) || copies < 0) {
      return res.status(400).json({
        message: "Total copies must be a non-negative integer"
      });
    }

    const year =
      published_year === undefined ||
      published_year === null ||
      published_year === ""
        ? null
        : Number(published_year);

    if (
      year !== null &&
      (!Number.isInteger(year) || year < 1000 || year > 2155)
    ) {
      return res.status(400).json({
        message: "Please provide a valid publication year"
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    // Lock the book row
    const [existing] = await connection.execute(
      `SELECT book_id, total_copies, available_copies
       FROM books
       WHERE book_id = ?
       FOR UPDATE`,
      [bookId]
    );

    if (existing.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: "Book not found"
      });
    }

    // Count currently borrowed copies
    const [records] = await connection.execute(
      `SELECT COUNT(*) AS borrowed_count
       FROM borrow_records
       WHERE book_id = ?
       AND status = 'borrowed'`,
      [bookId]
    );

    const borrowedCount = Number(records[0].borrowed_count);

    // Ensure total copies cannot be below borrowed copies
    if (copies < borrowedCount) {
      await connection.rollback();

      return res.status(400).json({
        message: `At least ${borrowedCount} total copies are required because that many are currently borrowed`
      });
    }

    const availableCopies = copies - borrowedCount;

    // Update the book
    await connection.execute(
      `UPDATE books
       SET isbn = ?, title = ?, author = ?, publisher = ?,
           category = ?, published_year = ?, total_copies = ?,
           available_copies = ?, shelf_location = ?, description = ?,
           cover_image = ?
       WHERE book_id = ?`,
      [
        isbn || null,
        title.trim(),
        author.trim(),
        publisher || null,
        category || null,
        year,
        copies,
        availableCopies,
        shelf_location || null,
        description || null,
        cover_image || null,
        bookId
      ]
    );

    await connection.commit();

    res.status(200).json({
      message: "Book updated successfully"
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        message: "Another book already uses this ISBN"
      });
    }

    console.error("Update book error:", error);

    res.status(500).json({
      message: "Failed to update book"
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};


// DELETE /api/books/:id
const deleteBook = async (req, res) => {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId) || bookId <= 0) {
      return res.status(400).json({ message: "Invalid book ID" });
    }

    const [result] = await db.execute(
      `DELETE FROM books WHERE book_id = ?`,
      [bookId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Book not found" });
    }

    res.status(200).json({
      message: "Book deleted successfully"
    });
  } catch (error) {
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "This book has borrowing history and cannot be deleted"
      });
    }

    console.error("Delete book error:", error);
    res.status(500).json({ message: "Failed to delete book" });
  }
};


module.exports = {
  getAllBooks,
  getBookById,
  createBook,
  updateBook,
  deleteBook
};
