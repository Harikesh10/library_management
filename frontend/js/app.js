
/* =========================================
   DOM ELEMENTS
========================================= */

const loginPage = document.getElementById("login-page");
const dashboardPage = document.getElementById("dashboard-page");

const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-button");
const loginMessage = document.getElementById("login-message");

const logoutButton = document.getElementById("logout-button");

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const userNameElement = document.getElementById("user-name");
const userRoleElement = document.getElementById("user-role");
const userAvatarElement = document.getElementById("user-avatar");

const welcomeHeading = document.getElementById("welcome-heading");

const pageTitle = document.getElementById("page-title");
const pageSubtitle = document.getElementById("page-subtitle");


/* =========================================
   SHOW LOGIN
========================================= */

function showLogin() {

    loginPage.classList.remove("hidden");
    dashboardPage.classList.add("hidden");

}


/* =========================================
   SHOW APPLICATION
========================================= */

function showDashboard(user) {

    loginPage.classList.add("hidden");
    dashboardPage.classList.remove("hidden");

    const fullName =
        user.full_name ||
        user.fullName ||
        user.username ||
        "User";

    const role = user.role || "student";

    userNameElement.textContent = fullName;
    userRoleElement.textContent = role;

    userAvatarElement.textContent =
        fullName.charAt(0).toUpperCase();

    welcomeHeading.textContent = `Welcome, ${fullName}!`;

    pageTitle.textContent = "Dashboard";

    pageSubtitle.textContent =
        role === "admin"
            ? "Manage your library efficiently."
            : "Discover and manage your books.";

    configureNavigation(role);

    // Start the inactivity timer
    startSessionTimer();

    loadDashboardForRole(role);

}


/* =========================================
   ROLE BASED NAVIGATION
========================================= */

function configureNavigation(role) {

    const navigation = document.getElementById(
        "sidebar-navigation"
    );

    if (role === "admin") {

        navigation.innerHTML = `
            <a href="#" class="nav-item active" data-page="dashboard">
                <span class="nav-icon">⌂</span>
                Dashboard
            </a>

            <a href="#" class="nav-item" data-page="books">
                <span class="nav-icon">▤</span>
                Book Management
            </a>

            <a href="#" class="nav-item" data-page="borrowings">
                <span class="nav-icon">▣</span>
                Borrowing Records
            </a>

            <a href="#" class="nav-item" data-page="overdue">
                <span class="nav-icon">◷</span>
                Overdue Books
            </a>

            <a href="#" class="nav-item" data-page="profile">
                <span class="nav-icon">◉</span>
                My Profile
            </a>
        `;

    } else {

        navigation.innerHTML = `
            <a href="#" class="nav-item active" data-page="dashboard">
                <span class="nav-icon">⌂</span>
                Dashboard
            </a>

            <a href="#" class="nav-item" data-page="books">
                <span class="nav-icon">▤</span>
                Browse Books
            </a>

            <a href="#" class="nav-item" data-page="borrowings">
                <span class="nav-icon">▣</span>
                My Borrowings
            </a>

            <a href="#" class="nav-item" data-page="history">
                <span class="nav-icon">◷</span>
                History
            </a>

            <a href="#" class="nav-item" data-page="profile">
                <span class="nav-icon">◉</span>
                My Profile
            </a>
        `;

    }

}


/* =========================================
   LOGIN FORM
========================================= */

loginForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const username = usernameInput.value.trim();
    const password = passwordInput.value;

    loginMessage.textContent = "";
    loginMessage.className = "message";

    loginButton.disabled = true;
    loginButton.textContent = "Signing in...";

    try {

        const user = await loginUser(username, password);

        loginMessage.textContent = "Login successful!";
        loginMessage.className = "message success";

        showDashboard(user);

    } catch (error) {

        loginMessage.textContent = error.message;
        loginMessage.className = "message error";

    } finally {

        loginButton.disabled = false;
        loginButton.textContent = "Sign in";

    }

});


/* =========================================
   LOGOUT
========================================= */

logoutButton.addEventListener("click", async () => {

    await logoutUser();

    loginForm.reset();

    loginMessage.textContent = "";
    loginMessage.className = "message";

    showLogin();

});


/* =========================================
   NAVIGATION CLICK HANDLING
========================================= */

document.addEventListener("click", (event) => {

    const navItem = event.target.closest(".nav-item");

    if (!navItem || navItem.dataset.page === undefined) {
        return;
    }

    event.preventDefault();


    // Update active navigation item

    const items = document.querySelectorAll(
        "#sidebar-navigation .nav-item"
    );

    items.forEach(item => {
        item.classList.remove("active");
    });

    navItem.classList.add("active");


    const page = navItem.dataset.page;

    const role = userRoleElement.textContent.trim();


    // Update page title

    if (page === "borrowings" && role === "admin") {

        pageTitle.textContent = "Borrowing Records";

    } else if (page === "borrowings" && role === "student") {

        pageTitle.textContent = "My Borrowings";

    } else if (page === "overdue") {

        pageTitle.textContent = "Overdue Books";

    } else if (page === "profile") {

        pageTitle.textContent = "My Profile";

    } else {

        pageTitle.textContent =
            page.charAt(0).toUpperCase() + page.slice(1);

    }


    /* =========================================
       ROUTING
    ========================================= */


    // DASHBOARD

    if (page === "dashboard") {

        loadDashboardForRole(role);

    }


    // BOOK MANAGEMENT / CATALOGUE

    else if (page === "books") {

        if (role === "admin") {

            loadAdminBooksPage();

        } else {

            loadBooksPage();

        }

    }


    // BORROWING RECORDS

    else if (page === "borrowings") {

        if (role === "student") {

            loadMyBorrowingsPage();

        } else if (role === "admin") {

            loadAdminBorrowingsPage();

        }

    }


    // OVERDUE BOOKS - ADMIN

    else if (page === "overdue") {

        if (role === "admin") {

            loadAdminOverduePage();

        }

    }

    // HISTORY

    else if (page === "history") {

        loadHistoryPage();

    }


    // PROFILE

    else if (page === "profile") {

        loadProfilePage();

    }


    // OTHER PAGES

    else {

        const contentArea = document.getElementById("content-area");

        contentArea.innerHTML = `
            <div class="welcome-card">

                <span class="eyebrow">
                    COMING NEXT
                </span>

                <h1>${pageTitle.textContent}</h1>

                <p>
                    This section will be implemented
                    in the upcoming frontend phase.
                </p>

            </div>
        `;

    }

});


/* =========================================
   QUICK ACTIONS
========================================= */

document.addEventListener("click", (event) => {

    const quickAction = event.target.closest(".quick-action");

    if (!quickAction) {
        return;
    }

    const page = quickAction.dataset.page;

    if (!page) {
        return;
    }

    const matchingNav = document.querySelector(
        `#sidebar-navigation .nav-item[data-page="${page}"]`
    );

    if (matchingNav) {
        matchingNav.click();
    }

});


/* =========================================
   INITIAL APPLICATION LOAD
========================================= */

async function initializeApp() {

    // Prevent premature login/dashboard display
    loginPage.classList.add("hidden");
    dashboardPage.classList.add("hidden");

    const contentArea = document.getElementById("content-area");

    if (contentArea) {

        contentArea.innerHTML = `
            <div class="loading-state">
                Checking your session...
            </div>
        `;

    }

    try {

        const user = await restoreSession();

        if (user) {

            showDashboard(user);

        } else {

            showLogin();

        }

    } catch (error) {

        console.error("Application initialization error:", error);

        showLogin();

    }

}


initializeApp();
