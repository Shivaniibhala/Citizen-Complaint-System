// js/track.js

document.addEventListener('DOMContentLoaded', () => {
    const trackBtn = document.getElementById('btnTrack');
    
    if (trackBtn) {
        trackBtn.addEventListener('click', async () => {
            const id = document.getElementById('trackIdInput').value.trim();
            if (!id) {
                window.showToast("Please enter a valid Complaint ID", "error");
                return;
            }

            const searchBtnText = trackBtn.textContent;
            trackBtn.innerHTML = '<span class="btn-spinner"></span> Scanning...';
            trackBtn.disabled = true;

            setTimeout(() => {
                const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
                const target = complaints.find(c => c.complaintId === id);

                trackBtn.innerHTML = searchBtnText;
                trackBtn.disabled = false;

                if (target) {
                    window.showToast("Tracking matching records retrieved.", "success");
                    populateTrackingDetails(target);
                } else {
                    window.showToast("No database match found for ID.", "error");
                    document.getElementById('trackResult').classList.add('hidden');
                }
            }, 500); // UI delay
        });
    }
});

function populateTrackingDetails(data) {
    document.getElementById('trackResult').classList.remove('hidden');

    document.getElementById('rName').textContent = data.name;
    document.getElementById('rCategory').textContent = data.category;
    document.getElementById('rDepartment').textContent = data.department;
    document.getElementById('rLocation').textContent = data.location || 'N/A';
    document.getElementById('rDate').textContent = new Date(data.date).toLocaleString();
    
    const rStatus = document.getElementById('rStatus');
    rStatus.textContent = data.status;
    
    // Status visual map processing
    document.querySelectorAll('.timeline-step').forEach(s => s.classList.remove('active', 'completed'));

    const stPending = document.getElementById('stepPending');
    const stProg = document.getElementById('stepInProgress');
    const stRes = document.getElementById('stepResolved');

    if (data.status === 'Pending') {
        rStatus.className = 'badge pending';
        stPending.classList.add('active');
    } 
    else if (data.status === 'In Progress' || data.status === 'Assigned') {
        rStatus.className = 'badge in-progress';
        stPending.classList.add('completed');
        stProg.classList.add('active');
    } 
    else if (data.status === 'Resolved') {
        rStatus.className = 'badge resolved';
        stPending.classList.add('completed');
        stProg.classList.add('completed');
        stRes.classList.add('completed');
    }
}
