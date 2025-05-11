// Google Maps integration for Borrow My Charger - Chargepoints List Page
let chargepointsMap;

// Initialize map directly without relying on external scripts
function initializeChargepointsMap() {
    var mapElement = document.getElementById('map');
    var dataElement = document.getElementById('map-data');
    
    if (!mapElement || !dataElement) {
        console.error('Map or data element not found');
        return;
    }
    
    try {
        // Get charge points data
        var chargePointsData = JSON.parse(dataElement.getAttribute('data-charge-points'));
        
        if (!chargePointsData || chargePointsData.length === 0) {
            console.log('No charge points data available');
            mapElement.innerHTML = '<div class="alert alert-info text-center p-5">No charge points found in this area. Try a different search.</div>';
            return;
        }
        
        // Check if Google Maps is loaded
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.error('Google Maps not loaded yet');
            mapElement.innerHTML = '<div class="alert alert-warning text-center p-5">Map loading... Please wait.</div>';
            return;
        }
        
        console.log('Creating chargepoints map with', chargePointsData.length, 'points');
        
        // Create map centered on the first charge point or default location
        var defaultCenter = {lat: 53.483710, lng: -2.270110}; // UK center
        var mapCenter = defaultCenter;
        
        if (chargePointsData.length > 0 && chargePointsData[0].latitude && chargePointsData[0].longitude) {
            mapCenter = {
                lat: parseFloat(chargePointsData[0].latitude),
                lng: parseFloat(chargePointsData[0].longitude)
            };
        }
        
        chargepointsMap = new google.maps.Map(mapElement, {
            zoom: 10,
            center: mapCenter,
            mapTypeControl: true,
            streetViewControl: true,
            fullscreenControl: true
        });
        
        // Add markers for all charge points
        var bounds = new google.maps.LatLngBounds();
        var infoWindow = new google.maps.InfoWindow();
        
        chargePointsData.forEach(function(point) {
            if (!point.latitude || !point.longitude) return;
            
            var position = {
                lat: parseFloat(point.latitude),
                lng: parseFloat(point.longitude)
            };
            
            // Add marker
            var marker = new google.maps.Marker({
                position: position,
                map: chargepointsMap,
                title: point.address,
                animation: google.maps.Animation.DROP
            });
            
            // Create info window content
            var content = '<div class="info-window">' +
                '<h5>' + point.address + '</h5>' +
                '<p><strong>Price:</strong> £' + point.price + ' per kWh</p>' +
                '<p><a href="chargepoint.php?id=' + point.id + '" class="btn btn-sm btn-primary">View Details</a></p>' +
                '</div>';
            
            // Add click listener
            marker.addListener('click', function() {
                infoWindow.setContent(content);
                infoWindow.open(chargepointsMap, marker);
            });
            
            // Extend bounds
            bounds.extend(position);
        });
        
        // Fit map to bounds if we have multiple points
        if (chargePointsData.length > 1) {
            chargepointsMap.fitBounds(bounds);
        }
        
        console.log('Chargepoints map initialized successfully');
    } catch (error) {
        console.error('Error initializing chargepoints map:', error);
        mapElement.innerHTML = '<div class="alert alert-danger text-center p-5">Error loading map. Please refresh the page.</div>';
    }
}

// Try to initialize immediately if Google Maps is already loaded
if (typeof google !== 'undefined' && google.maps) {
    initializeChargepointsMap();
} else {
    // Otherwise set up a callback for when Google Maps loads
    window.chargepointsMapCallback = initializeChargepointsMap;
    // And check periodically
    var checkInterval = setInterval(function() {
        if (typeof google !== 'undefined' && google.maps) {
            clearInterval(checkInterval);
            initializeChargepointsMap();
        }
    }, 500);
}
