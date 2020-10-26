import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import OSM from 'ol/source/OSM';
import { LonLat } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import {
    Pointer as PointerInteraction,
    defaults as defaultInteractions
} from 'ol/interaction';

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

// Setup the side panel to pop out when we click on the map
const panelEl = document.getElementById('info-panel');

// Setup map interaction
class DemoInteraction extends PointerInteraction {
    constructor() {
	   super();
    }

    handleDownEvent(e) {
	   
    }
}

// Show map
let map = new Map({
    interactions: defaultInteractions().extend([ new DemoInteraction() ]),
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
