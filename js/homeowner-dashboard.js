/**
 * Homeowner Dashboard - Real-time Booking Updates
 * For Borrow My Charger application
 */

// Global variables
let lastCheckTime = 0;
let pollingInterval = 3000; // 3 seconds between checks
let pollingTimer = null;
let shownBookingIds = new Set(); // Track booking IDs that have already been shown

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Homeowner dashboard script loaded');
    initializeRealTimeUpdates();
});

/**
 * Initialize real-time updates for the homeowner dashboard
 */
function initializeRealTimeUpdates() {
    // Set initial check time to 5 minutes ago to catch recent bookings
    lastCheckTime = Math.floor(Date.now() / 1000) - 300;
    console.log(`Starting real-time updates, checking from: ${new Date(lastCheckTime * 1000).toLocaleString()}`);
    
    // Load existing bookings silently first (without notifications)
    loadExistingBookings();
    
    // Set up interval for regular checks (only show notifications for new bookings after initial load)
    pollingTimer = setInterval(checkForNewBookings, pollingInterval);
    
    // Add event listener to pause polling when tab is not visible
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Pause polling when tab is not visible
            clearInterval(pollingTimer);
            pollingTimer = null;
            console.log('Polling paused - tab not visible');
        } else {
            // Resume polling when tab becomes visible again
            if (!pollingTimer) {
                console.log('Resuming polling - tab visible again');
                checkForNewBookings();
                pollingTimer = setInterval(checkForNewBookings, pollingInterval);
            }
        }
    });
}

/**
 * Load existing bookings silently (without notifications)
 */
function loadExistingBookings() {
    // Add cache-busting parameter
    const timestamp = new Date().getTime();
    const url = `api/new-bookings.php?last_update=${lastCheckTime}&role=homeowner&_=${timestamp}`;
    
    console.log(`Loading existing bookings since ${new Date(lastCheckTime * 1000).toLocaleString()}`);
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Initial bookings loaded:', data);
            
            // Update last check time
            if (data.timestamp) {
                lastCheckTime = data.timestamp;
            }
            
            // Process existing bookings silently (no notifications)
            if (data.data && data.data.length > 0) {
                console.log(`Loaded ${data.data.length} existing bookings silently`);
                
                // Add bookings to table without notification
                addNewBookingsToTable(data.data);
                
                // Add these booking IDs to the set of shown bookings
                data.data.forEach(booking => shownBookingIds.add(booking.id));
            }
        })
        .catch(error => {
            console.error('Error loading existing bookings:', error);
        });
}

/**
 * Check for new bookings
 */
function checkForNewBookings() {
    // Add cache-busting parameter
    const timestamp = new Date().getTime();
    const url = `api/new-bookings.php?last_update=${lastCheckTime}&role=homeowner&_=${timestamp}`;
    
    console.log(`Checking for new bookings since ${new Date(lastCheckTime * 1000).toLocaleString()}`);
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('API response:', data);
            
            // Update last check time
            if (data.timestamp) {
                lastCheckTime = data.timestamp;
            }
            
            // Process new bookings
            if (data.data && data.data.length > 0) {
                // Filter out bookings that have already been shown
                const newBookings = data.data.filter(booking => !shownBookingIds.has(booking.id));
                
                if (newBookings.length > 0) {
                    console.log(`Found ${newBookings.length} new bookings that haven't been shown yet!`);
                    showNewBookingNotification(newBookings.length);
                    // Add new bookings to the table
                    addNewBookingsToTable(newBookings);
                    
                    // Add these booking IDs to the set of shown bookings
                    newBookings.forEach(booking => shownBookingIds.add(booking.id));
                }
            }
        })
        .catch(error => {
            console.error('Error fetching new bookings:', error);
        });
}

/**
 * Add new bookings to the table
 * @param {Array} bookings - Array of new booking objects
 */
function addNewBookingsToTable(bookings) {
    const bookingsTable = document.querySelector('#bookings-table tbody');
    if (!bookingsTable) {
        console.error('Bookings table not found');
        return;
    }
    
    // Process bookings in reverse order to maintain chronological order
    bookings.reverse().forEach(booking => {
        // Check if booking already exists in table
        if (document.querySelector(`tr[data-booking-id="${booking.id}"]`)) {
            console.log(`Booking ${booking.id} already in table, skipping`);
            return; // Skip if already in table
        }
        
        console.log(`Adding booking ${booking.id} to table`);
        
        // Create new row
        const row = document.createElement('tr');
        row.setAttribute('data-booking-id', booking.id);
        row.classList.add('new-booking'); // Add animation class
        
        // Format date
        const bookingDate = new Date(booking.booking_date);
        const formattedDate = bookingDate.toLocaleDateString();
        
        // Get status info
        const statusClass = getStatusClass(booking.status);
        const statusText = getStatusText(booking.status);
        const statusIcon = getStatusIcon(booking.status);
        
        // Set row content
        row.innerHTML = `
            <td>${booking.user_name} (${booking.user_email})</td>
            <td>${formattedDate}</td>
            <td>${booking.booking_time}</td>
            <td>${booking.message || 'No message'}</td>
            <td class="booking-status">
                <span class="badge ${statusClass}"><i class="fas ${statusIcon} mr-1"></i>${statusText}</span>
            </td>
            <td class="booking-actions">
                ${booking.status === 'pending' ? `
                    <div class="btn-group" role="group">
                        <a href="booking-action.php?id=${booking.id}&action=approve" class="btn btn-sm btn-success">Approve</a>
                        <a href="booking-action.php?id=${booking.id}&action=decline" class="btn btn-sm btn-danger">Decline</a>
                    </div>
                ` : `<span class="text-muted">No actions available</span>`}
            </td>
        `;
        
        // Add to table at the beginning
        bookingsTable.insertBefore(row, bookingsTable.firstChild);
        
        // If this is the first booking, remove the 'No booking requests yet' message
        if (bookingsTable.parentNode.parentNode.querySelector('p') && bookingsTable.parentNode.parentNode.querySelector('p').textContent.includes('No booking')) {
            bookingsTable.parentNode.parentNode.querySelector('p').remove();
        }
        
        // Add event listeners to the new buttons
        addActionButtonListeners(row);
    });
}

