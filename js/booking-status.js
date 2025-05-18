/**
 * Real-time booking status updates using AJAX polling
 * For Borrow My Charger application
 */

// Store bookings that we're monitoring
let monitoredBookings = [];
let pollingInterval = 5000; // 5 seconds between checks (reduced for better responsiveness)
let pollingTimer = null;
let lastPollTime = 0;

// Initialize booking status monitoring
function initBookingStatusMonitor() {
    // Find all booking status elements with data-booking-id attribute
    const bookingElements = document.querySelectorAll('[data-booking-id]');
    
    if (bookingElements.length === 0) {
        return; // No bookings to monitor
    }
    
    // Add each booking to the monitored list
    bookingElements.forEach(element => {
        const bookingId = element.getAttribute('data-booking-id');
        const statusElement = element.querySelector('.booking-status');
        const actionsElement = element.querySelector('.booking-actions');
        
        if (bookingId && statusElement) {
            monitoredBookings.push({
                id: bookingId,
                statusElement: statusElement,
                actionsElement: actionsElement,
                lastStatus: statusElement.textContent.trim()
            });
        }
    });
    
    // Start polling if we have bookings to monitor
    if (monitoredBookings.length > 0) {
        startPolling();
        
        // Add visual indicator that real-time updates are active
        const dashboardHeader = document.querySelector('.card-header h5');
        if (dashboardHeader && dashboardHeader.textContent.includes('Booking')) {
            const indicator = document.createElement('span');
            indicator.className = 'badge badge-info ml-2';
            indicator.textContent = 'Real-time updates active';
            dashboardHeader.appendChild(indicator);
        }
    }
}

// Start the polling process
function startPolling() {
    // Clear any existing timer
    if (pollingTimer) {
        clearInterval(pollingTimer);
    }
    
    // Check status immediately
    checkAllBookingStatuses();
    
    // Set up interval for regular checks
    pollingTimer = setInterval(checkAllBookingStatuses, pollingInterval);
    
    // Add event listener to pause polling when tab is not visible
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Pause polling when tab is not visible
            clearInterval(pollingTimer);
            pollingTimer = null;
        } else {
            // Resume polling when tab becomes visible again
            if (!pollingTimer) {
                checkAllBookingStatuses();
                pollingTimer = setInterval(checkAllBookingStatuses, pollingInterval);
            }
        }
    });
}

// Check status for all monitored bookings
function checkAllBookingStatuses() {
    monitoredBookings.forEach(booking => {
        checkBookingStatus(booking);
    });
}

// Check status for a single booking
function checkBookingStatus(booking) {
    // Add a cache-busting parameter to avoid caching issues
    const timestamp = new Date().getTime();
    fetch(`api/check-booking-status.php?id=${booking.id}&_=${timestamp}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('Error checking booking status:', data.error);
                return;
            }
            
            // Always update the UI if the status doesn't match exactly what we have
            // This ensures we catch all changes even if the text appears the same
            if (booking.lastStatus !== data.statusText || booking.lastStatusClass !== data.statusClass) {
                updateBookingStatus(booking, data);
                
                // If status changed to 'approved', show a notification
                if (data.status === 'approved' && booking.lastStatus !== 'Approved') {
                    showStatusNotification('Your booking has been approved!', 'success');
                } else if (data.status === 'declined' && booking.lastStatus !== 'Declined') {
                    showStatusNotification('Your booking has been declined.', 'warning');
                }
            }
            
            // Update last poll time
            lastPollTime = Date.now();
        })
        .catch(error => {
            console.error('Error fetching booking status:', error);
        });
}

// Update the UI with new booking status
function updateBookingStatus(booking, data) {
    // Update status text and class
    booking.statusElement.innerHTML = `<span class="badge ${data.statusClass}"><i class="fas ${getStatusIcon(data.status)} mr-1"></i>${data.statusText}</span>`;
    booking.lastStatus = data.statusText;
    booking.lastStatusClass = data.statusClass;
    
    // Update actions if available
    if (booking.actionsElement) {
        if (data.status === 'pending') {
            // Keep actions for pending bookings
            // Make sure we're not showing 'No actions available' if there should be actions
            if (booking.actionsElement.querySelector('.text-muted')) {
                // Refresh the page to get the proper action buttons
                window.location.reload();
            }
        } else {
            // Remove actions for non-pending bookings
            booking.actionsElement.innerHTML = '<span class="text-muted">No actions available</span>';
        }
    }
    
    // Add animation to highlight the change
    const row = booking.statusElement.closest('tr');
    if (data.status === 'approved') {
        row.classList.add('booking-updated');
    } else {
        row.classList.add('highlight-update');
    }
    
    // Remove highlight after animation completes
    setTimeout(() => {
        row.classList.remove('highlight-update');
        row.classList.remove('booking-updated');
    }, 3000);
}

// Get icon for status
function getStatusIcon(status) {
    switch (status) {
        case 'pending':
            return 'fa-clock';
        case 'approved':
            return 'fa-check';
        case 'declined':
            return 'fa-times';
        default:
            return 'fa-info-circle';
    }
}

// Show notification for status changes
function showStatusNotification(message, type = 'info') {
    // Check if we have a notification container
    let container = document.getElementById('notification-container');
    if (!container) {
        // Create container if it doesn't exist
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
        <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'} mr-2"></i>${message}
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initBookingStatusMonitor);
