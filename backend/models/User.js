const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['citizen', 'admin', 'department'],
        default: 'citizen'
    },
    department: {
        type: String,
        // Only required if role === 'department'
        default: null
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
