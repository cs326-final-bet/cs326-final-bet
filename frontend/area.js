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
import { Polygon } from 'ol/geom';
import {Fill, Stroke, Style} from 'ol/style';

import { PROJ } from './mapping.js';

// Set map to window's height b/c we must
const headerEl = document.getElementById('header');
const mapEl = document.getElementById('mapbox');

const resizeMap = () => {
    mapEl.style.height = `${window.innerHeight - headerEl.offsetHeight}px`;
};
//resizeMap();
window.onresize = resizeMap;

/*
(async function() {
    const resp = await fetch('/any_user_area');
    const body = await resp.json();

    if (body.area !== null) {
        map.map.getView().setCenter([
            body.area.beginPosition.latitude,
            body.area.beginPosition.longitude,
        ]);
        await map.fetchAndDraw();
    }
})();
*/

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
