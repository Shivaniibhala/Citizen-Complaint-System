// js/admin.js

document.addEventListener('DOMContentLoaded', () => {
    loadComplaints();
});

function loadComplaints() {
    const tableBody = document.getElementById('complaintsBody');
    tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">Loading Records...</td></tr>';
    
    setTimeout(() => {
        let complaints = JSON.parse(localStorage.getItem('complaints')) || [];
        
        // Patch old data without ID natively on load
        let patched = false;
        complaints.forEach(c => {
            if (!c.complaintId) {
                c.complaintId = `CMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*9000+1000)}`;
                patched = true;
            }
        });
        if (patched) localStorage.setItem('complaints', JSON.stringify(complaints));

        // sort by newest
        complaints.sort((a,b) => new Date(b.date) - new Date(a.date));

        document.getElementById('adTotal').textContent = complaints.length;
        document.getElementById('adPending').textContent = complaints.filter(c => c.status === 'Pending').length;
        document.getElementById('adResolved').textContent = complaints.filter(c => c.status === 'Resolved').length;

        if (complaints.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No complaints found in system.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';
        complaints.forEach((c) => {
            const dateStr = new Date(c.date).toLocaleDateString();
            
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <strong>${c.complaintId}</strong><br>
                    <span style="font-size:0.8rem; color:#888;">${dateStr}</span>
                </td>
                <td>
                    ${c.name}<br>
                    <span style="font-size:0.8rem; color:#888;">${c.email}</span>
                </td>
                <td>
                    <strong>${c.category}</strong><br>
                    <span style="font-size:0.8rem; color:#aaa;">Loc: ${c.location || (c.coordinates && c.coordinates.match(/\\d/) ? 'Coords: ' + c.coordinates : '') || 'N/A'}</span>
                </td>
                <td>
                    <span class="badge priority-${c.priority.toLowerCase()}">${c.priority}</span>
                </td>
                <td>
                    <select class="admin-select dept-select" data-id="${c.complaintId}">
                        <option value="Road Department" ${c.department==='Road Department'?'selected':''}>Road</option>
                        <option value="Water Department" ${c.department==='Water Department'?'selected':''}>Water</option>
                        <option value="Electricity Department" ${c.department==='Electricity Department'?'selected':''}>Electricity</option>
                        <option value="Sanitation Department" ${c.department==='Sanitation Department'?'selected':''}>Sanitation</option>
                        <option value="General Department" ${c.department==='General Department'?'selected':''}>General</option>
                    </select>
                </td>
                <td>
                    <select class="admin-select status-select" data-id="${c.complaintId}">
                        <option value="Pending" ${c.status==='Pending'?'selected':''}>Pending</option>
                        <option value="In Progress" ${c.status==='In Progress'?'selected':''}>In Progress</option>
                        <option value="Resolved" ${c.status==='Resolved'?'selected':''}>Resolved</option>
                    </select>
                </td>
                <td style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn-primary" style="padding: 0.4rem 0.8rem;" onclick="saveAdminChanges('${c.complaintId}')">Save</button>
                    <button class="btn-secondary" style="padding: 0.4rem 0.8rem;" onclick="viewDetails('${c.complaintId}')">More Info</button>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }, 300);
}

window.saveAdminChanges = function(id) {
    const tr = document.querySelector(`select[data-id="${id}"]`).closest('tr');
    const newDept = tr.querySelector('.dept-select').value;
    const newStatus = tr.querySelector('.status-select').value;

    let complaints = JSON.parse(localStorage.getItem('complaints')) || [];
    const index = complaints.findIndex(c => c.complaintId === id);
    if(index !== -1) {
        const oldStatus = complaints[index].status;
        const userEmail = complaints[index].email;

        complaints[index].department = newDept;
        complaints[index].status = newStatus;
        localStorage.setItem('complaints', JSON.stringify(complaints));
        
        window.showToast("Record updated successfully!", "success");
        loadComplaints(); // reload the table and stats

        // Trigger Email Notification if status changed
        if (oldStatus !== newStatus) {
            fetch('http://localhost:5000/api/email/notify-status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: userEmail,
                    complaintId: id,
                    oldStatus: oldStatus,
                    newStatus: newStatus
                })
            }).catch(e => console.error('Email notification failed:', e));
        }
    }
}

window.viewDetails = function(id) {
    let complaints = JSON.parse(localStorage.getItem('complaints')) || [];
    const complaint = complaints.find(c => c.complaintId === id);
    if (!complaint) return;

    const modal = document.getElementById('detailsModal');
    const modalBody = document.getElementById('modalBodyContent');

    let imagesHtml = '';
    if (complaint.images && complaint.images.length > 0) {
        imagesHtml = '<div class="modal-image-preview"><strong>Uploaded Images:</strong><br>';
        complaint.images.forEach(img => {
            imagesHtml += `<img src="${img}" alt="Complaint Image">`;
        });
        imagesHtml += '</div>';
    } else {
        imagesHtml = '<p style="color:var(--text-muted); font-size:0.85rem;">No images uploaded.</p>';
    }

    modalBody.innerHTML = `
        <div><strong>Title:</strong> ${complaint.title || 'N/A'}</div>
        <div><strong>Description:</strong><br>
        <p style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: var(--border-radius-sm); margin-top: 0.5rem;">${complaint.description || 'No description provided.'}</p></div>
        ${imagesHtml}
    `;

    modal.classList.add('active');
}

window.closeDetailsModal = function() {
    const modal = document.getElementById('detailsModal');
    if (modal) {
        modal.classList.remove('active');
    }
}
