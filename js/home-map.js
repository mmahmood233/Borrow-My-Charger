// Google Maps integration for Borrow My Charger homepage
let homeMap;

// Initialize the map for the homepage
function initHomeMap() {
    console.log('Initializing home page map');
    
    // Default map center (Bahrain)
    const defaultCenter = { lat: 26.0667, lng: 50.5577 };
    
    // Create the map with custom styling
    homeMap = new google.maps.Map(document.getElementById("home-map"), {
        zoom: 11,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
        styles: [
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
