// Google Maps integration for Borrow My Charger - Chargepoint Details Page
let detailMap;

// Initialize map directly without relying on external scripts
function initializeDetailMap() {
    var mapElement = document.getElementById('map');
    
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }
    
    try {
        // Get coordinates from data attributes
        var lat = parseFloat(mapElement.getAttribute('data-lat'));
        var lng = parseFloat(mapElement.getAttribute('data-lng'));
        
        if (isNaN(lat) || isNaN(lng)) {
            console.error('Invalid coordinates:', lat, lng);
            mapElement.innerHTML = '<div class="alert alert-warning text-center p-5">Invalid location coordinates</div>';
            return;
        }
        
        // Check if Google Maps is loaded
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.error('Google Maps not loaded yet');
            mapElement.innerHTML = '<div class="alert alert-warning text-center p-5">Map loading... Please wait or refresh the page.</div>';
            return;
        }
        
        console.log('Creating detail map with coordinates:', lat, lng);
        
        // Create map centered on the charge point
        var location = {lat: lat, lng: lng};
        detailMap = new google.maps.Map(mapElement, {
            zoom: 15,
            center: location,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });
        
        // Add marker for the charge point
        var marker = new google.maps.Marker({
            position: location,
            map: detailMap,
            title: 'Charge Point Location',
            animation: google.maps.Animation.DROP
        });
        
        console.log('Detail map initialized successfully');
    } catch (error) {
        console.error('Error initializing detail map:', error);
        mapElement.innerHTML = '<div class="alert alert-danger text-center p-5">Error loading map. Please refresh the page.</div>';
    }
}

// Try to initialize immediately if Google Maps is already loaded
if (typeof google !== 'undefined' && google.maps) {
    initializeDetailMap();
} else {
    // Otherwise set up a callback for when Google Maps loads
    window.detailMapCallback = initializeDetailMap;
    // And check periodically
    var checkInterval = setInterval(function() {
        if (typeof google !== 'undefined' && google.maps) {
            clearInterval(checkInterval);
            initializeDetailMap();
        }
    }, 500);
}
