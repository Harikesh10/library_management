
/* =========================================
   AUTHENTICATION
========================================= */


/* =========================================
   INACTIVITY SESSION CONFIGURATION
========================================= */

const SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes

let inactivityTimer = null;
let inactivityListenersAttached = false;
let lastActivityTime = 0;


/* =========================================
   LOGIN
========================================= */

async function loginUser(username, password) {

    const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
            username,
            password
        })
    });

    // Expected login response contains a JWT
    if (!data.token) {
        throw new Error("Login response did not contain a token");
    }

    localStorage.setItem("token", data.token);

    // Retrieve actual user information using the JWT
    const user = await getCurrentUser();

    return user;
}


/* =========================================
   CURRENT USER
========================================= */

async function getCurrentUser() {

    const data = await apiRequest("/auth/me");

    // Handle common response structures
    const user = data.user || data;

    if (!user.user_id && !user.userId) {
        throw new Error("Unable to retrieve user information");
    }

    return user;
}


/* =========================================
   LOGOUT
========================================= */

async function logoutUser() {

    stopSessionTimer();

    try {

        if (localStorage.getItem("token")) {

            await apiRequest("/auth/logout", {
                method: "POST"
            });

        }

    } catch (error) {

        console.warn("Server logout failed:", error.message);

    } finally {

        localStorage.removeItem("token");

    }

}


/* =========================================
   SESSION RESTORE
========================================= */

async function restoreSession() {

    const token = localStorage.getItem("token");

    if (!token) {
        return null;
    }

    try {

        return await getCurrentUser();

    } catch (error) {

        localStorage.removeItem("token");

        return null;

    }

}


/* =========================================
   START INACTIVITY TIMER
========================================= */

function startSessionTimer() {

    stopSessionTimer();

    lastActivityTime = Date.now();

    if (!inactivityListenersAttached) {

        const activityEvents = [
            "mousemove",
            "mousedown",
            "keydown",
            "scroll",
            "touchstart",
            "click"
        ];

        activityEvents.forEach(eventName => {

            document.addEventListener(
                eventName,
                handleUserActivity,
                { passive: true }
            );

        });

        inactivityListenersAttached = true;

    }

    resetSessionTimer();

}


/* =========================================
   HANDLE USER ACTIVITY
========================================= */

function handleUserActivity() {

    if (!localStorage.getItem("token")) {
        return;
    }

    // Avoid excessive timer resets
    const now = Date.now();

    if (now - lastActivityTime < 1000) {
        return;
    }

    lastActivityTime = now;

    resetSessionTimer();

}


/* =========================================
   RESET SESSION TIMER
========================================= */

function resetSessionTimer() {

    clearTimeout(inactivityTimer);

    if (!localStorage.getItem("token")) {
        return;
    }

    inactivityTimer = setTimeout(
        handleSessionTimeout,
        SESSION_TIMEOUT
    );

}


/* =========================================
   SESSION TIMEOUT
========================================= */

async function handleSessionTimeout() {

    console.warn("Session expired due to inactivity.");

    await logoutUser();

    const loginFormElement = document.getElementById("login-form");

    const loginMessageElement = document.getElementById("login-message");

    if (loginFormElement) {
        loginFormElement.reset();
    }

    if (loginMessageElement) {

        loginMessageElement.textContent =
            "Session expired due to 10 minutes of inactivity. Please log in again.";

        loginMessageElement.className = "message error";

    }

    showLogin();

}


/* =========================================
   STOP SESSION TIMER
========================================= */

function stopSessionTimer() {

    clearTimeout(inactivityTimer);

    inactivityTimer = null;

}
