/**
 * Live Search and Filtering for Charge Points
 * Simplified implementation for better performance and reliability
 */

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', function() {
    initLiveSearch();
    initMapUpdates();
    initBookingStatusUpdates();
});

// Global variables
let searchTimer;
let lastFilters = {};
let mapUpdatePoller = null;
let bookingUpdatePoller = null;

/**
 * Initialize live search functionality
 */
function initLiveSearch() {
    const searchForm = document.getElementById('search-form');
    if (!searchForm) return;
    
    // Get all filter elements
    const searchInput = document.getElementById('search-query');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const availableCheckbox = document.getElementById('available-only');
    const radiusSelect = document.getElementById('search-radius');
    
    // Add event listeners to all filter elements
    const filterElements = [searchInput, minPriceInput, maxPriceInput, availableCheckbox, radiusSelect];
    filterElements.forEach(element => {
        if (element) {
            element.addEventListener('input', debounceSearch);
            element.addEventListener('change', debounceSearch);
        }
    });
    
    // Prevent form submission (we'll handle it via AJAX)
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        performSearch();
    });
    
    // Initial search on page load
    performSearch();
}

/**
 * Debounce search to avoid too many requests
 */
function debounceSearch() {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(performSearch, 500);
}

/**
 * Perform AJAX search with current filters
 */
function performSearch() {
    const searchInput = document.getElementById('search-query');
    const minPriceInput = document.getElementById('min-price');
    const maxPriceInput = document.getElementById('max-price');
    const availableCheckbox = document.getElementById('available-only');
    const radiusSelect = document.getElementById('search-radius');
    
    // Create base filters object
    const filters = {
        query: searchInput ? searchInput.value.trim() : '',
        min_price: minPriceInput && minPriceInput.value ? minPriceInput.value : '',
        max_price: maxPriceInput && maxPriceInput.value ? maxPriceInput.value : '',
        available: availableCheckbox ? availableCheckbox.checked : true,
        radius: radiusSelect ? radiusSelect.value : 10
    };
    
    // Try to get user location if available
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            // Success callback
            function(position) {
                filters.lat = position.coords.latitude;
                filters.lng = position.coords.longitude;
                executeSearch(filters);
            },
            // Error callback - search without coordinates
            function() {
                executeSearch(filters);
            },
            // Options
            { timeout: 5000, maximumAge: 60000 }
        );
    } else {
        // Geolocation not supported, search without coordinates
        executeSearch(filters);
    }
}

/**
 * Execute AJAX search with filters
 */
function executeSearch(filters) {
    // Check if search parameters have changed
    const filtersString = JSON.stringify(filters);
    if (filtersString === JSON.stringify(lastFilters)) {
        return; // No change in filters, don't search again
    }
    
    // Update last filters
    lastFilters = JSON.parse(filtersString); // Create a deep copy to avoid reference issues
    
    // Show loading indicator
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
        resultsContainer.innerHTML = '<div class="text-center p-3"><div class="spinner-border text-primary" role="status"><span class="sr-only">Loading...</span></div></div>';
    }
    
    // Use the sendAjaxRequest utility function from ajax-utils.js
    sendAjaxRequest({
        method: 'GET',
        url: 'api/search-chargepoints.php',
        data: filters,
        success: function(response) {
            if (response && response.success) {
                updateSearchResults(response.data || []);
                
                // Update map if it exists and we have data
                if (typeof updateMap === 'function' && response.data && response.data.length > 0) {
                    updateMap(response.data);
                }
            } else {
                // Handle empty results
                if (resultsContainer) {
                    resultsContainer.innerHTML = '<div class="alert alert-info">No charge points found matching your criteria.</div>';
                }
            }
        },
        error: function(xhr, status, error) {
            console.error('Search error:', error);
            if (resultsContainer) {
                resultsContainer.innerHTML = '<div class="alert alert-danger">Error searching for charge points. Please try again.</div>';
            }
        }
    });
}

/**
 * Update search results in the DOM
 */
