
/* =========================================
   BOOK CATALOGUE MODULE
========================================= */

let catalogueBooks = [];
let catalogueSearchTimer = null;


/* =========================================
   LOAD BOOKS
========================================= */

async function loadBooksPage() {

    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `
        <div class="loading-state">
            Loading books...
        </div>
    `;

    try {

        await fetchCatalogueBooks();

        renderBooksPage();

    } catch (error) {

        contentArea.innerHTML = `
            <div class="error-state">
                <h2>Unable to load books</h2>
                <p>${escapeHTML(error.message)}</p>

                <button class="primary-button retry-button">
                    Retry
                </button>
            </div>
        `;

        contentArea.querySelector(".retry-button")
            ?.addEventListener("click", loadBooksPage);

    }

}


/* =========================================
   FETCH BOOKS
========================================= */

async function fetchCatalogueBooks(filters = {}) {

    const params = new URLSearchParams();

    if (filters.search) {
        params.set("search", filters.search);
    }

    if (filters.category) {
        params.set("category", filters.category);
    }

    // Only send availability if explicitly selected
    if (
        filters.available !== undefined &&
        filters.available !== ""
    ) {
        params.set("available", filters.available);
    }

    if (filters.sort) {
        params.set("sort", filters.sort);
    }

    if (filters.order) {
        params.set("order", filters.order);
    }

    const queryString = params.toString();

    const endpoint = queryString
        ? `/books?${queryString}`
        : "/books";

    const response = await apiRequest(endpoint);

    // Support common response structures
    catalogueBooks = Array.isArray(response)
        ? response
        : response.books ||
          response.data ||
          response.results ||
          [];

    if (!Array.isArray(catalogueBooks)) {
        catalogueBooks = [];
    }

}


/* =========================================
   HTML ESCAPING
========================================= */

