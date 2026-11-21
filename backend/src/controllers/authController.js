const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// LOGIN
const login = async (req, res) => {

    try {

        const { username, password } = req.body;

        // 1. Validate input
        if (!username || !password) {
            return res.status(400).json({
                message: "Username and password are required"
            });
        }

        // 2. Find user in database
        const [users] = await db.execute(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        const user = users[0];

        // 3. Check account status
        if (!user.is_active) {
            return res.status(403).json({
                message: "Your account is inactive"
            });
        }

        // 4. Verify password using bcrypt
        const isPasswordValid = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!isPasswordValid) {
            return res.status(401).json({
                message: "Invalid username or password"
            });
        }

        // 5. Generate JWT token
        const token = jwt.sign(
            {
                userId: user.user_id,
                role: user.role,
                tokenVersion: user.token_version
            },
            process.env.JWT_SECRET,
            {
                expiresIn: process.env.JWT_EXPIRES_IN || "1h"
            }
        );

        // 6. Send successful response
        res.status(200).json({
            message: "Login successful",

            token: token,

            user: {
                user_id: user.user_id,
                username: user.username,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {

        console.error("Login error:", error);

        res.status(500).json({
            message: "Internal server error"
        });

    }

};


// LOGOUT
const logout = async (req, res) => {

    try {

        await db.execute(
            `UPDATE users
             SET token_version = token_version + 1
             WHERE user_id = ?`,
            [req.user.userId]
        );

        res.status(200).json({
            message: "Logout successful"
        });

    } catch (error) {

        console.error("Logout error:", error);

        res.status(500).json({
            message: "Internal server error"
        });

    }

};


// GET LOGGED-IN USER
const getMe = async (req, res) => {

    try {

        const [users] = await db.execute(
            `SELECT user_id, username, full_name, email, role
             FROM users
             WHERE user_id = ? AND is_active = TRUE`,
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        res.status(200).json({
            user: users[0]
        });

    } catch (error) {

        console.error("Get user error:", error);

        res.status(500).json({
            message: "Internal server error"
        });

    }

};


module.exports = {
    login,
    logout,
    getMe
};