// Validate positive integer IDs in URL parameters
const validateIdParam = (req, res, next) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: "Invalid ID. ID must be a positive integer."
    });
  }

  next();
};


// Validate book_id in borrowing request body
const validateBookIdBody = (req, res, next) => {
  const bookId = Number(req.body?.book_id);

  if (!Number.isInteger(bookId) || bookId <= 0) {
    return res.status(400).json({
      message: "book_id must be a positive integer"
    });
  }

  next();
};


// Validate book data when creating or updating a book
const validateBookBody = (req, res, next) => {
  const {
    title,
    author,
    total_copies,
    published_year
  } = req.body || {};

  // Required fields
  if (
    typeof title !== "string" ||
    title.trim() === "" ||
    typeof author !== "string" ||
    author.trim() === ""
  ) {
    return res.status(400).json({
      message: "Book title and author are required"
    });
  }

  // Copies validation, if provided
  if (total_copies !== undefined) {
    const copies = Number(total_copies);

    if (!Number.isInteger(copies) || copies < 0) {
      return res.status(400).json({
        message: "Total copies must be a non-negative integer"
      });
    }
  }

  // Published year validation, if provided
  if (
    published_year !== undefined &&
    published_year !== null &&
    published_year !== ""
  ) {
    const year = Number(published_year);

    if (
      !Number.isInteger(year) ||
      year < 1000 ||
      year > 2155
    ) {
      return res.status(400).json({
        message: "Please provide a valid publication year"
      });
    }
  }

  next();
};


module.exports = {
  validateIdParam,
  validateBookIdBody,
  validateBookBody
};