/**
 * Add event listeners to action buttons
 * @param {HTMLElement} row - The table row containing the buttons
 */
function addActionButtonListeners(row) {
    // Find approve and decline buttons
    const approveBtn = row.querySelector('.btn-success');
    const declineBtn = row.querySelector('.btn-danger');
    
    if (approveBtn) {
        approveBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            updateBookingStatus(url, 'approved', row);
        });
    }
    
    if (declineBtn) {
        declineBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            updateBookingStatus(url, 'declined', row);
        });
    }
}

/**
 * Update booking status via AJAX
 * @param {string} url - The action URL
 * @param {string} newStatus - The new status (approved or declined)
 * @param {HTMLElement} row - The table row to update
 */
function updateBookingStatus(url, newStatus, row) {
    // Show loading indicator
    const statusCell = row.querySelector('.booking-status');
    const actionsCell = row.querySelector('.booking-actions');
    const originalStatusHtml = statusCell.innerHTML;
    const originalActionsHtml = actionsCell.innerHTML;
    
    statusCell.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    actionsCell.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    
    // Send AJAX request
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update status cell
                const statusClass = newStatus === 'approved' ? 'badge-success' : 'badge-danger';
                const statusText = newStatus === 'approved' ? 'Approved' : 'Declined';
                const statusIcon = newStatus === 'approved' ? 'fa-check' : 'fa-times';
                
                statusCell.innerHTML = `<span class="badge ${statusClass}"><i class="fas ${statusIcon} mr-1"></i>${statusText}</span>`;
                actionsCell.innerHTML = '<span class="text-muted">No actions available</span>';
                
                // Add animation
                row.classList.add(newStatus === 'approved' ? 'booking-updated' : 'highlight-update');
                setTimeout(() => {
                    row.classList.remove('booking-updated', 'highlight-update');
                }, 3000);
                
                // Show success notification
                showNotification(`Booking ${newStatus} successfully`, 'success');
            } else {
                // Restore original content on error
                statusCell.innerHTML = originalStatusHtml;
                actionsCell.innerHTML = originalActionsHtml;
                showNotification(`Error: ${data.message || 'Could not update booking status'}`, 'danger');
            }
        })
        .catch(error => {
            console.error('Error updating booking status:', error);
            // Restore original content on error
            statusCell.innerHTML = originalStatusHtml;
            actionsCell.innerHTML = originalActionsHtml;
            showNotification('Error: Could not connect to server', 'danger');
        });
}

/**
 * Get status class based on status
 * @param {string} status - Booking status
 * @returns {string} CSS class for the badge
 */
function getStatusClass(status) {
    switch (status) {
        case 'pending': return 'badge-warning';
        case 'approved': return 'badge-success';
        case 'declined': return 'badge-danger';
        default: return 'badge-secondary';
    }
}

/**
 * Get status text based on status
 * @param {string} status - Booking status
 * @returns {string} Human-readable status text
 */
function getStatusText(status) {
    switch (status) {
        case 'pending': return 'Pending';
        case 'approved': return 'Approved';
        case 'declined': return 'Declined';
        default: return 'Unknown';
    }
}

/**
 * Get status icon based on status
 * @param {string} status - Booking status
 * @returns {string} Font Awesome icon class
 */
function getStatusIcon(status) {
    switch (status) {
        case 'pending': return 'fa-clock';
        case 'approved': return 'fa-check';
        case 'declined': return 'fa-times';
        default: return 'fa-question';
    }
}

/**
 * Show notification for new bookings
 * @param {number} count - Number of new bookings
 */
function showNewBookingNotification(count) {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'alert alert-info';
    notification.innerHTML = `
        <i class="fas fa-bell mr-2"></i>
        ${count === 1 ? 'A new booking has been received!' : `${count} new bookings have been received!`}
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 5000);
}

/**
 * Show a notification message
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, info, warning, danger)
 */
function showNotification(message, type = 'info') {
    // Create notification container if it doesn't exist
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.right = '20px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.innerHTML = `
        <button type="button" class="close" data-dismiss="alert">&times;</button>
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-circle' : 'fa-info-circle'} mr-2"></i>${message}
    `;
    
    // Add to container
    container.appendChild(notification);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        notification.classList.add('fade');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 5000);
}
