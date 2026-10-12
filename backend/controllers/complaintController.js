const Complaint = require('../models/Complaint');

// Helper for Unique ID
const generateComplaintId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomStr = Math.floor(Math.random() * 9000 + 1000).toString(); // 4 digit random
    return `CMP-${timestamp}-${randomStr}`;
};

// Auto-assignment Helper
const assignDepartment = (category) => {
    const cat = category.toLowerCase();
    if (cat.includes('road')) return 'Road Department';
    if (cat.includes('water')) return 'Water Department';
    if (cat.includes('electric')) return 'Electricity Department';
    if (cat.includes('garbage') || cat.includes('waste')) return 'Sanitation Department';
    return 'General Department';
};

// ==========================================
// CITIZEN LOGIC
// ==========================================

// @desc    Submit a new complaint
// @route   POST /api/complaints
// @access  Public
exports.submitComplaint = async (req, res) => {
    try {
        const { name, email, phone, category, title, description, priority } = req.body;
        
        const complaintId = generateComplaintId();
        const department = assignDepartment(category);

        const complaint = await Complaint.create({
            complaintId,
            name,
            email,
            phone,
            category,
            title,
            description,
            priority,
            department
        });

        res.status(201).json({
            success: true,
            data: complaint,
            message: 'Complaint submitted successfully!'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Track a specific complaint via ID
// @route   GET /api/complaints/:complaintId
// @access  Public
exports.trackComplaint = async (req, res) => {
    try {
        const complaint = await Complaint.findOne({ complaintId: req.params.complaintId });
        
        if (!complaint) {
            return res.status(404).json({ success: false, message: 'Complaint ID not found' });
        }
        res.status(200).json({ success: true, data: complaint });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Track an entire set of complaints via precise email (Dashboard helper)
// @route   GET /api/complaints/query/:email
// @access  Public
exports.lookupUserComplaints = async (req, res) => {
    try {
        // Technically this should utilize JWTs. We simply mock it via a params pull for UX sync
        const complaints = await Complaint.find({ email: req.params.email }).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: complaints.length, data: complaints });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// ADMIN LOGIC (Protected Routes)
// ==========================================

// @desc    Get all active complaints in the system
// @route   GET /api/admin/complaints
// @access  Private/Admin
exports.getAllComplaints = async (req, res) => {
    try {
        const complaints = await Complaint.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: complaints.length, data: complaints });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Manually reassign department
// @route   PUT /api/admin/assign/:id
// @access  Private/Admin
exports.assignDepartmentAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        const { department } = req.body;

        const complaint = await Complaint.findByIdAndUpdate(
            id,
            { department, status: 'Assigned' },
            { new: true, runValidators: true }
        );

        if(!complaint) return res.status(404).json({ success: false, message: "Complaint not found" });

        res.status(200).json({ success: true, message: `Reassigned successfully to ${department}`, data: complaint });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// DEPARTMENT LOGIC (Protected Routes)
// ==========================================

// @desc    Get complaints mapped to a specific department
// @route   GET /api/department/:dept
// @access  Private/Department
exports.getDepartmentComplaints = async (req, res) => {
    try {
        // Simple URI decoding just in case
        const targetDept = decodeURIComponent(req.params.dept);
        const complaints = await Complaint.find({ department: targetDept }).sort({ createdAt: -1 });
        
        res.status(200).json({ success: true, count: complaints.length, data: complaints });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update complaint status workflow
// @route   PUT /api/department/update/:id
// @access  Private/Department
exports.updateComplaintStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Ensure status mapping is valid
        const validStatuses = ['Pending', 'Assigned', 'In Progress', 'Resolved'];
        if(validStatuses.indexOf(status) === -1) {
            return res.status(400).json({ success: false, message: "Invalid status state" });
        }

        const oldComplaint = await Complaint.findById(id);
        if(!oldComplaint) return res.status(404).json({ success: false, message: "Complaint not found" });

        const oldStatus = oldComplaint.status;

        const complaint = await Complaint.findByIdAndUpdate(
            id,
            { status },
            { new: true, runValidators: true }
        );

        // Call internal email endpoint
        if (oldStatus !== status) {
            try {
                // Import dynamically to avoid circular dependencies if any
                const { sendStatusUpdateEmail } = require('./emailController');
                // Mock req and res for internal call
                const mockReq = { 
                    body: { 
                        email: complaint.email, 
                        complaintId: complaint.complaintId, 
                        oldStatus: oldStatus, 
                        newStatus: status 
                    } 
                };
                const mockRes = { 
                    status: () => ({ json: () => {} }) 
                };
                await sendStatusUpdateEmail(mockReq, mockRes);
            } catch (err) {
                console.error(">>> [BACKEND] Internal email trigger failed:", err.message);
            }
        }

        res.status(200).json({ success: true, data: complaint, message: `Status mapped to ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
