// js/dashboard.js

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || currentUser.role !== 'citizen') return; 

    // Populate user info
    const dashboardName = document.getElementById('dashboardUserName');
    if (dashboardName) dashboardName.textContent = currentUser.name;

    // Load initial stats and complaints mapping via custom tracking
    loadDashboardData();

    // Nav Listeners
    document.getElementById('btnNewComplaint')?.addEventListener('click', () => {
        window.showView('newComplaintView');
        if (typeof window.initMap === 'function') {
            try { window.initMap(); } catch(e) {}
        }
    });

    document.getElementById('btnCancelComplaint')?.addEventListener('click', () => {
        window.showView('dashboardView');
    });

    document.getElementById('filterComplaints')?.addEventListener('change', (e) => {
        loadDashboardData(e.target.value);
    });
});

window.loadDashboardData = function(filter = 'All') {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return;
    
    const listContainer = document.getElementById('myComplaintsList');
    
    const allComplaints = JSON.parse(localStorage.getItem('complaints')) || [];
    let myComplaints = allComplaints.filter(c => c.email === currentUser.email);

    // Sort by most recent
    myComplaints.sort((a, b) => new Date(b.date) - new Date(a.date));

    const resolvedCount = myComplaints.filter(c => c.status === 'Resolved').length;
    const pendingCount = myComplaints.filter(c => c.status === 'Pending').length;
    
    document.getElementById('statTotal').textContent = myComplaints.length;
    document.getElementById('statResolved').textContent = resolvedCount;
    document.getElementById('statPending').textContent = pendingCount;

    let displayComplaints = myComplaints;
    if (filter !== 'All') {
        displayComplaints = myComplaints.filter(c => c.status === filter);
    }

    if (displayComplaints.length === 0) {
        listContainer.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">No complaints found.</p>';
    } else {
        listContainer.innerHTML = '';
        displayComplaints.forEach(c => {
            const badgeClass = c.status === 'Resolved' ? 'badge resolved' : 
                              c.status === 'In Progress' ? 'badge in-progress' : 'badge pending';
            
            const iconHTML = c.department === 'Road Department' ? '<i class="fa-solid fa-road"></i>' :
                             c.department === 'Electricity Department' ? '<i class="fa-solid fa-lightbulb"></i>' :
                             c.department === 'Water Department' ? '<i class="fa-solid fa-faucet-drip"></i>' :
                             c.department === 'Sanitation Department' ? '<i class="fa-solid fa-trash-can"></i>' :
                             '<i class="fa-solid fa-triangle-exclamation"></i>';

            const iconBg = c.department === 'Road Department' ? '#dcfce7' :
                           c.department === 'Electricity Department' ? '#fef08a' :
                           c.department === 'Water Department' ? '#dbeafe' :
                           c.department === 'Sanitation Department' ? '#ffedd5' : '#f3f4f6';
            const iconColor = c.department === 'Road Department' ? '#16a34a' :
                              c.department === 'Electricity Department' ? '#ca8a04' :
                              c.department === 'Water Department' ? '#2563eb' :
                              c.department === 'Sanitation Department' ? '#ea580c' : '#4b5563';

            const formattedDate = new Date(c.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

            listContainer.innerHTML += `
                <div class="complaint-card modern-card" style="display: flex; align-items: center; justify-content: space-between; padding: 1.5rem; margin-bottom: 1rem; border: 1px solid var(--border-color); box-shadow: none;">
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <div class="c-icon" style="width: 50px; height: 50px; border-radius: 50%; display: flex; justify-content: center; align-items: center; background: ${iconBg}; color: ${iconColor}; font-size: 1.5rem;">
                            ${iconHTML}
                        </div>
                        <div class="c-info">
                            <h4 style="margin-bottom: 0.2rem; color: var(--text-dark);">${c.title}</h4>
                            <div class="c-meta" style="font-size: 0.85rem; color: var(--text-muted); display: flex; gap: 10px; flex-wrap: wrap;">
                                <span><strong>ID:</strong> ${c.complaintId}</span> &bull;
                                <span><strong>Dept:</strong> ${c.department}</span>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.2rem;">
                                <span><strong>Location:</strong> ${c.location || (c.coordinates && c.coordinates.match(/\\d/) ? 'Coords: ' + c.coordinates : '') || 'N/A'}</span>
                                <br><span><strong>Filed on:</strong> ${formattedDate}</span>
                            </div>
                        </div>
                    </div>
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <span class="${badgeClass}">${c.status}</span>
                        <i class="fa-solid fa-chevron-right" style="color: var(--text-muted); cursor: pointer;"></i>
                    </div>
                </div>
            `;
        });
    }
}
