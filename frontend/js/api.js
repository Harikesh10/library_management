
/* =========================================
   API CONFIGURATION
========================================= */

// const API_BASE_URL = "http://localhost:5000/api";

const API_BASE_URL = "https://library-management-backend-0wmd.onrender.com/api";
/* =========================================
   GENERAL API REQUEST
========================================= */

async function apiRequest(endpoint, options = {}) {

    const token = localStorage.getItem("token");

    const headers = {
        ...(options.headers || {})
    };

    // Attach JWT when available
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // Add JSON content type when sending JSON
    if (options.body && !headers["Content-Type"]) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {

        const error = new Error(
            data.message || `Request failed (${response.status})`
        );

        error.status = response.status;

        throw error;
    }

    return data;
}


/* =========================================
   BOOK COVERS REGISTRY & HELPERS
========================================= */

const DEFAULT_BOOK_COVERS = {
    1: "./images/covers/harry-potter-philosophers-stone.jpg",
    2: "./images/covers/harry-potter-chamber-of-secrets.jpg",
    3: "./images/covers/harry-potter-prisoner-of-azkaban.jpg",
    4: "./images/covers/curse-of-the-cheese-pyramid.jpg",
    5: "./images/covers/lost-treasure-of-the-emerald-eye.jpg",
    6: "./images/covers/clean-code.jpg"
};

const ISBN_COVERS = {
    "9780747532699": "./images/covers/harry-potter-philosophers-stone.jpg",
    "9780747538486": "./images/covers/harry-potter-chamber-of-secrets.jpg",
    "9780747542155": "./images/covers/harry-potter-prisoner-of-azkaban.jpg",
    "9780439559638": "./images/covers/curse-of-the-cheese-pyramid.jpg",
    "9780439559645": "./images/covers/lost-treasure-of-the-emerald-eye.jpg",
    "9780132350884": "./images/covers/clean-code.jpg"
};

function getBookCoverUrl(book) {
    if (!book) return "";
    if (typeof book === "string") return book;

    if (book.cover_image && typeof book.cover_image === "string" && book.cover_image.trim()) {
        return book.cover_image.trim();
    }

    const bookId = Number(book.book_id || book.id);
    if (bookId && DEFAULT_BOOK_COVERS[bookId]) {
        return DEFAULT_BOOK_COVERS[bookId];
    }

    const isbn = (book.isbn || "").trim();
    if (isbn && ISBN_COVERS[isbn]) {
        return ISBN_COVERS[isbn];
    }

    const title = (book.title || book.book_title || "").toLowerCase();
    if (title.includes("philosopher")) {
        return DEFAULT_BOOK_COVERS[1];
    }
    if (title.includes("chamber of secrets")) {
        return DEFAULT_BOOK_COVERS[2];
    }
    if (title.includes("prisoner of azkaban")) {
        return DEFAULT_BOOK_COVERS[3];
    }
    if (title.includes("cheese pyramid")) {
        return DEFAULT_BOOK_COVERS[4];
    }
    if (title.includes("emerald eye")) {
        return DEFAULT_BOOK_COVERS[5];
    }
    if (title.includes("clean code")) {
        return DEFAULT_BOOK_COVERS[6];
    }

    return "";
}

function renderBookCoverHTML(book, imgClass = "", fallbackEmoji = "📖") {
    const url = getBookCoverUrl(book);
    const title = typeof book === "object" ? (book?.title || "") : "";
    const escapedTitle = String(title || "Book Cover").replace(/"/g, "&quot;");

    if (url) {
        return `<img src="${url}" alt="${escapedTitle}" class="${imgClass}" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='inline-block';"><span class="cover-fallback" style="display:none;">${fallbackEmoji}</span>`;
    }

    return `<span class="cover-fallback">${fallbackEmoji}</span>`;
}

