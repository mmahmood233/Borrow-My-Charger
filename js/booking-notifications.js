/**
 * Real-time booking notifications for admins and homeowners
 * For Borrow My Charger application
 */

// Global variables
let lastCheckTime = 0;
let pollingInterval = 3000; // 3 seconds between checks for faster response
let pollingTimer = null;
let userRole = '';
let isDebugMode = true; // Enable debug logging

/**
 * Initialize booking notifications
 * @param {string} role - The user role (admin or homeowner)
 */
function initBookingNotifications(role) {
    // Store user role
    userRole = role;
    
    // Set initial check time - check for bookings in the last 5 minutes to ensure we catch recent ones
    lastCheckTime = Math.floor(Date.now() / 1000) - 300;
    
    if (isDebugMode) {
        console.log(`Booking notifications initialized for ${role}`);
        console.log(`Initial check time: ${new Date(lastCheckTime * 1000).toLocaleString()}`);
    }
    
    // Start polling
    startPolling();
}

/**
 * Start polling for new bookings
 */
function startPolling() {
    // Clear any existing timer
    if (pollingTimer) {
        clearInterval(pollingTimer);
    }
    
    // Check for new bookings immediately
    checkForNewBookings();
    
    // Set up interval for regular checks
    pollingTimer = setInterval(checkForNewBookings, pollingInterval);
    
    // Add event listener to pause polling when tab is not visible
    document.addEventListener('visibilitychange', function() {
        if (document.hidden) {
            // Pause polling when tab is not visible
            clearInterval(pollingTimer);
            pollingTimer = null;
        } else {
            // Resume polling when tab becomes visible again
            if (!pollingTimer) {
                checkForNewBookings();
                pollingTimer = setInterval(checkForNewBookings, pollingInterval);
            }
        }
    });
}

/**
 * Check for new bookings
 */
function checkForNewBookings() {
    // Add cache-busting parameter
    const timestamp = new Date().getTime();
    const url = `api/new-bookings.php?last_update=${lastCheckTime}&role=${userRole}&_=${timestamp}`;
    
    if (isDebugMode) {
        console.log(`Checking for new bookings since ${new Date(lastCheckTime * 1000).toLocaleString()}`);
        console.log(`Request URL: ${url}`);
    }
    
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (isDebugMode) {
                console.log('API response:', data);
            }
            
            if (data.error) {
                console.error('Error checking for new bookings:', data.error);
                return;
            }
            
            // Update last check time
            if (data.timestamp) {
                lastCheckTime = data.timestamp;
                if (isDebugMode) {
                    console.log(`Updated lastCheckTime to: ${new Date(lastCheckTime * 1000).toLocaleString()}`);
                }
            }
            
            // Process new bookings
            if (data.data && data.data.length > 0) {
                if (isDebugMode) {
                    console.log(`Found ${data.data.length} new bookings`);
                }
                handleNewBookings(data.data);
            } else if (isDebugMode) {
                console.log('No new bookings found');
            }
        })
        .catch(error => {
            console.error('Error fetching new bookings:', error);
        });
}

/**
 * Handle new bookings
 * @param {Array} bookings - Array of new bookings
 */
function handleNewBookings(bookings) {
    console.log('New bookings received:', bookings);
    
    // Show notification about new bookings
    if (bookings.length === 1) {
        showNotification(`A new booking has been received!`, 'info');
    } else {
        showNotification(`${bookings.length} new bookings have been received!`, 'info');
    }
    
    // Force page reload for now to ensure all data is properly displayed
    // This is the most reliable approach for this application
    setTimeout(() => {
        console.log('Reloading page to show new bookings');
        window.location.reload();
    }, 1500);
    
    // Add visual indicator that new bookings are being loaded
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'alert alert-info';
    loadingIndicator.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Loading new bookings...';
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.bottom = '20px';
    loadingIndicator.style.right = '20px';
    loadingIndicator.style.zIndex = '9999';
    document.body.appendChild(loadingIndicator);
}

