// middleware/authMiddleware.js
// Simplistic Role-Based Access Control Simulation

const verifyRole = (requiredRole) => {
    return (req, res, next) => {
        // In a real system, this would extract a JWT token from req.headers.authorization
        // For simulation, we check for a custom header 'x-user-role'
        const userRole = req.header('x-user-role');

        if (!userRole) {
            return res.status(401).json({ success: false, message: 'Authentication required. No role header provided.' });
        }

        // Validate Roles
        if (requiredRole === 'Admin' && userRole !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Forbidden. Admin access strictly required.' });
        }

        if (requiredRole === 'DepartmentOfficer' && userRole !== 'DepartmentOfficer' && userRole !== 'Admin') {
            return res.status(403).json({ success: false, message: 'Forbidden. Department Officer access required.' });
        }

        // Pass control to the controller
        next();
    };
};

module.exports = { verifyRole };
