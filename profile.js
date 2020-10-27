import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { OSM } from 'ol/source';

import { PROJ } from './mapping.js';

// Show map
new Map({
    layers: [
        new TileLayer({
            source: new OSM()
        }),
    ],
    target: 'userMap',
    view: new View({
        center: [-71, 42],
        projection: PROJ,
        zoom: 13,
    }),
});
