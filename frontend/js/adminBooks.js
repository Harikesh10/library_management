
/* =========================================
   ADMIN BOOK MANAGEMENT
========================================= */

let adminBooksData = [];


/* =========================================
   LOAD ADMIN BOOK MANAGEMENT PAGE
========================================= */

async function loadAdminBooksPage() {

    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `
        <div class="loading-state">
            Loading inventory...
        </div>
    `;

    try {

        await fetchAdminBooks();

        renderAdminBooksPage();

    } catch (error) {

        contentArea.innerHTML = `
            <div class="error-state">
                <h2>Unable to load inventory</h2>
                <p>${escapeHTML(error.message)}</p>

                <button class="primary-button retry-button">
                    Retry
                </button>
            </div>
        `;

        contentArea.querySelector(".retry-button")
            ?.addEventListener("click", loadAdminBooksPage);

    }

}


/* =========================================
   FETCH BOOKS
========================================= */

async function fetchAdminBooks(search = "") {

    const params = new URLSearchParams();

    if (search.trim()) {
        params.set("search", search.trim());
    }

    const queryString = params.toString();

    const endpoint = queryString
        ? `/books?${queryString}`
        : "/books";

    const response = await apiRequest(endpoint);

    adminBooksData = Array.isArray(response)
        ? response
        : response.books ||
          response.data ||
          response.results ||
          [];

    if (!Array.isArray(adminBooksData)) {
        adminBooksData = [];
    }

}


/* =========================================
   RENDER ADMIN PAGE
========================================= */

function renderAdminBooksPage() {

    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `

        <div class="admin-books-header">

            <div>
                <span class="eyebrow">INVENTORY MANAGEMENT</span>

                <h1>Book Management</h1>

                <p>
                    Add, edit and manage your library collection.
                </p>
            </div>

            <button id="add-book-button" class="primary-button add-book-button">
                + Add Book
            </button>

        </div>


        <div class="admin-books-toolbar">

            <input
                type="search"
                id="admin-book-search"
                placeholder="Search by title, author or ISBN..."
            >

        </div>


        <div class="inventory-summary">

            <div class="inventory-summary-card">
                <span>Total Titles</span>
                <strong>${adminBooksData.length}</strong>
            </div>

            <div class="inventory-summary-card">
                <span>Total Copies</span>
                <strong>
                    ${adminBooksData.reduce(
                        (sum, book) => sum + Number(book.total_copies || 0),
                        0
                    )}
                </strong>
            </div>

            <div class="inventory-summary-card">
                <span>Available Copies</span>
                <strong>
                    ${adminBooksData.reduce(
                        (sum, book) => sum + Number(book.available_copies || 0),
                        0
                    )}
                </strong>
            </div>

        </div>


        <div class="inventory-table-container">

            <table class="inventory-table">

                <thead>

                    <tr>
                        <th>Book</th>
                        <th>ISBN</th>
                        <th>Category</th>
                        <th>Total</th>
                        <th>Available</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>

                </thead>

                <tbody id="inventory-table-body"></tbody>

            </table>

        </div>


        <div id="admin-book-modal" class="book-modal hidden">

            <div class="book-modal-content admin-modal-content">

                <button
                    class="modal-close"
                    id="admin-modal-close"
                    aria-label="Close"
                >
                    ×
                </button>

                <div id="admin-book-modal-body"></div>

            </div>

        </div>

    `;


    renderAdminBookRows();

    setupAdminBookEvents();

}


/* =========================================
   RENDER INVENTORY ROWS
========================================= */

