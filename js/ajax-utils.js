/**
 * AJAX Utility Functions for Borrow My Charger
 */

// Global settings for all AJAX requests
const ajaxSettings = {
    // Default error handler
    handleError: function(xhr, status, error) {
        console.error('AJAX Error:', status, error);
        // Display user-friendly error message
        showNotification('An error occurred. Please try again.', 'error');
    },
    
    // Default success handler
    handleSuccess: function(response) {
        if (response.success) {
            showNotification(response.message || 'Operation successful!', 'success');
        } else {
            showNotification(response.message || 'Operation failed.', 'error');
        }
    }
};

/**
 * Show notification to user
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Check if notification container exists, if not create it
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
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `alert alert-${type === 'error' ? 'danger' : type}`;
    notification.style.minWidth = '250px';
    notification.style.marginBottom = '10px';
    notification.innerHTML = `
        <button type="button" class="close" data-dismiss="alert">&times;</button>
        ${message}
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
 * Send AJAX request
 * @param {Object} options - Configuration options
 */
function sendAjaxRequest(options) {
    const defaults = {
        method: 'GET',
        url: '',
        data: null,
        contentType: 'application/x-www-form-urlencoded',
        dataType: 'json',
        async: true,
        success: ajaxSettings.handleSuccess,
        error: ajaxSettings.handleError
    };
    
    // Merge options with defaults
    const settings = Object.assign({}, defaults, options);
    
    // Create XHR object
    const xhr = new XMLHttpRequest();
    
    // Setup request
    xhr.open(settings.method, settings.url, settings.async);
    
    // Set headers
    xhr.setRequestHeader('Content-Type', settings.contentType);
    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    
    // Setup callbacks
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            let response;
            try {
                response = settings.dataType === 'json' ? JSON.parse(xhr.responseText) : xhr.responseText;
            } catch (e) {
                response = xhr.responseText;
            }
            settings.success(response, xhr.status, xhr);
        } else {
            settings.error(xhr, xhr.status, xhr.statusText);
        }
    };
    
    xhr.onerror = function() {
        settings.error(xhr, xhr.status, xhr.statusText);
    };
    
    // Send request
    if (settings.method === 'POST' && typeof settings.data === 'object' && !(settings.data instanceof FormData)) {
        // Convert object to URL encoded string
        const params = new URLSearchParams();
        for (const key in settings.data) {
            params.append(key, settings.data[key]);
        }
        xhr.send(params);
    } else {
        xhr.send(settings.data);
    }
    
    return xhr;
}

/**
 * Poll for updates at regular intervals
 * @param {string} url - URL to poll
 * @param {function} callback - Function to call with response
 * @param {number} interval - Polling interval in milliseconds
 * @param {Object} data - Data to send with request
 * @returns {Object} - Controller to stop polling
 */
function pollForUpdates(url, callback, interval = 5000, data = {}) {
    let active = true;
    let timeoutId = null;
    
    function poll() {
        if (!active) return;
        
        sendAjaxRequest({
            url: url,
            data: data,
            success: function(response) {
                if (active) {
                    callback(response);
                    timeoutId = setTimeout(poll, interval);
                }
            },
            error: function() {
                if (active) {
                    timeoutId = setTimeout(poll, interval * 2); // Back off on error
                }
            }
        });
    }
    
    // Start polling
    poll();
    
    // Return controller
    return {
        stop: function() {
            active = false;
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
        },
        isActive: function() {
            return active;
        }
    };
}

/**
 * Live search implementation
 * @param {string} inputSelector - Selector for search input
 * @param {string} url - URL to send search query
 * @param {function} renderResults - Function to render results
 * @param {number} debounceTime - Debounce time in milliseconds
 */
function setupLiveSearch(inputSelector, url, renderResults, debounceTime = 300) {
    const searchInput = document.querySelector(inputSelector);
    if (!searchInput) return;
    
    let debounceTimer;
    let lastQuery = '';
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Don't search if query is the same or too short
        if (query === lastQuery || query.length < 2) return;
        lastQuery = query;
        
        // Clear previous timer
        clearTimeout(debounceTimer);
        
        // Set new timer
        debounceTimer = setTimeout(function() {
            sendAjaxRequest({
                url: url,
                data: { query: query },
                success: function(response) {
                    renderResults(response);
                }
            });
        }, debounceTime);
    });
}
