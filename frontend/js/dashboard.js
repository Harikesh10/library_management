
/* =========================================
   DASHBOARD MODULE
========================================= */


/* =========================================
   HELPER: GET VALUE FROM POSSIBLE KEY NAMES
========================================= */

function getStat(data, keys, fallback = 0) {

    for (const key of keys) {

        if (data[key] !== undefined && data[key] !== null) {
            return data[key];
        }

    }

    return fallback;
}


/* =========================================
   CREATE STAT CARD
========================================= */

function createStatCard(title, value, icon, description = "") {

    return `
        <div class="stat-card">

            <div class="stat-card-top">
                <span class="stat-title">${title}</span>
                <span class="stat-icon">${icon}</span>
            </div>

            <div class="stat-value">${value}</div>

            <p class="stat-description">${description}</p>

        </div>
    `;
}


/* =========================================
   ADMIN DASHBOARD
========================================= */

async function loadAdminDashboard() {

    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `
        <div class="loading-state">
            Loading your dashboard...
        </div>
    `;

    try {

        const response = await apiRequest("/dashboard/admin");

                
        const data = response.dashboard || response;

        const books = data.books || {};
        const students = data.students || {};
        const borrowings = data.borrowings || {};

        const totalBooks = getStat(books, [
            "total_books"
        ]);

        const totalCopies = getStat(books, [
            "total_copies"
        ]);

        const availableCopies = getStat(books, [
            "available_copies"
        ]);

        const activeStudents = getStat(students, [
            "total_students"
        ]);

        const activeBorrowings = getStat(borrowings, [
            "active_borrowings"
        ]);

        const returnedBooks = getStat(borrowings, [
            "total_returns"
        ]);

        const overdueBooks = getStat(borrowings, [
            "overdue_borrowings"
        ]);


        contentArea.innerHTML = `

            <div class="dashboard-welcome">

                <div>
                    <span class="eyebrow">ADMIN OVERVIEW</span>

                    <h1>Library Overview</h1>

                    <p>
                        Monitor your library's inventory
                        and borrowing activity.
                    </p>
                </div>

            </div>


            <div class="stats-grid">

                ${createStatCard(
                    "Total Books",
                    totalBooks,
                    "📚",
                    "Book titles in the library"
                )}

                ${createStatCard(
                    "Total Copies",
                    totalCopies,
                    "▤",
                    "Total physical copies"
                )}

                ${createStatCard(
                    "Available Copies",
                    availableCopies,
                    "✓",
                    "Copies ready to borrow"
                )}

                ${createStatCard(
                    "Active Students",
                    activeStudents,
                    "👥",
                    "Registered active students"
                )}

                ${createStatCard(
                    "Active Borrowings",
                    activeBorrowings,
                    "📖",
                    "Books currently borrowed"
                )}

                ${createStatCard(
                    "Returned Books",
                    returnedBooks,
                    "↩",
                    "Books returned"
                )}

                ${createStatCard(
                    "Overdue Books",
                    overdueBooks,
                    "⏰",
                    "Books past their due date"
                )}

            </div>


            <div class="dashboard-section">

                <div class="section-heading">

                    <div>
                        <h2>Quick Actions</h2>

                        <p>
                            Frequently used library management actions.
                        </p>
                    </div>

                </div>

                <div class="quick-actions">

                    <button class="quick-action" data-page="books">
                        <span>📚</span>
                        <strong>Manage Books</strong>
                        <small>Add, edit or remove books</small>
                    </button>

                    <button class="quick-action" data-page="borrowings">
                        <span>📋</span>
                        <strong>Borrowing Records</strong>
                        <small>View active borrowings</small>
                    </button>

                    <button class="quick-action" data-page="overdue">
                        <span>⏰</span>
                        <strong>Overdue Books</strong>
                        <small>Track overdue records</small>
                    </button>

                </div>

            </div>

        `;


    } catch (error) {

        contentArea.innerHTML = `
            <div class="error-state">

                <h2>Unable to load dashboard</h2>

                <p>${error.message}</p>

                <button class="primary-button retry-button">
                    Retry
                </button>

            </div>
        `;

        contentArea.querySelector(".retry-button")
            ?.addEventListener("click", loadAdminDashboard);

    }

}


