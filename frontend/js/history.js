
/* =========================================
   HISTORY MODULE
========================================= */

async function loadHistoryPage() {
    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `
        <div class="loading-state">Loading borrowing history...</div>
    `;

    try {
        const response = await apiRequest("/borrow/my");

        const records = response.records || response.borrowings || response.data || response;

        const history = Array.isArray(records)
            ? records.filter(book => book.status === "returned")
            : [];

        renderHistoryPage(history);

    } catch (error) {
        contentArea.innerHTML = `
            <div class="error-state">
                <h2>Unable to load history</h2>
                <p>${escapeHTML(error.message)}</p>
                <button class="primary-button" id="history-retry">
                    Retry
                </button>
            </div>
        `;

        document.getElementById("history-retry")
            ?.addEventListener("click", loadHistoryPage);
    }
}


function renderHistoryPage(history) {
    const contentArea = document.getElementById("content-area");

    if (history.length === 0) {
        contentArea.innerHTML = `
            <div class="empty-state">
                <h2>No borrowing history</h2>
                <p>You haven't returned any books yet.</p>
            </div>
        `;
        return;
    }

    contentArea.innerHTML = `
        <div class="history-page">

            <div class="history-header">
                <h2>My Reading History</h2>
                <p>View the books you've previously borrowed.</p>
            </div>

            <div class="history-table-container">
                <table class="history-table">
                    <thead>
                        <tr>
                            <th>Book</th>
                            <th>Borrowed Date</th>
                            <th>Due Date</th>
                            <th>Returned Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${history.map(book => `
                            <tr>
                                <td>
                                    <strong>${escapeHTML(book.title || "Unknown book")}</strong>
                                </td>

                                <td>${formatHistoryDate(book.borrowed_date)}</td>

                                <td>${formatHistoryDate(book.due_date)}</td>

                                <td>${formatHistoryDate(book.returned_date)}</td>

                                <td>
                                    <span class="history-status">
                                        Returned
                                    </span>
                                </td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
            </div>

        </div>
    `;
}


function formatHistoryDate(date) {
    if (!date) return "—";

    const parsedDate = new Date(date);

    if (isNaN(parsedDate.getTime())) return "—";

    return parsedDate.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}
