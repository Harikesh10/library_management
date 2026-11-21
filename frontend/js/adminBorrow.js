
/* =========================================
   ADMIN BORROWING MODULE
========================================= */

let adminBorrowRecords = [];
let adminBorrowView = "active";


/* =========================================
   LOAD ACTIVE BORROWINGS
========================================= */

async function loadAdminBorrowingsPage() {

    adminBorrowView = "active";

    await loadAdminBorrowRecords("/borrow/active");

}


/* =========================================
   LOAD OVERDUE BOOKS
========================================= */

async function loadAdminOverduePage() {

    adminBorrowView = "overdue";

    await loadAdminBorrowRecords("/borrow/overdue");

}


/* =========================================
   FETCH BORROWING RECORDS
========================================= */

async function loadAdminBorrowRecords(endpoint) {

    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `
        <div class="loading-state">
            Loading borrowing records...
        </div>
    `;


    try {

        const response = await apiRequest(endpoint);

        adminBorrowRecords = Array.isArray(response)
            ? response
            : response.records ||
              response.borrowings ||
              response.data ||
              [];

        if (!Array.isArray(adminBorrowRecords)) {
            adminBorrowRecords = [];
        }

        renderAdminBorrowingPage();

    } catch (error) {

        contentArea.innerHTML = `
            <div class="error-state">

                <h2>Unable to load borrowing records</h2>

                <p>${escapeHTML(error.message)}</p>

                <button
                    class="primary-button"
                    id="admin-borrow-retry"
                >
                    Retry
                </button>

            </div>
        `;

        document.getElementById("admin-borrow-retry")
            ?.addEventListener("click", () => {

                loadAdminBorrowRecords(endpoint);

            });

    }

}


/* =========================================
   RENDER ADMIN BORROWING PAGE
========================================= */

function renderAdminBorrowingPage() {

    const contentArea = document.getElementById("content-area");

    const isOverdueView = adminBorrowView === "overdue";


    contentArea.innerHTML = `

        <div class="admin-borrow-header">

            <div>

                <span class="eyebrow">
                    LIBRARY MANAGEMENT
                </span>

                <h1>
                    ${isOverdueView
                        ? "Overdue Books"
                        : "Borrowing Records"}
                </h1>

                <p>
                    ${isOverdueView
                        ? "Monitor books that have passed their due dates."
                        : "Manage currently borrowed books and process returns."}
                </p>

            </div>


            <div class="admin-borrow-actions">

                <button
                    class="secondary-button"
                    id="admin-show-active"
                >
                    Active Borrowings
                </button>

                <button
                    class="secondary-button"
                    id="admin-show-overdue"
                >
                    Overdue Books
                </button>

            </div>

        </div>


        <div class="admin-borrow-summary">

            <div class="admin-borrow-summary-card">

                <span>
                    ${isOverdueView
                        ? "Overdue Records"
                        : "Active Records"}
                </span>

                <strong>
                    ${adminBorrowRecords.length}
                </strong>

                <p>
                    ${isOverdueView
                        ? "Books past their due dates"
                        : "Books currently borrowed"}
                </p>

            </div>

        </div>


        <div class="admin-borrow-toolbar">

            <input
                type="search"
                id="admin-borrow-search"
                placeholder="Search student, book or ID..."
            >

        </div>


        <div class="admin-borrow-table-container">

            <table class="admin-borrow-table">

                <thead>

                    <tr>

                        <th>Student</th>

                        <th>Book</th>

                        <th>Borrowed</th>

                        <th>Due Date</th>

                        ${isOverdueView
                            ? `<th>Days Overdue</th>`
                            : `<th>Status</th>`}

                        <th>Action</th>

                    </tr>

                </thead>


                <tbody id="admin-borrow-table-body"></tbody>

            </table>

        </div>

    `;


    renderAdminBorrowTable(adminBorrowRecords);


    // Navigation buttons

    document.getElementById("admin-show-active")
        .addEventListener("click", loadAdminBorrowingsPage);


    document.getElementById("admin-show-overdue")
        .addEventListener("click", loadAdminOverduePage);


    // Search

    document.getElementById("admin-borrow-search")
        .addEventListener("input", filterAdminBorrowRecords);

}


/* =========================================
   RENDER BORROWING TABLE
========================================= */

