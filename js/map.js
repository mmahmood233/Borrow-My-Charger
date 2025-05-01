// Google Maps integration for Borrow My Charger
let map;
let markers = [];
let userMarker;
let infoWindow;

// Initialize the map
function initMap() {
    // Default center (UK)
    const defaultCenter = { lat: 53.483710, lng: -2.270110 };
    
    // Create the map
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 12,
        center: defaultCenter,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: true,
    });
    
    // Create info window for markers
    infoWindow = new google.maps.InfoWindow();
    
    // Try to get user's current location
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };
                
                // Center map on user's location
                map.setCenter(userLocation);
                
                // Add marker for user's location
                userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: "Your Location",
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#4285F4",
                        fillOpacity: 1,
                        strokeColor: "#FFFFFF",
                        strokeWeight: 2,
                    },
                });
                
                // Load charge points after getting user location
                loadChargePointsOnMap();
            },
            () => {
                // Handle location error - still load charge points
                loadChargePointsOnMap();
            }
        );
    } else {
        // Browser doesn't support geolocation - still load charge points
        loadChargePointsOnMap();
    }
    
    // Add event listener for search form
    document.getElementById('searchForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateMapMarkers();
    });
    
    // Add event listeners for live search
    document.getElementById('keyword').addEventListener('input', debounce(updateMapMarkers, 500));
    document.getElementById('min_price').addEventListener('input', debounce(updateMapMarkers, 500));
    document.getElementById('max_price').addEventListener('input', debounce(updateMapMarkers, 500));
    
    // Add event listener for reset button
    document.getElementById('resetSearch').addEventListener('click', function() {
        document.getElementById('keyword').value = '';
        document.getElementById('min_price').value = '';
        document.getElementById('max_price').value = '';
        updateMapMarkers();
    });
}

// Load charge points on the map from the hidden data container
function loadChargePointsOnMap() {
    const dataContainer = document.getElementById('map-data');
    if (!dataContainer) return;
    
    try {
        const chargePoints = JSON.parse(dataContainer.getAttribute('data-charge-points'));
        addMarkersToMap(chargePoints);
    } catch (e) {
        console.error('Error parsing charge point data:', e);
    }
}

// Update map markers based on search results
function updateMapMarkers() {
    // Clear existing markers
    clearMarkers();
    
    // Get search parameters
    const keyword = document.getElementById('keyword').value;
    const minPrice = document.getElementById('min_price').value;
    const maxPrice = document.getElementById('max_price').value;
    
    // Fetch updated charge points
    fetch(`search.php?keyword=${encodeURIComponent(keyword)}&min_price=${minPrice}&max_price=${maxPrice}`)
        .then(response => response.json())
        .then(data => {
            addMarkersToMap(data);
        })
        .catch(error => {
            console.error('Error fetching charge points:', error);
        });
}

// Add markers to the map
function addMarkersToMap(chargePoints) {
    if (!chargePoints || chargePoints.length === 0) return;
    
    // Clear existing markers
    clearMarkers();
    
    // Add new markers
    chargePoints.forEach(point => {
        if (point.latitude && point.longitude) {
            const position = {
                lat: parseFloat(point.latitude),
                lng: parseFloat(point.longitude)
            };
            
            const marker = new google.maps.Marker({
                position: position,
                map: map,
                title: point.address,
                animation: google.maps.Animation.DROP,
                icon: {
                    url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png'
                }
            });
            
            // Create info window content
            const content = `
                <div class="info-window">
                    <h5>${point.address}</h5>
                    <p><strong>Owner:</strong> ${point.owner_name}</p>
                    <p><strong>Price:</strong> £${point.price} per kWh</p>
                    <a href="book-chargepoint.php?id=${point.id}" class="btn btn-sm btn-primary">Book Now</a>
                </div>
            `;
            
            // Add click listener to open info window
            marker.addListener('click', () => {
                infoWindow.setContent(content);
                infoWindow.open(map, marker);
            });
            
            // Store marker for later reference
            markers.push(marker);
        }
    });
    
    // Fit map to markers if there are any
    if (markers.length > 0) {
        const bounds = new google.maps.LatLngBounds();
        markers.forEach(marker => bounds.extend(marker.getPosition()));
        map.fitBounds(bounds);
        
        // Don't zoom in too far
        const listener = google.maps.event.addListener(map, 'idle', function() {
            if (map.getZoom() > 16) map.setZoom(16);
            google.maps.event.removeListener(listener);
        });
    }
}

// Clear all markers from the map
function clearMarkers() {
    markers.forEach(marker => marker.setMap(null));
    markers = [];
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
    let timeout;
    return function() {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}