import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import { LonLat } from 'ol/proj';
import Projection from 'ol/proj/Projection';
import {
    Pointer as PointerInteraction,
    defaults as defaultInteractions
} from 'ol/interaction';
import { Polygon } from 'ol/geom';

import MultiPoint from 'ol/geom/MultiPoint';
import {Fill, Stroke, Style} from 'ol/style';


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

// Draw sample area
let vecSrc = new VectorSource({
    features: [
	   new Feature({
		  geometry: new Polygon([
			 // First "ring" defines border
			 [
				[-70.995, 42.005],
				[-71, 42.013],
				[-71.007, 42.018],
				[-71.014, 42.018],
				[-71.021, 42.016],
				[-71.023, 42.009],
				[-71.034, 42.005],
				[-71.029, 41.995],
				[-71.023, 41.99],
				[-70.997, 42.001],
				[-70.995, 42.005],
			 ]
		  ]),
	   }),
    ],
});
let vecLay = new VectorLayer({
    source: vecSrc,
    style: new Style({
	   fill: new Fill({
		  color: 'rgba(175, 81, 245, 0.5)',
	   }),
	   stroke: new Stroke({
		  color: '#777777',
		  width: 1,
	   }),
    }),
});
map.addLayer(vecLay);

/*
let source = new VectorSource({
    features: [
	   new Feature({
		  geometry: new Polygon([
			 [
				[-5e6, 6e6],
				[-5e6, 8e6],
				[-3e6, 8e6],
				[-3e6, 6e6],
				[-5e6, 6e6]
			 ]
		  ]),
	   }),
    ],
});

var layer = new VectorLayer({
  source: source,
});

let map = new Map({
  layers: [layer],
  target: 'mapbox',
  view: new View({
    center: [0, 3000000],
    zoom: 2,
  }),
});
*/