function renderAdminBorrowTable(records) {

    const tbody = document.getElementById("admin-borrow-table-body");

    if (!tbody) {
        return;
    }


    if (records.length === 0) {

        tbody.innerHTML = `
            <tr>

                <td colspan="6">

                    <div class="admin-borrow-empty">

                        <div>📚</div>

                        <h3>No records found</h3>

                        <p>
                            ${adminBorrowView === "overdue"
                                ? "There are currently no overdue books."
                                : "There are currently no active borrowings."}
                        </p>

                    </div>

                </td>

            </tr>
        `;

        return;

    }


    tbody.innerHTML = records.map(record => {

        const studentName =
            record.full_name ||
            record.student_name ||
            record.name ||
            "Unknown Student";


        const studentId =
            record.student_id ||
            record.user_id ||
            "N/A";


        const bookTitle =
            record.title ||
            record.book_title ||
            record.book?.title ||
            "Unknown Book";


        const author =
            record.author ||
            record.book?.author ||
            "";


        const recordId =
            record.record_id ||
            record.id;


        const borrowedDate =
            record.borrowed_date ||
            record.borrow_date;


        const dueDate =
            record.due_date;


        const overdueDays =
            calculateOverdueDays(dueDate);


        const isOverdue =
            overdueDays > 0;


        return `

            <tr>

                <td>

                    <div class="admin-student-cell">

                        <strong>
                            ${escapeHTML(studentName)}
                        </strong>

                        <span>
                            Student ID: ${escapeHTML(studentId)}
                        </span>

                    </div>

                </td>


                <td>

                    <div class="admin-book-cell">

                        <div class="admin-borrow-book-thumb">
                            ${renderBookCoverHTML(record, "admin-borrow-cover-img")}
                        </div>

                        <div>
                            <strong>
                                ${escapeHTML(bookTitle)}
                            </strong>

                            ${author
                                ? `<span>By ${escapeHTML(author)}</span>`
                                : ""}
                        </div>

                    </div>

                </td>


                <td>
                    ${formatAdminBorrowDate(borrowedDate)}
                </td>


                <td>
                    ${formatAdminBorrowDate(dueDate)}
                </td>


                ${adminBorrowView === "overdue"

                    ? `

                        <td>

                            <span class="admin-overdue-days">

                                ${overdueDays} day${overdueDays !== 1 ? "s" : ""}

                            </span>

                        </td>

                    `

                    : `

                        <td>

                            <span class="admin-borrow-status
                                ${isOverdue
                                    ? "admin-status-overdue"
                                    : "admin-status-active"}">

                                ${isOverdue
                                    ? "Overdue"
                                    : "Active"}

                            </span>

                        </td>

                    `}


                <td>

                    <button
                        class="admin-return-button"
                        data-record-id="${escapeHTML(recordId)}"
                    >
                        Return Book
                    </button>

                </td>

            </tr>

        `;

    }).join("");


    // Attach return button events

    tbody.querySelectorAll(".admin-return-button")
        .forEach(button => {

            button.addEventListener("click", async () => {

                await processAdminBookReturn(
                    button.dataset.recordId
                );

            });

        });

}


/* =========================================
   FILTER RECORDS
========================================= */

function filterAdminBorrowRecords() {

    const searchInput =
        document.getElementById("admin-borrow-search");


    const search = searchInput.value
        .trim()
        .toLowerCase();


    const filteredRecords = adminBorrowRecords.filter(record => {

        const studentName =
            record.full_name ||
            record.student_name ||
            record.name ||
            "";


        const studentId =
            record.student_id ||
            record.user_id ||
            "";


        const bookTitle =
            record.title ||
            record.book_title ||
            record.book?.title ||
            "";


        return String(studentName).toLowerCase().includes(search) ||

            String(studentId).toLowerCase().includes(search) ||

            String(bookTitle).toLowerCase().includes(search);

    });


    renderAdminBorrowTable(filteredRecords);

}


/* =========================================
   PROCESS BOOK RETURN
========================================= */

async function processAdminBookReturn(recordId) {

    const confirmed = confirm(
        "Confirm that this book has been returned?"
    );


    if (!confirmed) {
        return;
    }


    try {

        const response = await apiRequest(
            `/borrow/${recordId}/return`,
            {
                method: "PATCH"
            }
        );


        alert(
            response.message ||
            "Book returned successfully!"
        );


        // Reload the currently displayed page

        if (adminBorrowView === "overdue") {

            await loadAdminOverduePage();

        } else {

            await loadAdminBorrowingsPage();

        }


    } catch (error) {

        alert(
            error.message ||
            "Unable to process the book return."
        );

    }

}


/* =========================================
   CALCULATE OVERDUE DAYS
========================================= */

function calculateOverdueDays(dueDate) {

    if (!dueDate) {
        return 0;
    }


    const due = new Date(dueDate);

    if (Number.isNaN(due.getTime())) {
        return 0;
    }


    // Compare calendar dates instead of clock times

    due.setHours(0, 0, 0, 0);


    const today = new Date();

    today.setHours(0, 0, 0, 0);


    const difference = today - due;


    if (difference <= 0) {
        return 0;
    }


    return Math.floor(
        difference / (1000 * 60 * 60 * 24)
    );

}


/* =========================================
   FORMAT DATE
========================================= */

function formatAdminBorrowDate(date) {

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
