// Google Maps integration for Borrow My Charger homepage
let homeMap;

// Initialize map when Google Maps API is loaded
function initializeHomeMap() {
    console.log('Home map initialization started');
    var mapElement = document.getElementById('home-map');
    
    // Check if map element exists
    if (!mapElement) {
        console.error('Map element not found');
        return;
    }
    
    // Get charge points data
    var dataElement = document.getElementById('map-data');
    var chargePointsData = [];
    
    if (dataElement) {
        try {
            chargePointsData = JSON.parse(dataElement.getAttribute('data-charge-points') || '[]');
            console.log('Loaded', chargePointsData.length, 'charge points');
        } catch (e) {
            console.error('Error parsing charge point data:', e);
        }
    }
    
    // Default center (UK)
    var mapCenter = {lat: 53.483710, lng: -2.270110};
    
    // If we have charge points, center on the first one
    if (chargePointsData.length > 0 && chargePointsData[0].latitude && chargePointsData[0].longitude) {
        mapCenter = {
            lat: parseFloat(chargePointsData[0].latitude),
            lng: parseFloat(chargePointsData[0].longitude)
        };
    }
    
    // Create the map
    homeMap = new google.maps.Map(mapElement, {
        zoom: 10,
        center: mapCenter,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        styles: [
            {
                "featureType": "water",
                "elementType": "all",
                "stylers": [{"color": "#c4e5f9"}, {"visibility": "on"}]
            }
        ]
    });
    
    // Add markers for charge points
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
            map: homeMap,
            title: point.address,
            animation: google.maps.Animation.DROP
        });
        
        // Create info window content
        var content = '<div class="info-window">' +
            '<h5>' + (point.address || 'Charge Point') + '</h5>' +
            '<p><strong>Price:</strong> £' + (point.price || '0.00') + ' per hour</p>' +
            '<p><a href="chargepoint.php?id=' + point.id + '" class="btn btn-sm btn-primary">View Details</a></p>' +
            '</div>';
        
        // Add click listener
        marker.addListener('click', function() {
            infoWindow.setContent(content);
            infoWindow.open(homeMap, marker);
        });
        
        // Extend bounds
        bounds.extend(position);
    });
    
    // Fit map to bounds if we have multiple points
    if (chargePointsData.length > 1) {
        homeMap.fitBounds(bounds);
    }
    
    console.log('Home map initialized successfully');
}

// When the document is ready, check if we need to initialize the map
document.addEventListener('DOMContentLoaded', function() {
    // The map will be initialized by the googleMapsCallback function in the footer
    console.log('Home map script loaded, waiting for Google Maps API');
});
