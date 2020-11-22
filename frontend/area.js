import 'regenerator-runtime/runtime';

import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import {
    Pointer as PointerInteraction,
    defaults as defaultInteractions
} from 'ol/interaction';
import { Polygon, LineString, Point } from 'ol/geom';
import {Fill, Stroke, Style} from 'ol/style';

import { PROJ } from './mapping.js';

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

const leaveCommentValueEl = document.getElementById('leave-comment-value');
const leaveCommentButtonEl = document.getElementById('info-leave-comment');
const likeButtonEl = document.getElementById('info-like');

function addComment(comment) {
    const container = document.createElement('div');
    
    const user = document.createElement('b');
    user.appendChild(document.createTextNode(comment.user));

    const value = document.createElement('span');
    value.appendChild(document.createTextNode(comment.value));

    container.appendChild(user);
    container.appendChild(value);

    panelCommentsEl.appendChild(container);
}

function showAreaFeatureDetails(areaFeat) {
    // Basic top panel info
    panelUserEl.innerText = areaFeat.attributes.user;
    panelScoreEl.innerText = areaFeat.attributes.score;
    panelAreaEl.innerText = areaFeat.getGeometry().getArea().toFixed(5);

    // Show comments
    while (panelCommentsEl.firstChild !== null) {
        panelCommentsEl.removeChild(panelCommentsEl.firstChild);
    }

    areaFeat.attributes.comments.forEach(addComment);

    // Setup comments GUI
    leaveCommentButtonEl.onclick = async () => {
        if (leaveCommentValueEl.value.length === 0) {
            alert('Cannot leave empty comment');
            return;
        }
        
        await fetch(`/tracks/${areaFeat.attributes.trackIds[0]}/comments`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                comment: leaveCommentValueEl.value,
            }),
        });

        addComment({
            user: 'You!',
            value: leaveCommentValueEl.value,
        });

        leaveCommentValueEl.value = '';
    };

    likeButtonEl.onclick = async () => {
        await fetch(`/tracks/${areaFeat.attributes.trackIds[0]}/likes`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                liked: true,
            }),
        });

        alert('Like recorded');
    };

    // Show panel
    panelEl.classList.remove('info-panel-hidden');
}

// Setup map interaction
class DemoInteraction extends PointerInteraction {
    constructor(poly) {
        super();
        this.poly = poly;
    }

    handleDownEvent(e) {
        const features = [];
        
        this.getMap().forEachFeatureAtPixel(e.pixel, (feature) => {
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
const map = new Map({
    interactions: defaultInteractions().extend([ new DemoInteraction() ]),
    layers: [
        new TileLayer({
            source: new OSM()
        }),
    ],
    target: 'mapbox',
    view: new View({
        center: [-71.455554, 42.387689],
        projection: PROJ,
        zoom: 13,
    }),
});

// Retrieve areas from API
const areasVecSrc = new VectorSource({
    features: [],
});

const areasLay = new VectorLayer({
    source: areasVecSrc,
    style: new Style({
        fill: new Fill({
            color: 'rgba(175, 81, 245, 0.4)',
        }),
        stroke: new Stroke({
            color: 'rgba(175, 81, 245, 1)',
            width: 1,
        }),
    }),
});

map.addLayer(areasLay);

const tracksVecSrc = new VectorSource({
    features: [],
});

const tracksLay = new VectorLayer({
    source: tracksVecSrc,
    style: new Style({
        fill: new Fill({
            color: 'rgba(0, 0, 0, 0)',
        }),
        stroke: new Stroke({
            color: 'rgba(0, 255, 245, 1)',
            width: 1,
        }),
    }),
});

map.addLayer(tracksLay);


/**
 * Get areas from the API which are visible on the map and draw them.
 * @param map {Map} To draw areas.
 */
async function getAndDrawAreas(map) {
    const ext = map.getView().calculateExtent(map.getSize());
    
    const resp = await fetch(`/areas?extent=${ext.join(',')}`);
    const body = await resp.json();

    // Load areas onto map
    const areasFeats = body.areas.map(area => {
        const feat = new Feature({
            geometry: new Polygon([area.polygon]),
        });

        feat.attributes = {
            area_id: area.id,
            user: area.ownerId,
            score: area.score,
            trackIds: area.trackIds,
        };

        return feat;
    });

    areasVecSrc.clear();
    areasVecSrc.addFeatures(areasFeats);

    // Load tracks onto map
    const tracksFeats = body.tracks.map(track => {
        const points = track.points.map((point) => {
            return [point.longitude, point.latitude];
        });
        
        const feat = new Feature({
            geometry: new Polygon([ points ]),
        });

        return feat;
    });

    tracksVecSrc.clear();
    tracksVecSrc.addFeatures(tracksFeats);
}

map.on('moveend', () => {
    getAndDrawAreas(map);
});
