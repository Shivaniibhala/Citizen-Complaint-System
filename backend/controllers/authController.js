const User = require('../models/User');

exports.login = async (req, res) => {
    try {
        console.log(">>> [BACKEND] Executing /api/auth/login endpoint");
        const { email, password } = req.body;
        console.log(">>> [BACKEND] Attempting validation for user:", email);

        const user = await User.findOne({ email });

        if (!user || user.password !== password) {
            console.warn(">>> [BACKEND] Validation failed. Identity mapping invalid.");
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        console.log(`>>> [BACKEND] User validated securely. Role: [${user.role}]`);

        // Return core mapping
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department
            }
        });
    } catch (error) {
        console.error(">>> [BACKEND] Critical exception in Login node:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

exports.signup = async (req, res) => {
    try {
        console.log(">>> [BACKEND] Executing /api/auth/signup endpoint");
        const { name, email, password } = req.body;

        const exists = await User.findOne({ email });
        if (exists) {
            console.warn(">>> [BACKEND] Conflict error! Identity exists.");
            return res.status(400).json({ success: false, message: 'User already exists!' });
        }

        const newUser = await User.create({
            name,
            email,
            password,
            role: 'citizen'
        });

        console.log(">>> [BACKEND] Account correctly configured with role: citizen");

        res.status(201).json({
            success: true,
            data: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });
    } catch (error) {
        console.error(">>> [BACKEND] Critical signup exception:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};
