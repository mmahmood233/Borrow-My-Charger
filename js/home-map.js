// Google Maps integration for Borrow My Charger homepage
let homeMap;

// Initialize map directly without relying on external scripts
function initializeHomeMap() {
    var mapElement = document.getElementById('home-map');
    var dataElement = document.getElementById('map-data');
    
    if (!mapElement || !dataElement) {
        console.error('Map or data element not found');
        return;
    }
    
    try {
        // Get charge points data
        var chargePointsData = JSON.parse(dataElement.getAttribute('data-charge-points'));
        
        if (!chargePointsData || chargePointsData.length === 0) {
            console.log('No charge points data available for home map');
            mapElement.innerHTML = '<div class="alert alert-info text-center p-5">No charge points available to display on map.</div>';
            return;
        }
        
        // Check if Google Maps is loaded
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            console.error('Google Maps not loaded yet for home map');
            mapElement.innerHTML = '<div class="alert alert-warning text-center p-5">Map loading... Please wait or refresh the page.</div>';
            return;
        }
        
        console.log('Creating home map with', chargePointsData.length, 'points');
        
        // Create map centered on the first charge point or default location
        var defaultCenter = {lat: 53.483710, lng: -2.270110}; // UK center
        var mapCenter = defaultCenter;
        
        if (chargePointsData.length > 0 && chargePointsData[0].latitude && chargePointsData[0].longitude) {
            mapCenter = {
                lat: parseFloat(chargePointsData[0].latitude),
                lng: parseFloat(chargePointsData[0].longitude)
            };
        }
        
        homeMap = new google.maps.Map(mapElement, {
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
                map: homeMap,
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
    } catch (error) {
        console.error('Error initializing home map:', error);
        mapElement.innerHTML = '<div class="alert alert-danger text-center p-5">Error loading map. Please refresh the page.</div>';
    }
}

// Try to initialize immediately if Google Maps is already loaded
if (typeof google !== 'undefined' && google.maps) {
    initializeHomeMap();
} else {
    // Otherwise set up a callback for when Google Maps loads
    window.homeMapCallback = initializeHomeMap;
    // And check periodically
    var checkInterval = setInterval(function() {
        if (typeof google !== 'undefined' && google.maps) {
            clearInterval(checkInterval);
            initializeHomeMap();
        }
    }, 500);
}
            {
                "featureType": "administrative",
                "elementType": "labels.text.fill",
                "stylers": [{"color": "#444444"}]
            },
            {
                "featureType": "landscape",
                "elementType": "all",
                "stylers": [{"color": "#f2f2f2"}]
            },
            {
                "featureType": "poi",
                "elementType": "all",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "road",
                "elementType": "all",
                "stylers": [{"saturation": "-100"}, {"lightness": "45"}]
            },
            {
                "featureType": "road.highway",
                "elementType": "all",
                "stylers": [{"visibility": "simplified"}]
            },
            {
                "featureType": "road.arterial",
                "elementType": "labels.icon",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "transit",
                "elementType": "all",
                "stylers": [{"visibility": "off"}]
            },
            {
                "featureType": "water",
                "elementType": "all",
                "stylers": [{"color": "#c4e5f9"}, {"visibility": "on"}]
            }
        ]
    });
    
    // Load charge points onto the map
    loadHomeChargePoints();
}

// Load charge points from the data container
function loadHomeChargePoints() {
    const dataContainer = document.getElementById('map-data');
    if (!dataContainer) {
        console.log('Map data container not found');
        return;
    }
    
    try {
        const chargePoints = JSON.parse(dataContainer.getAttribute('data-charge-points'));
        console.log('Charge points loaded:', chargePoints.length);
        
        if (chargePoints && chargePoints.length > 0) {
            chargePoints.forEach(point => {
                if (point.latitude && point.longitude) {
                    addChargePointMarker(point);
                }
            });
            
            // If we have at least one valid point, center the map on the first one
            if (chargePoints[0].latitude && chargePoints[0].longitude) {
                homeMap.setCenter({
                    lat: parseFloat(chargePoints[0].latitude),
                    lng: parseFloat(chargePoints[0].longitude)
                });
            }
        }
    } catch (e) {
        console.error('Error parsing charge point data:', e);
    }
}

// Add a marker for a charge point
function addChargePointMarker(chargePoint) {
    const position = {
        lat: parseFloat(chargePoint.latitude),
        lng: parseFloat(chargePoint.longitude)
    };
    
    // Create marker
    const marker = new google.maps.Marker({
        position: position,
        map: homeMap,
        title: chargePoint.address,
        animation: google.maps.Animation.DROP,
        icon: {
            url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
        }
    });
    
    // Create info window content
    const content = `
        <div style="width: 200px;">
            <h6 style="margin-bottom: 5px;">${chargePoint.address}</h6>
            <p style="margin-bottom: 5px;"><strong>Price:</strong> £${parseFloat(chargePoint.price).toFixed(2)} per kWh</p>
            <a href="chargepoint.php?id=${chargePoint.id}" class="btn btn-sm btn-primary">View Details</a>
        </div>
    `;
    
    // Create info window
    const infoWindow = new google.maps.InfoWindow({
        content: content
    });
    
    // Add click listener
    marker.addListener('click', function() {
        infoWindow.open(homeMap, marker);
    });
}

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Check if the map container exists on this page
    if (document.getElementById('home-map')) {
        console.log('Home map container found, waiting for Google Maps API');
        // Map will be initialized by the Google Maps API callback
    }
});
