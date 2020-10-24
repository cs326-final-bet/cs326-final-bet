import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import { LonLat } from 'ol/proj';
import Projection from 'ol/proj/Projection';

/**
 * The geographical projection used in this project. What us laymen usually
 * refer to as "normal" or latitude longitude.
 */
const PROJ = 'EPSG:4326';

// Set map to window's height b/c we must
const headerEl = document.getElementById('header');
const mapEl = document.getElementById('mapbox');

const resizeMap = () => {
    mapEl.style.height = `${window.innerHeight - headerEl.offsetHeight}px`;
};
resizeMap();
window.onresize = resizeMap;

// Show map
let map = new Map({
    layers: [
	   new TileLayer({
		  source: new OSM()
	   }),
    ],
    target: 'mapbox',
    view: new View({
	   center: [-71, 42],
	   projection: PROJ,
	   zoom: 13,
    }),
});
