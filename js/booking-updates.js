/**
 * Real-time booking updates for Borrow My Charger
 * 
 * This script provides real-time updates for bookings in the user dashboard
 * using AJAX polling to check for changes in booking status.
 */

// Global variables
let bookingsPoller = null;
let lastUpdateTimestamp = 0;
let currentUserRole = '';

/**
 * Initialize real-time booking updates
 * @param {string} userRole - The role of the current user (user, homeowner, admin)
 */
function initBookingUpdates(userRole) {
    // Store user role
    currentUserRole = userRole;
    
    // Get initial timestamp
    lastUpdateTimestamp = Math.floor(Date.now() / 1000);
    
    // Start polling for updates
    startBookingUpdates();
    
    // Set up UI event handlers
    setupBookingEventHandlers();
    
    console.log(`Booking updates initialized for ${userRole} role`);
}

/**
 * Start polling for booking updates
 */
function startBookingUpdates() {
    // Stop any existing poller
    if (bookingsPoller && bookingsPoller.isActive()) {
        bookingsPoller.stop();
    }
    
    // Create new poller
    bookingsPoller = pollForUpdates(
        'api/booking-status.php',
        handleBookingUpdates,
        10000, // Poll every 10 seconds
        { last_update: lastUpdateTimestamp }
    );
    
    console.log('Started polling for booking updates');
}

/**
 * Handle booking updates from the server
 * @param {Object} response - The response from the server
 */
function handleBookingUpdates(response) {
    if (!response || !response.success) {
        console.error('Error getting booking updates:', response);
        return;
    }
    
    // Update timestamp for next request
    lastUpdateTimestamp = response.timestamp;
    
    // Check if we have any updates
    if (!response.data || response.data.length === 0) {
        return; // No updates, nothing to do
    }
    
    console.log(`Received ${response.data.length} booking updates`);
    
    // Process booking updates
    const bookings = response.data;
    
    // Update UI based on user role
    switch (currentUserRole) {
        case 'user':
            updateUserBookings(bookings);
            break;
            
        case 'homeowner':
            updateHomeownerBookings(bookings);
            break;
            
        case 'admin':
            updateAdminBookings(bookings);
            break;
    }
    
    // Show notification if we have updates
    if (bookings.length > 0) {
        // Show appropriate notification based on booking status
        const approvedBookings = bookings.filter(b => b.status === 'approved').length;
        const declinedBookings = bookings.filter(b => b.status === 'declined').length;
        const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;
        
        if (approvedBookings > 0) {
            showNotification(`${approvedBookings} booking(s) have been approved!`, 'success');
        }
        
        if (declinedBookings > 0) {
            showNotification(`${declinedBookings} booking(s) have been declined.`, 'warning');
        }
        
        if (cancelledBookings > 0) {
            showNotification(`${cancelledBookings} booking(s) have been cancelled.`, 'info');
        }
        
        // If there are other status updates, show a generic notification
        const otherUpdates = bookings.length - (approvedBookings + declinedBookings + cancelledBookings);
        if (otherUpdates > 0) {
            showNotification(`${otherUpdates} booking update(s) received`, 'info');
        }
    }
}

/**
 * Update the UI for user bookings
 * @param {Array} bookings - Array of updated bookings
 */
