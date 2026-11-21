
/* =========================================
   PROFILE MODULE
========================================= */


/* =========================================
   LOAD PROFILE PAGE
========================================= */

async function loadProfilePage() {

    const contentArea = document.getElementById("content-area");

    contentArea.innerHTML = `
        <div class="loading-state">
            Loading profile...
        </div>
    `;

    try {

        const response = await apiRequest("/auth/me");

        const user = response.user || response;

        let dashboardData = null;

        // Load additional student statistics
        if (user.role === "student") {

            try {

                const dashboardResponse =
                    await apiRequest("/dashboard/student");

                dashboardData =
                    dashboardResponse.dashboard ||
                    dashboardResponse.data ||
                    dashboardResponse;

            } catch (error) {

                console.warn(
                    "Unable to load student statistics:",
                    error.message
                );

            }

        }

        renderProfilePage(user, dashboardData);

    } catch (error) {

        contentArea.innerHTML = `
            <div class="error-state">
                <h2>Unable to load profile</h2>
                <p>${escapeHTML(error.message)}</p>

                <button
                    class="primary-button"
                    id="profile-retry"
                >
                    Retry
                </button>
            </div>
        `;

        document.getElementById("profile-retry")
            ?.addEventListener("click", loadProfilePage);

    }

}


/* =========================================
   RENDER PROFILE
========================================= */

function renderProfilePage(user, dashboardData = null) {

    const contentArea = document.getElementById("content-area");

    const fullName =
        user.full_name ||
        user.fullName ||
        user.username ||
        "User";

    const username = user.username || "Not available";

    const email = user.email || "Not provided";

    const role = user.role || "user";

    const userId =
        user.user_id ||
        user.userId ||
        "N/A";

    const initial = fullName.charAt(0).toUpperCase();


    // Extract student statistics where available
    const borrowingData =
        dashboardData?.borrowings ||
        dashboardData?.borrowing ||
        dashboardData ||
        {};

    const activeBooks =
        borrowingData.active_borrowings ??
        borrowingData.current_borrowings ??
        borrowingData.currently_borrowed ??
        borrowingData.active_books ??
        0;

    const borrowingLimit =
        borrowingData.borrowing_limit ??
        borrowingData.max_books ??
        borrowingData.limit ??
        3;

    const remainingBooks =
        borrowingData.remaining_capacity ??
        borrowingData.remaining_books ??
        Math.max(0, Number(borrowingLimit) - Number(activeBooks));


    contentArea.innerHTML = `

        <div class="profile-page">


            <!-- PROFILE HEADER -->

            <div class="profile-header-card">

                <div class="profile-avatar-large">
                    ${escapeHTML(initial)}
                </div>

                <div class="profile-header-info">

                    <span class="eyebrow">
                        ACCOUNT PROFILE
                    </span>

                    <h1>
                        ${escapeHTML(fullName)}
                    </h1>

                    <p>
                        ${escapeHTML(username)}
                    </p>

                    <span class="profile-role-badge">
                        ${escapeHTML(role.toUpperCase())}
                    </span>

                </div>

            </div>


            <!-- ACCOUNT INFORMATION -->

            <div class="profile-section">

                <div class="profile-section-header">

                    <h2>Personal Information</h2>

                    <p>
                        Your account information
                    </p>

                </div>


                <div class="profile-information-grid">


                    <div class="profile-information-item">

                        <span class="profile-label">
                            Full Name
                        </span>

                        <strong>
                            ${escapeHTML(fullName)}
                        </strong>

                    </div>


                    <div class="profile-information-item">

                        <span class="profile-label">
                            Username
                        </span>

                        <strong>
                            ${escapeHTML(username)}
                        </strong>

                    </div>


                    <div class="profile-information-item">

                        <span class="profile-label">
                            Email Address
                        </span>

                        <strong>
                            ${escapeHTML(email)}
                        </strong>

                    </div>


                    <div class="profile-information-item">

                        <span class="profile-label">
                            Account ID
                        </span>

                        <strong>
                            ${escapeHTML(userId)}
                        </strong>

                    </div>


                    <div class="profile-information-item">

                        <span class="profile-label">
                            Account Role
                        </span>

                        <strong>
                            ${escapeHTML(role)}
                        </strong>

                    </div>


                    <div class="profile-information-item">

                        <span class="profile-label">
                            Account Status
                        </span>

                        <strong class="profile-status-active">
                            Active
                        </strong>

                    </div>


                </div>

            </div>


            <!-- STUDENT INFORMATION -->

            ${role === "student" ? `

                <div class="profile-section">

                    <div class="profile-section-header">

                        <h2>Borrowing Overview</h2>

                        <p>
                            Your library borrowing capacity
                        </p>

                    </div>


                    <div class="profile-statistics-grid">


                        <div class="profile-stat-card">

                            <span>
                                Currently Borrowed
                            </span>

                            <h3>
                                ${escapeHTML(activeBooks)}
                            </h3>

                        </div>


                        <div class="profile-stat-card">

                            <span>
                                Borrowing Limit
                            </span>

                            <h3>
                                ${escapeHTML(borrowingLimit)}
                            </h3>

                        </div>


                        <div class="profile-stat-card">

                            <span>
                                Remaining Capacity
                            </span>

                            <h3>
                                ${escapeHTML(remainingBooks)}
                            </h3>

                        </div>


                    </div>

                </div>

            ` : ""}


            <!-- ACCOUNT SECURITY -->

            <div class="profile-section">

                <div class="profile-section-header">

                    <h2>Account Security</h2>

                    <p>
                        Your account is protected by authentication.
                    </p>

                </div>


                <div class="profile-security-card">

                    <div>

                        <span class="security-icon">
                            🔐
                        </span>

                    </div>

                    <div>

                        <strong>
                            Secure Session
                        </strong>

                        <p>
                            Your account automatically logs out
                            after 10 minutes of inactivity.
                        </p>

                    </div>

                </div>

            </div>


        </div>

    `;

}