/**
 * Create a booking row element
 * @param {Object} booking - Booking data
 * @returns {HTMLElement} - Table row element
 */
function createBookingRow(booking) {
    const row = document.createElement('tr');
    row.setAttribute('data-booking-id', booking.id);
    
    // Format date and time
    const bookingDate = new Date(booking.booking_date);
    const formattedDate = bookingDate.toLocaleDateString();
    
    // Get status class and text
    const statusClass = getStatusClass(booking.status);
    const statusText = getStatusText(booking.status);
    const statusIcon = getStatusIcon(booking.status);
    
    // Create row content based on user role
    if (userRole === 'homeowner') {
        row.innerHTML = `
            <td>${booking.user_name || 'Unknown'}</td>
            <td>${formattedDate}</td>
            <td>${booking.booking_time}</td>
            <td class="booking-status">
                <span class="badge ${statusClass}"><i class="fas ${statusIcon} mr-1"></i>${statusText}</span>
            </td>
            <td class="booking-actions">
                ${booking.status === 'pending' ? `
                    <button class="btn btn-sm btn-success approve-booking" data-id="${booking.id}">Approve</button>
                    <button class="btn btn-sm btn-danger decline-booking" data-id="${booking.id}">Decline</button>
                ` : `<span class="text-muted">No actions available</span>`}
            </td>
        `;
    } else { // admin
        row.innerHTML = `
            <td>${booking.user_name || 'Unknown'}</td>
            <td>${booking.address || 'Unknown location'}</td>
            <td>${formattedDate}</td>
            <td>${booking.booking_time}</td>
            <td class="booking-status">
                <span class="badge ${statusClass}"><i class="fas ${statusIcon} mr-1"></i>${statusText}</span>
            </td>
            <td class="booking-actions">
                <a href="admin-booking-action.php?id=${booking.id}" class="btn btn-sm btn-primary">Manage</a>
            </td>
        `;
    }
    
    return row;
}

/**
 * Get status class for badge
 * @param {string} status - Booking status
 * @returns {string} - CSS class
 */
function getStatusClass(status) {
    switch (status) {
        case 'pending':
            return 'badge-warning';
        case 'approved':
            return 'badge-success';
        case 'declined':
            return 'badge-danger';
        default:
            return 'badge-secondary';
    }
}

/**
 * Get status text
 * @param {string} status - Booking status
 * @returns {string} - Human-readable status
 */
function getStatusText(status) {
    switch (status) {
        case 'pending':
            return 'Pending';
        case 'approved':
            return 'Approved';
        case 'declined':
            return 'Declined';
        default:
            return 'Unknown';
    }
}

/**
 * Get icon for status
 * @param {string} status - Booking status
 * @returns {string} - Font Awesome icon class
 */
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

/**
 * Show notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, info, warning, danger)
 */
function showNotification(message, type = 'info') {
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
document.addEventListener('DOMContentLoaded', function() {
    console.log('Checking for dashboard type...');
    
    // Check if we're on an admin or homeowner dashboard
    if (document.querySelector('.admin-dashboard')) {
        console.log('Admin dashboard detected');
        initBookingNotifications('admin');
    } else if (document.querySelector('.homeowner-dashboard')) {
        console.log('Homeowner dashboard detected');
        initBookingNotifications('homeowner');
    } else {
        // Fallback detection based on content
        const pageTitle = document.querySelector('h1')?.textContent || '';
        const cardHeaders = Array.from(document.querySelectorAll('.card-header h5')).map(el => el.textContent);
        
        if (pageTitle.includes('Admin Dashboard')) {
            console.log('Admin dashboard detected by title');
            initBookingNotifications('admin');
        } else if (pageTitle.includes('Welcome') && cardHeaders.some(header => header.includes('Booking Requests'))) {
            console.log('Homeowner dashboard detected by content');
            initBookingNotifications('homeowner');
        }
    }
});