function updateSearchResults(chargePoints) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;
    
    // Handle empty results
    if (!chargePoints || chargePoints.length === 0) {
        resultsContainer.innerHTML = '<div class="alert alert-info text-center p-4"><i class="fas fa-info-circle mr-2"></i>No charge points found matching your criteria. Try adjusting your filters.</div>';
        return;
    }
    
    // Show result count
    let html = `<div class="alert alert-success mb-4"><i class="fas fa-check-circle mr-2"></i>Found ${chargePoints.length} charge point${chargePoints.length !== 1 ? 's' : ''}</div>`;
    
    html += '<div class="row">';
    
    // Sort by distance if available
    if (chargePoints[0].distance) {
        chargePoints.sort((a, b) => (a.distance || 9999) - (b.distance || 9999));
    }
    
    chargePoints.forEach(function(point) {
        // Format distance if available
        const distanceText = point.distance ? 
            `<span class="badge badge-info"><i class="fas fa-map-marker-alt mr-1"></i>${Math.round(point.distance * 10) / 10} km</span>` : '';
        
        // Check if price is valid
        const price = !isNaN(parseFloat(point.price)) ? 
            `£${parseFloat(point.price).toFixed(2)} per hour` : 'Price not available';
        
        html += `
            <div class="col-md-4 mb-4">
                <div class="card border-0 shadow-sm h-100" style="border-radius: 15px; overflow: hidden; transition: transform 0.3s;" onmouseover="this.style.transform='translateY(-5px)'" onmouseout="this.style.transform='translateY(0)'">
                    ${point.image ? 
                        `<img src="uploads/${point.image}" class="card-img-top" alt="Charge Point at ${point.address}" style="height: 200px; object-fit: cover;" onerror="this.src='images/default-chargepoint.jpg';this.onerror='';">`
                        : 
                        `<img src="images/default-chargepoint.jpg" class="card-img-top" alt="Charge Point" style="height: 200px; object-fit: cover;">`
                    }
                    <div class="card-body p-4">
                        <h5 class="card-title" style="font-weight: 600; letter-spacing: -0.025em;">${point.address}</h5>
                        <p class="card-text">
                            <i class="fas fa-user text-primary mr-2"></i>${point.owner_name || 'Unknown owner'}
                        </p>
                        <p class="card-text d-flex justify-content-between align-items-center">
                            <span><i class="fas fa-tag text-success mr-2"></i>${price}</span>
                            ${distanceText}
                        </p>
                        <a href="chargepoint.php?id=${point.id}" class="btn btn-primary btn-block" style="border-radius: 10px;">View Details</a>
                    </div>
                </div>
            </div>`;
    });
    
    html += '</div>';
    resultsContainer.innerHTML = html;
}

/**
 * Initialize real-time map updates
 */
function initMapUpdates() {
    // Only initialize if map exists
    if (typeof updateMap !== 'function') return;
    
    // Stop existing poller if any
    if (mapUpdatePoller && typeof mapUpdatePoller.stop === 'function') {
        mapUpdatePoller.stop();
    }
    
    // Get current timestamp for initial request
    const initialTimestamp = Math.floor(Date.now() / 1000) - 300; // Last 5 minutes
    
    // Start polling for map updates
    mapUpdatePoller = pollForUpdates(
        'api/map-updates.php',
        function(response) {
            if (response && response.success && response.chargePoints && response.chargePoints.length > 0) {
                // Update map with new charge points
                updateMap(response.chargePoints);
                
                // Show notification about new charge points
                if (response.count === 1) {
                    showNotification('A new charge point has been added!', 'info');
                } else if (response.count > 1) {
                    showNotification(`${response.count} new charge points have been added!`, 'info');
                }
            }
        },
        30000, // Check every 30 seconds
        { last_update: initialTimestamp }
    );
}

/**
 * Initialize real-time booking status updates
 */
