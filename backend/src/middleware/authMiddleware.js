const jwt = require("jsonwebtoken");
const db = require("../config/db");

// VERIFY JWT TOKEN
const authenticate = async (req, res, next) => {

    try {

        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "Access denied. Token required."
            });
        }

        const token = authHeader.split(" ")[1];

        // Verify token signature and expiration
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        // Verify that account is still active and token is current
        const [users] = await db.execute(
            `SELECT user_id, role, token_version
             FROM users
             WHERE user_id = ? AND is_active = TRUE`,
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message: "Account not found or inactive"
            });
        }

        const user = users[0];

        if (user.token_version !== decoded.tokenVersion) {
            return res.status(401).json({
                message: "Session expired. Please login again."
            });
        }

        // Store verified identity on the request
        req.user = {
            userId: user.user_id,
            role: user.role
        };

        next();

    } catch (error) {

        return res.status(401).json({
            message: "Invalid or expired token"
        });

    }

};


// CHECK ADMIN ROLE
const authorizeAdmin = (req, res, next) => {

    if (req.user.role !== "admin") {
        return res.status(403).json({
            message: "Access denied. Admin privileges required."
        });
    }

    next();

};


module.exports = {
    authenticate,
    authorizeAdmin
};