/* =========================================
   STUDENT DASHBOARD
========================================= */

async function loadStudentDashboard() {

    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `
        <div class="loading-state">
            Loading your dashboard...
        </div>
    `;

    try {

        const response = await apiRequest("/dashboard/student");

        const data = response.stats || response.dashboard || response;

        const totalBorrowed = getStat(data, [
            "current_borrowings",
            "currentBorrowings",
            "active_borrowings",
            "activeBorrowings",
            "borrowed_books"
        ]);

        const borrowLimit = getStat(data, [
            "borrowing_limit",
            "borrowLimit",
            "max_borrowings"
        ], 3);

        const remainingCapacity = getStat(data, [
            "remaining_capacity",
            "remainingCapacity",
            "remaining_slots"
        ], Math.max(0, borrowLimit - totalBorrowed));

        const returnedBooks = getStat(data, [
            "returned_books",
            "returnedBooks",
            "total_returned"
        ]);

        const overdueBooks = getStat(data, [
            "overdue_books",
            "overdueBooks",
            "overdue_count"
        ]);


        contentArea.innerHTML = `

            <div class="dashboard-welcome">

                <div>
                    <span class="eyebrow">STUDENT OVERVIEW</span>

                    <h1>Your Library</h1>

                    <p>
                        Keep track of the books you borrow
                        and discover your next read.
                    </p>
                </div>

            </div>


            <div class="stats-grid">

                ${createStatCard(
                    "Currently Borrowed",
                    `${totalBorrowed} / ${borrowLimit}`,
                    "📚",
                    "Books currently in your possession"
                )}

                ${createStatCard(
                    "Remaining Capacity",
                    remainingCapacity,
                    "＋",
                    "Books you can still borrow"
                )}

                ${createStatCard(
                    "Books Returned",
                    returnedBooks,
                    "↩",
                    "Returned borrowing records"
                )}

                ${createStatCard(
                    "Overdue Books",
                    overdueBooks,
                    "⏰",
                    "Books past their due date"
                )}

            </div>


            <div class="dashboard-section">

                <div class="section-heading">

                    <div>
                        <h2>Explore your library</h2>

                        <p>
                            Find books and manage your borrowing activity.
                        </p>
                    </div>

                </div>

                <div class="quick-actions">

                    <button class="quick-action" data-page="books">

                        <span>🔎</span>

                        <strong>Browse Books</strong>

                        <small>Explore the book collection</small>

                    </button>

                    <button class="quick-action" data-page="borrowings">

                        <span>📖</span>

                        <strong>My Borrowings</strong>

                        <small>Track borrowed books</small>

                    </button>

                    <button class="quick-action" data-page="history">

                        <span>↩</span>

                        <strong>Borrowing History</strong>

                        <small>View previously borrowed books</small>

                    </button>

                </div>

            </div>

        `;


    } catch (error) {

        contentArea.innerHTML = `
            <div class="error-state">

                <h2>Unable to load dashboard</h2>

                <p>${error.message}</p>

                <button class="primary-button retry-button">
                    Retry
                </button>

            </div>
        `;

        contentArea.querySelector(".retry-button")
            ?.addEventListener("click", loadStudentDashboard);

    }

}


/* =========================================
   LOAD DASHBOARD BASED ON ROLE
========================================= */

async function loadDashboardForRole(role) {

    if (role === "admin") {

        await loadAdminDashboard();

    } else if (role === "student") {

        await loadStudentDashboard();

    } else {

        document.getElementById("content-area").innerHTML = `
            <div class="error-state">
                <h2>Unknown user role</h2>
                <p>Your account role could not be recognized.</p>
            </div>
        `;

    }

}
