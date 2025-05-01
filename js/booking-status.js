/**
 * Real-time booking status updates using AJAX polling
 * For Borrow My Charger application
 */

// Store bookings that we're monitoring
let monitoredBookings = [];
let pollingInterval = 10000; // 10 seconds between checks
let pollingTimer = null;

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
    fetch(`api/check-booking-status.php?id=${booking.id}`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                console.error('Error checking booking status:', data.error);
                return;
            }
            
            // If status has changed, update the UI
            if (booking.lastStatus !== data.statusText) {
                updateBookingStatus(booking, data);
            }
        })
        .catch(error => {
            console.error('Error fetching booking status:', error);
        });
}

// Update the UI with new booking status
function updateBookingStatus(booking, data) {
    // Update status text and class
    booking.statusElement.innerHTML = `<span class="badge ${data.statusClass}">${data.statusText}</span>`;
    booking.lastStatus = data.statusText;
    
    // Update actions if available
    if (booking.actionsElement) {
        if (data.status === 'pending') {
            // Keep actions for pending bookings
        } else {
            // Remove actions for non-pending bookings
            booking.actionsElement.innerHTML = '<span class="text-muted">No actions available</span>';
        }
    }
    
    // Add animation to highlight the change
    booking.statusElement.closest('tr').classList.add('highlight-update');
    
    // Remove highlight after animation completes
    setTimeout(() => {
        booking.statusElement.closest('tr').classList.remove('highlight-update');
    }, 2000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initBookingStatusMonitor);
