const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
    complaintId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        default: ""
    },
    category: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'low'
    },
    department: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

const Complaint = mongoose.model('Complaint', complaintSchema);
module.exports = Complaint;
