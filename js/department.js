// js/department.js
var API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', () => {
    loadDeptComplaints();
});

async function loadDeptComplaints() {
    const tbody = document.getElementById('deptComplaintsBody');
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if(!currentUser || currentUser.role !== 'department') return;

    document.getElementById('deptNameDisplay').textContent = currentUser.department;

    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Fetching Records...</td></tr>';
    
    try {
        const response = await fetch(`${API_URL}/department/${encodeURIComponent(currentUser.department)}`, {
            headers: { 'x-user-role': 'DepartmentOfficer' }
        });
        const result = await response.json();
        
        if (response.ok && result.success) {
            let complaints = result.data;
            const resolved = complaints.filter(c => c.status === 'Resolved').length;
            
            document.getElementById('deptTotal').textContent = complaints.length;
            document.getElementById('deptResolved').textContent = resolved;
            document.getElementById('deptPending').textContent = complaints.length - resolved;
            
            if (complaints.length === 0) {
                tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 2rem; color:var(--text-muted);">No assigned tickets.</td></tr>`;
                return;
            }
            
            tbody.innerHTML = '';
            complaints.forEach((comp) => {
                const row = document.createElement('tr');
                
                let resolveBtnObj = '';
                if (comp.status === 'Resolved') {
                    resolveBtnObj = `<button disabled class="btn-resolve">Resolved</button>`;
                } else if (comp.status === 'In Progress') {
                    resolveBtnObj = `<button onclick="deptMarkStatus('${comp._id}', 'Resolved')" class="btn-resolve" style="color:#000;">Mark Resolved</button>`;
                } else {
                    resolveBtnObj = `<button onclick="deptMarkStatus('${comp._id}', 'In Progress')" class="btn-resolve" style="color:#3b82f6; border-color:#3b82f6;">Start Progress</button>`;
                }
                    
                const priorityColor = comp.priority === 'high' ? '#ef4444' : comp.priority === 'medium' ? '#facc15' : '#4ade80';
                
                let badgeClass = 'badge ';
                if(comp.status === 'Resolved') badgeClass += 'resolved';
                else if(comp.status === 'In Progress') badgeClass += 'in-progress';
                else badgeClass += 'pending';
                
                let formattedCat = comp.category.replace('_', ' ');
                formattedCat = formattedCat.charAt(0).toUpperCase() + formattedCat.slice(1);
                
                row.innerHTML = `
                    <td><strong>${comp.complaintId}</strong></td>
                    <td>${comp.name}</td>
                    <td>${formattedCat}</td>
                    <td style="color:${priorityColor}; font-weight:600; text-transform:capitalize;">${comp.priority}</td>
                    <td><span class="${badgeClass}">${comp.status}</span></td>
                    <td>${resolveBtnObj}</td>
                `;
                tbody.appendChild(row);
            });
        }
    } catch (e) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: #ef4444;">Server error.</td></tr>`;
    }
}

window.deptMarkStatus = async function(dbId, targetStatus) {
    try {
        const response = await fetch(`${API_URL}/department/update/${dbId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'x-user-role': 'DepartmentOfficer' 
            },
            body: JSON.stringify({ status: targetStatus })
        });

        if (response.ok) {
            if(typeof window.showToast === 'function') {
               window.showToast(`Status elevated to ${targetStatus}!`, 'info'); 
            }
            loadDeptComplaints();
        }
    } catch(err) {
        console.error('Status updating failed over latency');
    }
}
