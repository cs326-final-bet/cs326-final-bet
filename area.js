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
const panelUserEl = document.getElementById('info-user');
const panelScoreEl = document.getElementById('info-score');
const panelAreaEl = document.getElementById('info-area');
const panelCommentsEl = document.getElementById('info-existing-comments');

function showAreaFeatureDetails(areaFeat) {
    panelUserEl.innerText = areaFeat.attributes.user;
    panelScoreEl.innerText = areaFeat.attributes.score;
    panelAreaEl.innerText = areaFeat.getGeometry().getArea().toFixed(5);

    while (panelCommentsEl.firstChild !== null) {
        panelCommentsEl.removeChild(panelCommentsEl.firstChild);
    }

    areaFeat.attributes.comments.forEach(comment => {
	   const container = document.createElement('div');
	   
	   const user = document.createElement('b');
	   user.appendChild(document.createTextNode(comment.user));

	   const value = document.createElement('span');
	   value.appendChild(document.createTextNode(comment.value));

	   container.appendChild(user);
	   container.appendChild(value);

	   panelCommentsEl.appendChild(container);
    });

    panelEl.classList.remove('info-panel-hidden');
}

// Setup map interaction
class DemoInteraction extends PointerInteraction {
    constructor(poly) {
	   super();
	   this.poly = poly;
    }

    handleDownEvent(e) {
	   let features = [];
	   
	   this.getMap().forEachFeatureAtPixel(e.pixel, (feature, layer) => {
		  // Check it is a feature we defined
		  if (feature.attributes !== undefined
			 && feature.attributes.area_id !== undefined) {
			 features.push(feature);
		  }
	   });

	   if (features.length > 1) {
		  // The UI can only show 1 area's details at a time right now
		  alert('Please only click on 1 area');
	   }

	   if (features.length === 0) {
		  // If clicked away from an area hide its details
		  panelEl.classList.add('info-panel-hidden');
	   } else {
		  // If clicked on an area show its details
		  showAreaFeatureDetails(features[0]);
	   }
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
let poly1 = new Polygon([
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
]);

let feat1 = new Feature({
    geometry: poly1,
});
feat1.attributes = {
    area_id: 546,
    user: 'noah',
    score: 5678,
    comments: [
	   { user: 'james', value: 'Aw man! You took over my spot!' },
	   { user: 'noah', value: 'Not for long buddy :)' },
	   { user: 'james', value: 'I am the king of Hockomock swamp!' },
    ],
};

let vecSrc = new VectorSource({
    features: [
	   feat1
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
