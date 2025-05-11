/**
 * Booking functionality for Borrow My Charger
 */
$(document).ready(function() {
    // When date is selected, check availability
    $('#booking_date').on('change', function() {
        var selectedDate = $(this).val();
        if (selectedDate) {
            checkAvailability(selectedDate);
        } else {
            $('#availability-info').hide();
            // Disable and reset time dropdown
            $('#booking_time').prop('disabled', true).html('<option value="">Please select a date first</option>');
        }
    });
    
    // When dropdown selection changes, update the highlighted time slot
    $('#booking_time').on('change', function() {
        var selectedTime = $(this).val();
        // Remove highlight from all slots
        $('.time-slot-clickable').removeClass('selected-time-slot');
        // Add highlight to the matching slot
        $('.time-slot-clickable[data-time="' + selectedTime + '"]').addClass('selected-time-slot');
    });
    
    /**
     * Check availability for a specific date
     * @param {string} date - The date to check in YYYY-MM-DD format
     */
    function checkAvailability(date) {
        $.ajax({
            url: 'check-availability.php',
            type: 'GET',
            data: {
                charge_point_id: chargePointId,
                date: date
            },
            dataType: 'json',
            success: function(data) {
                if (data.error) {
                    console.error(data.error);
                    return;
                }
                
                // Show availability info
                $('#availability-info').show();
                
                // Clear previous slots
                $('#availability-slots').empty();
                
                // Create time slots from 6 AM to 10 PM
                var bookedTimes = {};
                
                // Mark booked and pending times
                if (data.bookings) {
                    data.bookings.forEach(function(booking) {
                        // Normalize time format to ensure consistent matching
                        var bookingTime = booking.booking_time;
                        console.log('Booking time from DB:', bookingTime, 'Status:', booking.status);
                        bookedTimes[bookingTime] = booking.status;
                    });
                }
                
                // Debug: log all booked times
                console.log('Booked times:', bookedTimes);
                
                // Reset time dropdown
                var timeSelect = $('#booking_time');
                timeSelect.html('<option value="">Select a time slot</option>');
                timeSelect.prop('disabled', false);
                
                // Generate time slots
                for (var hour = 6; hour <= 22; hour++) {
                    for (var minute of ['00', '30']) { // Add half-hour slots
                        // Format time string in the exact format used in the database (HH:MM)
                        var hourStr = hour < 10 ? '0' + hour : hour;
                        var timeStr = hourStr + ':' + minute;
                        var displayTime = formatDisplayTime(hour, minute);
                        
                        // Check if this time is booked
                        var status = 'available';
                        
                        // Check all possible time formats that might be in the database
                        if (bookedTimes[timeStr]) {
                            status = bookedTimes[timeStr];
                        } else if (bookedTimes[hour + ':' + minute]) {
                            status = bookedTimes[hour + ':' + minute];
                        }
                        
                        console.log('Checking time slot:', timeStr, 'Status:', status);
                        
                        var badgeClass = 'badge-success';
                        if (status === 'pending') {
                            badgeClass = 'badge-warning';
                        } else if (status === 'approved') {
                            badgeClass = 'badge-danger';
                        }
                        
                        // Add to visual display with click functionality for available slots
                        var slot = $('<div class="time-slot m-1">');
                        var badge = $('<span class="badge ' + badgeClass + ' p-2">').text(displayTime);
                        
                        // Make available slots clickable
                        if (status === 'available') {
                            badge.css('cursor', 'pointer');
                            badge.addClass('time-slot-clickable');
                            badge.attr('data-time', timeStr);
                            
                            // Add click handler
                            badge.on('click', function() {
                                var selectedTime = $(this).attr('data-time');
                                // Update dropdown
                                timeSelect.val(selectedTime);
                                
                                // Highlight the selected slot
                                $('.time-slot-clickable').removeClass('selected-time-slot');
                                $(this).addClass('selected-time-slot');
                            });
                        } else {
                            // Add tooltip for unavailable slots
                            badge.attr('title', 'This time slot is ' + status);
                        }
                        
                        slot.append(badge);
                        $('#availability-slots').append(slot);
                        
                        // Add to dropdown if available
                        if (status === 'available') {
                            timeSelect.append($('<option>', {
                                value: timeStr, // Always use the standardized format for the value
                                text: displayTime
                            }));
                        }
                    }
                }
                
                // If no available times
                if (timeSelect.find('option').length <= 1) {
                    timeSelect.append($('<option>', {
                        value: '',
                        text: 'No available time slots for this date',
                        disabled: true
                    }));
                }
            },
            error: function() {
                console.error('Error checking availability');
                $('#booking_time').prop('disabled', true).html('<option value="">Error loading time slots</option>');
            }
        });
    }
    
    /**
     * Format time for display
     * @param {number} hour - Hour in 24-hour format
     * @param {string} minute - Minute as string (e.g., '00', '30')
     * @return {string} Formatted time string (e.g., '2:30 PM')
     */
    function formatDisplayTime(hour, minute) {
        var period = hour >= 12 ? 'PM' : 'AM';
        var displayHour = hour > 12 ? hour - 12 : (hour === 0 ? 12 : hour);
        return displayHour + ':' + minute + ' ' + period;
    }
    
    // Initialize map centering on the charge point
    function initBookingMap() {
        if (typeof google === 'undefined' || !window.map) {
            console.log('Map not yet initialized or Google Maps not loaded');
            return;
        }
        
        const mapElement = document.getElementById('booking-map');
        if (!mapElement) {
            console.log('Map element not found');
            return;
        }
        
        const lat = parseFloat(mapElement.getAttribute('data-lat'));
        const lng = parseFloat(mapElement.getAttribute('data-lng'));
        
        if (isNaN(lat) || isNaN(lng)) {
            console.log('Invalid coordinates:', lat, lng);
            return;
        }
        
        const position = { lat: lat, lng: lng };
        console.log('Centering map at:', position);
        
        window.map.setCenter(position);
        window.map.setZoom(15);
        
        // Add a marker
        new google.maps.Marker({
            position: position,
            map: window.map,
            title: "Charge Point Location",
            animation: google.maps.Animation.DROP
        });
    }
    
    // Initialize map when Google Maps is loaded
    if (typeof google !== 'undefined' && google.maps) {
        initBookingMap();
    } else {
        // If Google Maps isn't loaded yet, wait for it
        window.initBookingMapCallback = initBookingMap;
    }
});
