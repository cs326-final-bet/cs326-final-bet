
const map = new OpenLayers.Map('userMap');
map.addLayers([ new OpenLayers.Layer.OSM() ]);
map.setCenter(new OpenLayers.LonLat([-71, 42], 13));