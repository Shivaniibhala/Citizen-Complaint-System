// js/form.js

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('complaintForm');
    
    // Character Counter
    const descInput = document.getElementById('detailedDescription');
    const descCounter = document.getElementById('descCounter');
    
    if (descInput && descCounter) {
        descInput.addEventListener('input', () => {
            const current = descInput.value.length;
            descCounter.textContent = `${current} / 500`;
            if(current > 500) {
                descCounter.style.color = '#ef4444';
            } else {
                descCounter.style.color = 'var(--text-muted)';
            }
        });
    }

    // Google Maps logic stub
    let map, marker, geocoder;
    window.initMap = function() {
        geocoder = new google.maps.Geocoder();
    }

    function updateLocationInfo(lat, lng) {
        document.getElementById('coordsDisplay').textContent = `Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        if (geocoder) {
            const btn = document.getElementById('useLocationBtn');
            if (btn) {
                btn.textContent = 'Geocoding...';
                btn.disabled = true;
            }
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === "OK" && results[0]) {
                    const comps = results[0].address_components;
                    let street = '', city = '', town = '';
                    comps.forEach(c => {
                        if(c.types.includes('route')) street = c.long_name;
                        if(c.types.includes('locality') || c.types.includes('administrative_area_level_2')) city = c.long_name;
                        if(c.types.includes('sublocality') || c.types.includes('administrative_area_level_3')) town = c.long_name;
                    });
                    const addr = [street, town, city].filter(Boolean).join(', ') || results[0].formatted_address;
                    document.getElementById('addressInput').value = addr;
                }
                if (btn) {
                    btn.textContent = 'Use Current Location';
                    btn.disabled = false;
                }
            });
        }
    }

    document.getElementById('useLocationBtn')?.addEventListener('click', function() {
        const btn = this;
        if (navigator.geolocation) {
            const originalText = btn.textContent;
            btn.textContent = 'Fetching...';
            btn.disabled = true;
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                // removed map handling since map node does not exist
                updateLocationInfo(lat, lng);
            }, () => {
                window.showToast("Location access denied or failed.", "error");
                btn.textContent = originalText;
                btn.disabled = false;
            });
        }
    });

    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Validate session
            const currentUser = JSON.parse(localStorage.getItem('currentUser'));
            if (!currentUser) {
                window.showToast("Login required.", "error");
                return;
            }

            const addressVal = document.getElementById('addressInput').value;
            const coordsVal = document.getElementById('coordsDisplay').textContent;
            
            // Allow empty location submission as requested


            const submitBtn = form.querySelector('.submit-btn');
            const desc = descInput.value;
            
            if(desc.length > 500) {
                window.showToast("Description exceeds 500 characters limiting.", "error");
                return;
            }

            const category = document.getElementById('category').value;
            
            // Auto Department Assignment Logic
            let assignedDepartment = 'General Department';
            const catLower = category.toLowerCase();
            if (catLower.includes('road')) assignedDepartment = 'Road Department';
            else if (catLower.includes('water')) assignedDepartment = 'Water Department';
            else if (catLower.includes('electric')) assignedDepartment = 'Electricity Department';
            else if (catLower.includes('garbage') || catLower.includes('waste')) assignedDepartment = 'Sanitation Department';

            const coordsText = document.getElementById('coordsDisplay').textContent.replace('Coordinates: ', '').trim();
            const isValidCoords = coordsText && /\d/.test(coordsText);
            const finalLocation = addressVal || (isValidCoords ? `Coords: ${coordsText}` : '');

            const originalText = submitBtn.textContent;
            submitBtn.innerHTML = '<span class="btn-spinner"></span> Submitting...';
            submitBtn.disabled = true;

            const imageInput = document.getElementById('imageUpload');
            const files = imageInput ? imageInput.files : [];
            const readFilesPromises = Array.from(files).map(file => {
                return new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = (e) => resolve(e.target.result);
                    reader.onerror = reject;
                    reader.readAsDataURL(file);
                });
            });

            Promise.all(readFilesPromises).then(imagesBase64 => {
                const payload = {
                    complaintId: `CMP-${Date.now().toString().slice(-6)}-${Math.floor(Math.random()*9000+1000)}`,
                    name: document.getElementById('fullName').value,
                    email: document.getElementById('email').value,
                    phone: document.getElementById('phone').value,
                    category: category,
                    title: document.getElementById('complaintTitle').value,
                    description: desc,
                    priority: document.querySelector('input[name="priority"]:checked')?.value || 'low',
                    location: finalLocation,
                    coordinates: coordsText,
                    department: assignedDepartment,
                    status: 'Pending',
                    date: new Date().toISOString(),
                    images: imagesBase64
                };

                setTimeout(() => {
                    const complaints = JSON.parse(localStorage.getItem('complaints')) || [];
                    complaints.push(payload);
                    localStorage.setItem('complaints', JSON.stringify(complaints));

                    submitBtn.innerHTML = originalText;
                    submitBtn.disabled = false;
                    
                    window.showToast(`Success! Tracking ID: ${payload.complaintId}`, "success");
                    form.reset();
                    if(descCounter) descCounter.textContent = "0 / 500";
                    
                    // Complete routing
                    if (typeof window.showView === 'function') {
                        window.showView('dashboardView');
                        if (typeof window.loadDashboardData === 'function') {
                            window.loadDashboardData();
                        }
                    }
                }, 600); // Simulate network delay
            }).catch(err => {
                console.error("Image processing error", err);
                window.showToast("Failed to process images.", "error");
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            });
        });
    }
});
