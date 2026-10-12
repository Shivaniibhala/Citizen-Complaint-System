const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

// Initialize 
require('dotenv').config({ path: require('path').resolve(__dirname, './.env') });
const connectDB = require('./config/db');

// Route Configurations
const complaintRoutes = require('./routes/complaintRoutes');
const adminRoutes = require('./routes/adminRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const authRoutes = require('./routes/authRoutes');
const User = require('./models/User');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json()); // Body Parser

// Connect MongoDB Database
connectDB();

const emailRoutes = require('./routes/emailRoutes');

// API Namespace mounts
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/department', departmentRoutes);
app.use('/api/email', emailRoutes);

// General mapping fallback
app.get('/', (req, res) => res.json({ message: 'Welcome to the Smart Citizen Complaint Management Server' }));

// Execution
const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
    console.log(`Backend Active: Running on PORT ${PORT}`);
    
    // Auto-Seed Database logically
    try {
        const adminExists = await User.findOne({ email: 'admin@gmail.com' });
        if(!adminExists) {
            await User.create({ name: 'System Admin', email: 'admin@gmail.com', password: 'admin123', role: 'admin' });
            console.log('--- DB Seeded: admin@gmail.com successfully inserted ---');
        }
        
        const roadDeptExists = await User.findOne({ email: 'road@dept.com' });
        if(!roadDeptExists) {
            await User.create({ name: 'Road Supervisor', email: 'road@dept.com', password: 'dept123', role: 'department', department: 'Road Department'});
            await User.create({ name: 'Water Supervisor', email: 'water@dept.com', password: 'dept123', role: 'department', department: 'Water Department'});
            console.log('--- DB Seeded: Department templates inserted ---');
        }
    } catch(err) {
        console.error('Seeder warning:', err.message);
    }
});