function renderAdminBookRows() {

    const tbody = document.getElementById("inventory-table-body");

    if (!tbody) {
        return;
    }

    if (adminBooksData.length === 0) {

        tbody.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state table-empty">
                        <div class="empty-icon">📚</div>
                        <h2>No books found</h2>
                        <p>Add a book or adjust your search.</p>
                    </div>
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = adminBooksData.map(book => {

        const available = Number(book.available_copies || 0);
        const total = Number(book.total_copies || 0);

        const status = available > 0
            ? "In Stock"
            : "Out of Stock";

        const statusClass = available > 0
            ? "stock-status"
            : "stock-status out-of-stock";


        return `

            <tr>

                <td>

                    <div class="inventory-book-info">

                        <div class="inventory-book-icon">
                            ${renderBookCoverHTML(book, "inventory-book-cover-img")}
                        </div>

                        <div>
                            <strong>${escapeHTML(book.title)}</strong>

                            <span>
                                ${escapeHTML(book.author)}
                            </span>
                        </div>

                    </div>

                </td>


                <td>${escapeHTML(book.isbn || "N/A")}</td>

                <td>${escapeHTML(book.category || "Uncategorized")}</td>

                <td>${total}</td>

                <td>${available}</td>

                <td>
                    <span class="${statusClass}">
                        ${status}
                    </span>
                </td>


                <td>

                    <div class="inventory-actions">

                        <button
                            class="action-button edit-book-button"
                            data-book-id="${escapeHTML(book.book_id)}"
                            title="Edit book"
                        >
                            Edit
                        </button>

                        <button
                            class="action-button delete-book-button"
                            data-book-id="${escapeHTML(book.book_id)}"
                            title="Delete book"
                        >
                            Delete
                        </button>

                    </div>

                </td>

            </tr>

        `;

    }).join("");

}


/* =========================================
   ADMIN PAGE EVENTS
========================================= */

function setupAdminBookEvents() {

    const searchInput = document.getElementById("admin-book-search");

    let searchTimer;


    searchInput.addEventListener("input", () => {

        clearTimeout(searchTimer);

        searchTimer = setTimeout(async () => {

            try {

                await fetchAdminBooks(searchInput.value);

                renderAdminBookRows();

                attachInventoryRowEvents();

            } catch (error) {

                console.error("Inventory search error:", error);

            }

        }, 350);

    });


    document.getElementById("add-book-button")
        .addEventListener("click", () => {
            openAdminBookForm();
        });


    document.getElementById("admin-modal-close")
        .addEventListener("click", closeAdminBookModal);


    document.getElementById("admin-book-modal")
        .addEventListener("click", (event) => {

            if (event.target.id === "admin-book-modal") {
                closeAdminBookModal();
            }

        });


    attachInventoryRowEvents();

}


/* =========================================
   ATTACH ROW EVENTS
========================================= */

function attachInventoryRowEvents() {

    document.querySelectorAll(".edit-book-button")
        .forEach(button => {

            button.addEventListener("click", () => {

                const bookId = button.dataset.bookId;

                openAdminBookForm(bookId);

            });

        });


    document.querySelectorAll(".delete-book-button")
        .forEach(button => {

            button.addEventListener("click", () => {

                const bookId = button.dataset.bookId;

                deleteAdminBook(bookId);

            });

        });

}


/* =========================================
   BOOK FORM
========================================= */

function openAdminBookForm(bookId = null) {

    const modal = document.getElementById("admin-book-modal");
    const modalBody = document.getElementById("admin-book-modal-body");

    const book = bookId
        ? adminBooksData.find(
            item => String(item.book_id) === String(bookId)
        )
        : null;


    if (bookId && !book) {

        modalBody.innerHTML = `
            <div class="error-state">
                <h2>Book not found</h2>
            </div>
        `;

        modal.classList.remove("hidden");

        return;
    }


    modal.classList.remove("hidden");


    modalBody.innerHTML = `

        <span class="eyebrow">
            ${book ? "EDIT INVENTORY" : "NEW BOOK"}
        </span>

        <h2 class="admin-form-title">
            ${book ? "Edit Book" : "Add New Book"}
        </h2>


        <form id="admin-book-form">

            <div class="admin-form-grid">


                <div class="form-group">

                    <label for="admin-isbn">ISBN</label>

                    <input
                        type="text"
                        id="admin-isbn"
                        name="isbn"
                        value="${escapeHTML(book?.isbn || "")}"
                        placeholder="Enter ISBN"
                    >

                </div>


                <div class="form-group">

                    <label for="admin-title">Book Title *</label>

                    <input
                        type="text"
                        id="admin-title"
                        name="title"
                        value="${escapeHTML(book?.title || "")}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="admin-author">Author *</label>

                    <input
                        type="text"
                        id="admin-author"
                        name="author"
                        value="${escapeHTML(book?.author || "")}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="admin-publisher">Publisher</label>

                    <input
                        type="text"
                        id="admin-publisher"
                        name="publisher"
                        value="${escapeHTML(book?.publisher || "")}"
                    >

                </div>


                <div class="form-group">

                    <label for="admin-category">Category</label>

                    <input
                        type="text"
                        id="admin-category"
                        name="category"
                        value="${escapeHTML(book?.category || "")}"
                    >

                </div>


                <div class="form-group">

                    <label for="admin-year">Published Year</label>

                    <input
                        type="number"
                        id="admin-year"
                        name="published_year"
                        min="1000"
                        max="2155"
                        value="${escapeHTML(book?.published_year || "")}"
                    >

                </div>


                <div class="form-group">

                    <label for="admin-total-copies">Total Copies *</label>

                    <input
                        type="number"
                        id="admin-total-copies"
                        name="total_copies"
                        min="0"
                        step="1"
                        value="${escapeHTML(book?.total_copies ?? 0)}"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="admin-shelf">Shelf Location</label>

                    <input
                        type="text"
                        id="admin-shelf"
                        name="shelf_location"
                        value="${escapeHTML(book?.shelf_location || "")}"
                    >

                </div>


                <div class="form-group">

                    <label for="admin-cover-image">Cover Image URL / Path</label>

                    <input
                        type="text"
                        id="admin-cover-image"
                        name="cover_image"
                        value="${escapeHTML(book?.cover_image || getBookCoverUrl(book) || "")}"
                        placeholder="e.g. ./images/covers/clean-code.jpg"
                    >

                </div>


                <div class="form-group admin-description-group">

                    <label for="admin-description">Description</label>

                    <textarea
                        id="admin-description"
                        name="description"
                        rows="4"
                    >${escapeHTML(book?.description || "")}</textarea>

                </div>


            </div>


            <p id="admin-form-message" class="message"></p>


            <div class="admin-form-actions">

                <button
                    type="button"
                    class="secondary-button"
                    id="cancel-book-form"
                >
                    Cancel
                </button>

                <button
                    type="submit"
                    class="primary-button"
                    id="save-book-button"
                >
                    ${book ? "Save Changes" : "Add Book"}
                </button>

            </div>

        </form>

    `;


    document.getElementById("cancel-book-form")
        .addEventListener("click", closeAdminBookModal);


    document.getElementById("admin-book-form")
        .addEventListener("submit", async (event) => {

            event.preventDefault();

            await submitAdminBookForm(bookId);

        });

}


/* =========================================
   SUBMIT BOOK FORM
========================================= */

async function submitAdminBookForm(bookId) {

    const form = document.getElementById("admin-book-form");

    const formData = new FormData(form);

    const message = document.getElementById("admin-form-message");

    const saveButton = document.getElementById("save-book-button");


    const payload = {

        isbn: formData.get("isbn").trim() || null,

        title: formData.get("title").trim(),

        author: formData.get("author").trim(),

        publisher: formData.get("publisher").trim() || null,

        category: formData.get("category").trim() || null,

        published_year: formData.get("published_year") || null,

        total_copies: Number(formData.get("total_copies")),

        shelf_location: formData.get("shelf_location").trim() || null,

        cover_image: formData.get("cover_image")?.trim() || null,

        description: formData.get("description").trim() || null

    };


    if (!payload.title || !payload.author) {

        message.textContent = "Title and author are required.";
        message.className = "message error";

        return;

    }


    if (
        !Number.isInteger(payload.total_copies) ||
        payload.total_copies < 0
    ) {

        message.textContent = "Total copies must be a non-negative integer.";
        message.className = "message error";

        return;

    }


    if (payload.published_year !== null) {

        const year = Number(payload.published_year);

        if (!Number.isInteger(year) || year < 1000 || year > 2155) {

            message.textContent = "Enter a valid publication year.";
            message.className = "message error";

            return;

        }

    }


    saveButton.disabled = true;
    saveButton.textContent = "Saving...";


    try {

        const endpoint = bookId
            ? `/books/${bookId}`
            : "/books";


        const method = bookId
            ? "PUT"
            : "POST";


        await apiRequest(endpoint, {
            method,
            body: JSON.stringify(payload)
        });


        message.textContent = bookId
            ? "Book updated successfully!"
            : "Book added successfully!";

        message.className = "message success";


        await fetchAdminBooks();

        renderAdminBooksPage();


    } catch (error) {

        message.textContent = error.message;
        message.className = "message error";

        saveButton.disabled = false;

        saveButton.textContent = bookId
            ? "Save Changes"
            : "Add Book";

    }

}


/* =========================================
   DELETE BOOK
========================================= */

async function deleteAdminBook(bookId) {

    const book = adminBooksData.find(
        item => String(item.book_id) === String(bookId)
    );


    if (!book) {
        return;
    }


    const confirmed = confirm(
        `Are you sure you want to delete "${book.title}"?`
    );


    if (!confirmed) {
        return;
    }


    try {

        await apiRequest(`/books/${bookId}`, {
            method: "DELETE"
        });


        alert("Book deleted successfully!");

        await fetchAdminBooks();

        renderAdminBooksPage();


    } catch (error) {

        alert(error.message);

    }

}


/* =========================================
   CLOSE ADMIN MODAL
========================================= */

function closeAdminBookModal() {

    const modal = document.getElementById("admin-book-modal");

    if (modal) {
        modal.classList.add("hidden");
    }

}