function escapeHTML(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   CATEGORY GENERATION
========================================= */

function getCatalogueCategories() {

    const categories = catalogueBooks
        .map(book => book.category)
        .filter(category => category && category.trim());

    return [...new Set(categories)]
        .sort((a, b) => a.localeCompare(b));

}


/* =========================================
   RENDER BOOKS PAGE
========================================= */

function renderBooksPage() {

    const contentArea = document.getElementById("content-area");

    const categories = getCatalogueCategories();

    contentArea.innerHTML = `

        <div class="catalogue-header">

            <div>
                <span class="eyebrow">BOOK COLLECTION</span>

                <h1>Explore Books</h1>

                <p>
                    Search, discover and find books
                    available in your library.
                </p>
            </div>

        </div>


        <div class="catalogue-toolbar">

            <div class="catalogue-search">

                <span class="search-icon">⌕</span>

                <input
                    type="search"
                    id="book-search"
                    placeholder="Search by title, author or ISBN..."
                >

            </div>


            <select id="category-filter">

                <option value="">All Categories</option>

                ${categories.map(category => `
                    <option value="${escapeHTML(category)}">
                        ${escapeHTML(category)}
                    </option>
                `).join("")}

            </select>


            <select id="availability-filter">

                <option value="">All Books</option>

                <option value="true">
                    Available
                </option>

                <option value="false">
                    Unavailable
                </option>

            </select>


            <select id="sort-filter">

                <option value="title">Sort by Title</option>

                <option value="author">Sort by Author</option>

                <option value="published_year">Sort by Year</option>

                <option value="available_copies">Sort by Availability</option>

            </select>


            <select id="order-filter">

                <option value="asc">Ascending</option>

                <option value="desc">Descending</option>

            </select>

        </div>


        <div class="catalogue-results-header">

            <p id="book-count"></p>

            <button id="reset-filters" class="text-button">
                Reset filters
            </button>

        </div>


        <div id="book-grid" class="book-grid"></div>


        <div id="book-modal" class="book-modal hidden">

            <div class="book-modal-content">

                <button
                    class="modal-close"
                    id="modal-close"
                    aria-label="Close"
                >
                    ×
                </button>

                <div id="book-modal-body"></div>

            </div>

        </div>

    `;


    // Render the books
    populateBookCards(catalogueBooks);

    // Attach View Details and Borrow buttons
    attachCatalogueBookEvents();

    // Attach search, filters and modal events
    setupCatalogueEvents();

}


/* =========================================
   POPULATE BOOK CARDS
========================================= */

function populateBookCards(books) {

    const bookGrid = document.getElementById("book-grid");
    const bookCount = document.getElementById("book-count");

    if (!bookGrid) {
        return;
    }

    bookCount.textContent =
        `${books.length} book${books.length !== 1 ? "s" : ""} found`;

    if (books.length === 0) {

        bookGrid.innerHTML = `
            <div class="empty-state">

                <div class="empty-icon">📚</div>

                <h2>No books found</h2>

                <p>
                    Try changing your search or filters.
                </p>

            </div>
        `;

        return;
    }


    bookGrid.innerHTML = books.map(book => {

        const title = escapeHTML(book.title);
        const author = escapeHTML(book.author);
        const category = escapeHTML(book.category || "Uncategorized");
        const isbn = escapeHTML(book.isbn || "Not provided");
        const year = escapeHTML(book.published_year || "N/A");

        const available = Number(book.available_copies || 0);
        const total = Number(book.total_copies || 0);

        const isAvailable = available > 0;

        return `

            <article class="book-card">

                <div class="book-card-top">

                    <div class="book-cover-placeholder">
                        ${renderBookCoverHTML(book, "book-cover-img")}
                    </div>

                    <span class="availability-badge ${isAvailable ? "available" : "unavailable"}">

                        ${isAvailable ? "Available" : "Unavailable"}

                    </span>

                </div>


                <div class="book-card-body">

                    <span class="book-category">
                        ${category}
                    </span>

                    <h3>${title}</h3>

                    <p class="book-author">
                        By ${author}
                    </p>


                    <div class="book-meta">

                        <div>
                            <span>ISBN</span>
                            <strong>${isbn}</strong>
                        </div>

                        <div>
                            <span>Published</span>
                            <strong>${year}</strong>
                        </div>

                    </div>


                    <div class="stock-information">

                        <span>Stock</span>

                        <strong>
                            ${available} / ${total} available
                        </strong>

                    </div>


                    <button
                        class="book-details-button"
                        data-book-id="${escapeHTML(book.book_id)}"
                    >
                        View Details
                    </button>


                    <button
                        class="borrow-book-button"
                        data-book-id="${escapeHTML(book.book_id)}"
                        ${available <= 0 ? "disabled" : ""}
                    >
                        ${isAvailable
                            ? "Borrow Book"
                            : "Unavailable"}
                    </button>


                </div>

            </article>

        `;

    }).join("");

}


/* =========================================
   ATTACH BOOK CARD EVENTS
========================================= */

function attachCatalogueBookEvents() {


    // VIEW DETAILS BUTTONS

    document.querySelectorAll(".book-details-button")
        .forEach(button => {

            button.addEventListener("click", () => {

                showBookDetails(button.dataset.bookId);

            });

        });


    // BORROW BOOK BUTTONS

    document.querySelectorAll(".borrow-book-button")
        .forEach(button => {

            button.addEventListener("click", async () => {

                await borrowBookFromCatalogue(
                    button.dataset.bookId
                );

            });

        });

}


/* =========================================
   CATALOGUE EVENTS
========================================= */

function setupCatalogueEvents() {

    const searchInput = document.getElementById("book-search");
    const categoryFilter = document.getElementById("category-filter");
    const availabilityFilter = document.getElementById("availability-filter");
    const sortFilter = document.getElementById("sort-filter");
    const orderFilter = document.getElementById("order-filter");
    const resetButton = document.getElementById("reset-filters");


    // SEARCH

    searchInput.addEventListener("input", () => {

        clearTimeout(catalogueSearchTimer);

        catalogueSearchTimer = setTimeout(
            applyCatalogueFilters,
            350
        );

    });


    // FILTERS AND SORTING

    categoryFilter.addEventListener("change", applyCatalogueFilters);

    availabilityFilter.addEventListener("change", applyCatalogueFilters);

    sortFilter.addEventListener("change", applyCatalogueFilters);

    orderFilter.addEventListener("change", applyCatalogueFilters);


    // RESET FILTERS

    resetButton.addEventListener("click", async () => {

        searchInput.value = "";
        categoryFilter.value = "";
        availabilityFilter.value = "";
        sortFilter.value = "title";
        orderFilter.value = "asc";

        await applyCatalogueFilters();

    });


    // CLOSE MODAL BUTTON

    document.getElementById("modal-close")
        .addEventListener("click", closeBookModal);


    // CLOSE MODAL WHEN CLICKING OUTSIDE

    document.getElementById("book-modal")
        .addEventListener("click", (event) => {

            if (event.target.id === "book-modal") {
                closeBookModal();
            }

        });

}


/* =========================================
   APPLY FILTERS
========================================= */

async function applyCatalogueFilters() {

    const search = document.getElementById("book-search").value.trim();

    const category = document.getElementById("category-filter").value;

    const available = document.getElementById("availability-filter").value;

    const sort = document.getElementById("sort-filter").value;

    const order = document.getElementById("order-filter").value;

    const bookGrid = document.getElementById("book-grid");


    bookGrid.innerHTML = `
        <div class="loading-state">
            Updating catalogue...
        </div>
    `;


    try {

        await fetchCatalogueBooks({
            search,
            category,
            available,
            sort,
            order
        });


        // Re-render the filtered books

        populateBookCards(catalogueBooks);


        // Reattach events to newly created cards

        attachCatalogueBookEvents();


    } catch (error) {

        bookGrid.innerHTML = `
            <div class="error-state">
                <h2>Unable to update catalogue</h2>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

    }

}


/* =========================================
   BOOK DETAILS
========================================= */

async function showBookDetails(bookId) {

    const modal = document.getElementById("book-modal");

    const modalBody = document.getElementById("book-modal-body");

    modal.classList.remove("hidden");


    modalBody.innerHTML = `
        <div class="loading-state">
            Loading book details...
        </div>
    `;


    try {

        const response = await apiRequest(`/books/${bookId}`);

        const book = response.book || response.data || response;

        const available = Number(book.available_copies || 0);

        const total = Number(book.total_copies || 0);


        modalBody.innerHTML = `

            <span class="eyebrow">BOOK DETAILS</span>

            <div class="details-cover">
                ${renderBookCoverHTML(book, "details-cover-img")}
            </div>

            <h2>${escapeHTML(book.title)}</h2>

            <p class="details-author">
                By ${escapeHTML(book.author)}
            </p>


            <div class="details-information">

                <div>
                    <span>ISBN</span>
                    <strong>${escapeHTML(book.isbn || "N/A")}</strong>
                </div>

                <div>
                    <span>Category</span>
                    <strong>${escapeHTML(book.category || "N/A")}</strong>
                </div>

                <div>
                    <span>Publisher</span>
                    <strong>${escapeHTML(book.publisher || "N/A")}</strong>
                </div>

                <div>
                    <span>Publication Year</span>
                    <strong>${escapeHTML(book.published_year || "N/A")}</strong>
                </div>

                <div>
                    <span>Shelf Location</span>
                    <strong>${escapeHTML(book.shelf_location || "N/A")}</strong>
                </div>

                <div>
                    <span>Stock</span>
                    <strong>${available} / ${total}</strong>
                </div>

            </div>


            <div class="details-description">

                <h3>Description</h3>

                <p>
                    ${escapeHTML(book.description || "No description available.")}
                </p>

            </div>

        `;


    } catch (error) {

        modalBody.innerHTML = `
            <div class="error-state">
                <h2>Unable to load book</h2>
                <p>${escapeHTML(error.message)}</p>
            </div>
        `;

    }

}


/* =========================================
   CLOSE BOOK MODAL
========================================= */

function closeBookModal() {

    const modal = document.getElementById("book-modal");

    if (modal) {
        modal.classList.add("hidden");
    }

}