function updateUserBookings(bookings) {
    bookings.forEach(booking => {
        // Find the booking element in the DOM
        const bookingElement = document.querySelector(`#booking-${booking.id}`);
        
        if (bookingElement) {
            // Update status badge
            const statusBadge = bookingElement.querySelector('.status-badge');
            if (statusBadge) {
                // Remove all status classes
                statusBadge.classList.remove('badge-warning', 'badge-success', 'badge-danger', 'badge-secondary');
                
                // Add appropriate class based on status
                let badgeClass = 'badge-secondary';
                switch (booking.status) {
                    case 'pending':
                        badgeClass = 'badge-warning';
                        break;
                    case 'approved':
                        badgeClass = 'badge-success';
                        break;
                    case 'declined':
                    case 'cancelled':
                        badgeClass = 'badge-danger';
                        break;
                }
                
                statusBadge.classList.add(badgeClass);
                statusBadge.textContent = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
            }
            
            // Highlight the updated booking
            bookingElement.classList.add('booking-updated');
            setTimeout(() => {
                bookingElement.classList.remove('booking-updated');
            }, 5000);
        } else {
            // Booking not in DOM, we need to refresh the page
            // This happens when a new booking is created
            showNotification('New booking received. Refreshing page...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    });
}

/**
 * Update the UI for homeowner bookings
 * @param {Array} bookings - Array of updated bookings
 */
function updateHomeownerBookings(bookings) {
    bookings.forEach(booking => {
        // Find the booking element in the DOM
        const bookingElement = document.querySelector(`#booking-${booking.id}`);
        
        if (bookingElement) {
            // Update status badge
            const statusBadge = bookingElement.querySelector('.status-badge');
            if (statusBadge) {
                // Remove all status classes
                statusBadge.classList.remove('badge-warning', 'badge-success', 'badge-danger', 'badge-secondary');
                
                // Add appropriate class based on status
                let badgeClass = 'badge-secondary';
                switch (booking.status) {
                    case 'pending':
                        badgeClass = 'badge-warning';
                        break;
                    case 'approved':
                        badgeClass = 'badge-success';
                        break;
                    case 'declined':
                    case 'cancelled':
                        badgeClass = 'badge-danger';
                        break;
                }
                
                statusBadge.classList.add(badgeClass);
                statusBadge.textContent = booking.status.charAt(0).toUpperCase() + booking.status.slice(1);
            }
            
            // Update action buttons based on status
            const actionButtons = bookingElement.querySelector('.booking-actions');
            if (actionButtons) {
                if (booking.status === 'pending') {
                    actionButtons.innerHTML = `
                        <button class="btn btn-sm btn-success approve-booking" data-id="${booking.id}">
                            <i class="fas fa-check mr-1"></i>Approve
                        </button>
                        <button class="btn btn-sm btn-danger decline-booking" data-id="${booking.id}">
                            <i class="fas fa-times mr-1"></i>Decline
                        </button>
                    `;
                } else {
                    actionButtons.innerHTML = `
                        <span class="text-muted">No actions available</span>
                    `;
                }
            }
            
            // Highlight the updated booking
            bookingElement.classList.add('booking-updated');
            setTimeout(() => {
                bookingElement.classList.remove('booking-updated');
            }, 5000);
        } else {
            // Booking not in DOM, we need to refresh the page
            showNotification('New booking received. Refreshing page...', 'info');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        }
    });
}

/**
 * Update the UI for admin bookings
 * @param {Array} bookings - Array of updated bookings
 */
function updateAdminBookings(bookings) {
    // For admin, we'll just refresh the page if there are updates
    // as the admin view is more complex
    showNotification(`${bookings.length} booking update(s) received. Refreshing page...`, 'info');
    setTimeout(() => {
        window.location.reload();
    }, 2000);
}

/**
 * Set up event handlers for booking actions
 */
function setupBookingEventHandlers() {
    // Use event delegation for dynamically added elements
    document.addEventListener('click', function(event) {
        // Approve booking button
        if (event.target.classList.contains('approve-booking') || 
            event.target.closest('.approve-booking')) {
            const button = event.target.classList.contains('approve-booking') ? 
                event.target : event.target.closest('.approve-booking');
            const bookingId = button.getAttribute('data-id');
            updateBookingStatus(bookingId, 'approved');
        }
        
        // Decline booking button
        if (event.target.classList.contains('decline-booking') || 
            event.target.closest('.decline-booking')) {
            const button = event.target.classList.contains('decline-booking') ? 
                event.target : event.target.closest('.decline-booking');
            const bookingId = button.getAttribute('data-id');
            updateBookingStatus(bookingId, 'declined');
        }
        
        // Cancel booking button
        if (event.target.classList.contains('cancel-booking') || 
            event.target.closest('.cancel-booking')) {
            const button = event.target.classList.contains('cancel-booking') ? 
                event.target : event.target.closest('.cancel-booking');
            const bookingId = button.getAttribute('data-id');
            updateBookingStatus(bookingId, 'cancelled');
        }
    });
}

/**
 * Update booking status via AJAX
 * @param {number} bookingId - ID of the booking to update
 * @param {string} status - New status (approved, declined, cancelled)
 */
function updateBookingStatus(bookingId, status) {
    // Show loading indicator
    showNotification(`Updating booking status to ${status}...`, 'info');
    
    // Send AJAX request
    sendAjaxRequest({
        method: 'POST',
        url: 'api/update-booking-status.php',
        data: {
            booking_id: bookingId,
            status: status
        },
        success: function(response) {
            if (response.success) {
                // Show success notification with appropriate message based on status
                let message = '';
                let type = 'success';
                
                switch(status) {
                    case 'approved':
                        message = 'Booking has been approved successfully!';
                        break;
                    case 'declined':
                        message = 'Booking has been declined.';
                        type = 'warning';
                        break;
                    case 'cancelled':
                        message = 'Booking has been cancelled.';
                        type = 'info';
                        break;
                    default:
                        message = `Booking status updated to ${status} successfully.`;
                }
                
                showNotification(message, type);
                
                // Reset the timestamp to get all recent updates
                // This ensures we catch any changes that happened right before our update
                const resetTimestamp = Math.floor(Date.now() / 1000) - 30; // Get updates from the last 30 seconds
                
                // Force an immediate update
                sendAjaxRequest({
                    url: 'api/booking-status.php',
                    data: { last_update: resetTimestamp },
                    success: function(updateResponse) {
                        handleBookingUpdates(updateResponse);
                        
                        // Update the lastUpdateTimestamp to the current time
                        // to avoid getting duplicate updates in the next polling cycle
                        lastUpdateTimestamp = Math.floor(Date.now() / 1000);
                    }
                });
                
                // If we're on a page with a booking list, also update the UI directly
                const bookingElement = document.querySelector(`#booking-${bookingId}`);
                if (bookingElement) {
                    // Update the status badge immediately without waiting for the poll
                    const statusBadge = bookingElement.querySelector('.status-badge');
                    if (statusBadge) {
                        // Remove all status classes
                        statusBadge.classList.remove('badge-warning', 'badge-success', 'badge-danger', 'badge-secondary');
                        
                        // Add appropriate class based on status
                        let badgeClass = 'badge-secondary';
                        let badgeIcon = '';
                        let badgeText = status.charAt(0).toUpperCase() + status.slice(1);
                        
                        switch (status) {
                            case 'pending':
                                badgeClass = 'badge-warning';
                                badgeIcon = '<i class="fas fa-clock mr-1"></i>';
                                break;
                            case 'approved':
                                badgeClass = 'badge-success';
                                badgeIcon = '<i class="fas fa-check mr-1"></i>';
                                break;
                            case 'declined':
                                badgeClass = 'badge-danger';
                                badgeIcon = '<i class="fas fa-times mr-1"></i>';
                                break;
                            case 'cancelled':
                                badgeClass = 'badge-danger';
                                badgeIcon = '<i class="fas fa-ban mr-1"></i>';
                                break;
                        }
                        
                        statusBadge.classList.add(badgeClass);
                        statusBadge.innerHTML = badgeIcon + badgeText;
                        
                        // Highlight the updated booking
                        bookingElement.classList.add('highlight-update');
                        setTimeout(() => {
                            bookingElement.classList.remove('highlight-update');
                        }, 3000);
                    }
                }
            } else {
                showNotification(response.message || `Failed to update booking status`, 'error');
            }
        },
        error: function() {
            showNotification(`Error updating booking status. Please try again.`, 'error');
        }
    });
}

// Make functions available globally
window.initBookingUpdates = initBookingUpdates;
window.startBookingUpdates = startBookingUpdates;
window.updateBookingStatus = updateBookingStatus;
