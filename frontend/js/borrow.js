
/* =========================================
   BORROWING MODULE
========================================= */


/* =========================================
   BORROW A BOOK
========================================= */

async function borrowBookFromCatalogue(bookId) {

    const confirmed = confirm(
        "Are you sure you want to borrow this book? The borrowing period is 14 days."
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await apiRequest("/borrow", {
            method: "POST",
            body: JSON.stringify({
                book_id: Number(bookId)
            })
        });

        alert(response.message || "Book borrowed successfully!");

        // Refresh catalogue after borrowing
        if (typeof loadBooksPage === "function") {
            loadBooksPage();
        }

    } catch (error) {

        alert(error.message || "Unable to borrow this book.");

    }

}


/* =========================================
   RETURN MY BOOK
========================================= */

async function returnMyBook(recordId) {

    const confirmed = confirm(
        "Are you sure you want to return this book?"
    );

    if (!confirmed) {
        return;
    }

    try {

        const response = await apiRequest(
            `/borrow/${Number(recordId)}/return`,
            {
                method: "PATCH"
            }
        );

        alert(response.message || "Book returned successfully!");

        // Refresh the student's borrowing page
        loadMyBorrowingsPage();

    } catch (error) {

        alert(error.message || "Unable to return this book.");

    }

}


/* =========================================
   LOAD MY BORROWINGS
========================================= */

async function loadMyBorrowingsPage() {

    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `
        <div class="loading-state">
            Loading your borrowing records...
        </div>
    `;

    try {

        const response = await apiRequest("/borrow/my");

        const records = Array.isArray(response)
            ? response
            : response.borrowings ||
              response.records ||
              response.data ||
              [];

        renderMyBorrowings(records);

    } catch (error) {

        contentArea.innerHTML = `
            <div class="error-state">
                <h2>Unable to load borrowings</h2>
                <p>${escapeHTML(error.message)}</p>

                <button class="primary-button" id="retry-borrowings">
                    Retry
                </button>
            </div>
        `;

        document.getElementById("retry-borrowings")
            ?.addEventListener("click", loadMyBorrowingsPage);

    }

}


/* =========================================
   RENDER MY BORROWINGS
========================================= */

function renderMyBorrowings(records) {

    const contentArea = document.getElementById("content-area");

    const activeRecords = records.filter(record =>
        record.status === "borrowed"
    );

    const returnedRecords = records.filter(record =>
        record.status === "returned"
    );


    contentArea.innerHTML = `

        <div class="borrow-page-header">

            <div>
                <span class="eyebrow">STUDENT LIBRARY</span>

                <h1>My Borrowings</h1>

                <p>
                    Keep track of books you've borrowed
                    and their return dates.
                </p>
            </div>

        </div>


        <div class="borrow-summary-grid">

            <div class="borrow-summary-card">

                <span>Currently Borrowed</span>

                <strong>
                    ${activeRecords.length} / 3
                </strong>

                <p>Active borrowing limit</p>

            </div>


            <div class="borrow-summary-card">

                <span>Returned Books</span>

                <strong>
                    ${returnedRecords.length}
                </strong>

                <p>Books returned</p>

            </div>


            <div class="borrow-summary-card">

                <span>Available Capacity</span>

                <strong>
                    ${Math.max(0, 3 - activeRecords.length)}
                </strong>

                <p>Remaining borrowing slots</p>

            </div>

        </div>


        <section class="borrow-section">

            <div class="borrow-section-header">

                <h2>Currently Borrowed</h2>

                <span>
                    ${activeRecords.length} active
                </span>

            </div>

            <div id="active-borrowing-list"></div>

        </section>


        <section class="borrow-section">

            <div class="borrow-section-header">

                <h2>Borrowing History</h2>

                <span>
                    ${returnedRecords.length} returned
                </span>

            </div>

            <div id="returned-borrowing-list"></div>

        </section>

    `;


    renderBorrowingRecords(
        activeRecords,
        "active-borrowing-list",
        true
    );


    renderBorrowingRecords(
        returnedRecords,
        "returned-borrowing-list",
        false
    );

}


/* =========================================
   RENDER BORROWING RECORDS
========================================= */

function renderBorrowingRecords(records, containerId, active) {

    const container = document.getElementById(containerId);

    if (!container) {
        return;
    }


    if (records.length === 0) {

        container.innerHTML = `
            <div class="borrow-empty-state">

                <div>📚</div>

                <h3>
                    ${active
                        ? "No books currently borrowed"
                        : "No borrowing history yet"}
                </h3>

                <p>
                    ${active
                        ? "Browse the catalogue to borrow your first book."
                        : "Your returned books will appear here."}
                </p>

            </div>
        `;

        return;

    }


    container.innerHTML = records.map(record => {

        // Handle common nested book object structures
        const book = record.book || {};

        const title = record.title || book.title || "Unknown Book";
        const author = record.author || book.author || "Unknown Author";

        const borrowedDate =
            record.borrowed_date || record.borrow_date || null;

        const dueDate =
            record.due_date || null;

        const returnedDate =
            record.returned_date || null;

        const status = record.status || "unknown";


        const isOverdue =
            active &&
            dueDate &&
            new Date(dueDate) < new Date();


        return `

            <article class="borrowing-card">

                <div class="borrowing-book-icon">
                    ${renderBookCoverHTML(record, "borrowing-cover-img")}
                </div>


                <div class="borrowing-card-main">

                    <h3>${escapeHTML(title)}</h3>

                    <p>
                        By ${escapeHTML(author)}
                    </p>


                    <div class="borrowing-details">

                        <div>

                            <span>Borrowed</span>

                            <strong>
                                ${formatBorrowDate(borrowedDate)}
                            </strong>

                        </div>


                        ${active ? `

                            <div>

                                <span>Due Date</span>

                                <strong>
                                    ${formatBorrowDate(dueDate)}
                                </strong>

                            </div>

                        ` : `

                            <div>

                                <span>Returned</span>

                                <strong>
                                    ${formatBorrowDate(returnedDate)}
                                </strong>

                            </div>

                        `}

                    </div>


                    <span class="borrowing-status
                        ${active
                            ? (isOverdue
                                ? "overdue-status"
                                : "active-status")
                            : "returned-status"}">

                        ${active
                            ? (isOverdue
                                ? "Overdue"
                                : "Currently Borrowed")
                            : "Returned"}

                    </span>


                    ${active ? `

                        <div class="borrowing-actions">

                            <button
                                class="primary-button return-book-button"
                                onclick="returnMyBook(${Number(record.record_id)})">

                                Return Book

                            </button>

                        </div>

                    ` : ""}

                </div>

            </article>

        `;

    }).join("");

}


/* =========================================
   DATE FORMATTER
========================================= */

function formatBorrowDate(date) {

    if (!date) {
        return "N/A";
    }

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return escapeHTML(date);
    }

    return parsed.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric"
    });

}
