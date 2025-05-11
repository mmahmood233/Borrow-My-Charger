/**
 * Booking page map initialization for Borrow My Charger
 */

// Initialize the booking map
function initBookingMap() {
    console.log('Booking map initialization started');
    
    // Get the map container
    var mapContainer = document.getElementById('booking-map');
    if (!mapContainer) {
        console.error('Booking map container not found');
        return;
    }
    
    // Get coordinates from data attributes
    var lat = parseFloat(mapContainer.getAttribute('data-lat'));
    var lng = parseFloat(mapContainer.getAttribute('data-lng'));
    
    if (isNaN(lat) || isNaN(lng)) {
        console.error('Invalid coordinates for booking map:', lat, lng);
        return;
    }
    
    console.log('Initializing booking map with coordinates:', lat, lng);
    
    try {
        // Create map centered on the charge point
        var chargePointLocation = { lat: lat, lng: lng };
        
        // Make sure the map container has a height
        if (mapContainer.offsetHeight < 10) {
            mapContainer.style.height = '300px';
        }
        
        // Wait for Google Maps to be fully loaded
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.error('Google Maps not loaded yet');
            mapContainer.innerHTML = '<div class="alert alert-warning">Map loading... Please wait.</div>';
            return;
        }
        
        var map = new google.maps.Map(mapContainer, {
            zoom: 15,
            center: chargePointLocation,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });
        
        // Add marker for the charge point
        var marker = new google.maps.Marker({
            position: chargePointLocation,
            map: map,
            title: "Charge Point Location",
            animation: google.maps.Animation.DROP
        });
        
        // Add click listener to open Google Maps directions
        marker.addListener('click', function() {
            window.open("https://www.google.com/maps/dir/?api=1&destination=" + lat + "," + lng, "_blank");
        });
        
        // Store map in window object for potential later use
        window.bookingMap = map;
        
        console.log('Booking map initialized successfully');
    } catch (error) {
        console.error('Error initializing booking map:', error);
        mapContainer.innerHTML = '<div class="alert alert-danger">Error loading map. Please refresh the page.</div>';
    }
}
