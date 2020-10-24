/**
 * Converts a typical latitude longitude pair to the coordinate projection
 * used by the Open Layers map.
 * @param lonLat {OpenLayers.LonLat} Coordinate pair to convert.
 * @returns {OpenLayers.LonLat} Transformed to map coordinate system.
 */
function toMapCoord(lonLat) {
    return lonLat.transform(new OpenLayers.Projection("EPSG:4326"),
					   new OpenLayers.Projection("EPSG:900913"));
}

// Set map to window's height b/c we must
document.getElementById('mapbox').style.height = `${window.innerHeight}px`;

// Show map
let map = new OpenLayers.Map('mapbox');
map.addLayers([ new OpenLayers.Layer.OSM() ]);
map.setCenter(toMapCoord(new OpenLayers.LonLat([-71, 42])), 13);