function initBookingStatusUpdates() {
    // Only initialize on booking pages
    const bookingsContainer = document.getElementById('bookings-container');
    if (!bookingsContainer) return;
    
    // Stop existing poller if any
    if (bookingUpdatePoller && typeof bookingUpdatePoller.stop === 'function') {
        bookingUpdatePoller.stop();
    }
    
    // Get current timestamp for initial request
    const initialTimestamp = Math.floor(Date.now() / 1000) - 300; // Last 5 minutes
    
    // Start polling for booking updates
    bookingUpdatePoller = pollForUpdates(
        'api/booking-status.php',
        function(response) {
            if (response && response.success && response.data && response.data.length > 0) {
                // Update bookings in the UI
                updateBookings(response.data);
                
                // Show notification about booking updates
                if (response.data.length === 1) {
                    showNotification('A booking has been updated!', 'info');
                } else {
                    showNotification(`${response.data.length} bookings have been updated!`, 'info');
                }
            }
        },
        10000, // Check every 10 seconds
        { last_update: initialTimestamp }
    );
}

/**
 * Update bookings in the UI
 */
function updateBookings(bookings) {
    if (!bookings || !bookings.length) return;
    
    // Keep track of updated rows for animation
    const updatedRows = [];
    
    bookings.forEach(function(booking) {
        if (!booking || !booking.id) return;
        
        const bookingRow = document.getElementById(`booking-${booking.id}`);
        if (!bookingRow) return;
        
        // Add to list of updated rows
        updatedRows.push(bookingRow);
        
        // Update status badge
        const statusBadge = bookingRow.querySelector('.status-badge');
        if (statusBadge) {
            // Remove all existing status classes
            statusBadge.classList.remove('badge-warning', 'badge-success', 'badge-danger', 'badge-info');
            
            // Add appropriate class based on status
            switch(booking.status) {
                case 'pending':
                    statusBadge.classList.add('badge-warning');
                    statusBadge.innerHTML = '<i class="fas fa-clock mr-1"></i>Pending';
                    break;
                case 'approved':
                    statusBadge.classList.add('badge-success');
                    statusBadge.innerHTML = '<i class="fas fa-check mr-1"></i>Approved';
                    break;
                case 'declined':
                    statusBadge.classList.add('badge-danger');
                    statusBadge.innerHTML = '<i class="fas fa-times mr-1"></i>Declined';
                    break;
                case 'cancelled':
                    statusBadge.classList.add('badge-danger');
                    statusBadge.innerHTML = '<i class="fas fa-ban mr-1"></i>Cancelled';
                    break;
                default:
                    statusBadge.classList.add('badge-info');
                    statusBadge.textContent = booking.status;
            }
        }
        
        // Update action buttons based on status
        const actionButtons = bookingRow.querySelector('.booking-actions');
        if (actionButtons) {
            const approveBtn = actionButtons.querySelector('.approve-btn');
            const declineBtn = actionButtons.querySelector('.decline-btn');
            const cancelBtn = actionButtons.querySelector('.cancel-btn');
            
            // Handle finalized bookings
            if (booking.status === 'approved' || booking.status === 'declined' || booking.status === 'cancelled') {
                // Hide appropriate action buttons
                if (approveBtn) approveBtn.style.display = 'none';
                if (declineBtn) declineBtn.style.display = 'none';
                if (cancelBtn && (booking.status === 'declined' || booking.status === 'cancelled')) {
                    cancelBtn.style.display = 'none';
                }
                
                // Show a message if all buttons are hidden
                if (!actionButtons.querySelector('button[style="display: inline-block;"]')) {
                    actionButtons.innerHTML = '<div class="text-muted"><i class="fas fa-info-circle mr-1"></i>No actions available</div>';
                }
            }
        }
        
        // Update any date/time information if available
        if (booking.updated_at) {
            const updatedAtElement = bookingRow.querySelector('.updated-at');
            if (updatedAtElement) {
                const date = new Date(booking.updated_at);
                updatedAtElement.textContent = date.toLocaleString();
            }
        }
    });
    
    // Add highlight animation to updated rows
    updatedRows.forEach(row => {
        row.classList.add('highlight-update');
        setTimeout(() => {
            row.classList.remove('highlight-update');
        }, 3000);
    });
}
