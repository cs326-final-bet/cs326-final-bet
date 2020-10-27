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

/**
 * Break any area up into 0.01 mile square boxes.
 */
function polysForExt(extent) {
    const polys = [];

    function r(v) {
        return Math.round((v + Number.EPSILON) * 100) / 100;
    }
    
    const extBegin = [ extent[0], extent[1] ].map(r).map(v => v - 0.01);
    const extEnd = [ extent[2], extent[3] ].map(r).map(v => v + 0.01);

    for (let x = extBegin[0]; x < extEnd[0]; x += 0.01) {
        for (let y = extBegin[1]; y < extEnd[1]; y += 0.01) {
            const p = new Polygon([
                // First "ring" defines border
                [
                    [x, y],
                    [x, y + 0.01],
                    [x + 0.01, y + 0.01],
                    [x + 0.01, y],
                    [x, y],
                ]
            ]);
            
            polys.push(p);
        }
    }

    return polys;
}

/**
 * Returns the center of any box.
 */
function extCenter(ext) {
    return [
        ext[0] + ((ext[2] - ext[0]) / 2),
        ext[1] + ((ext[3] - ext[1]) /2 )
    ];
}

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
        center: [-71, 42],
        projection: PROJ,
        zoom: 13,
    }),
});

// Draw sample area
const poly1 = new Polygon([
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

const feat1 = new Feature({
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

const vecSrc = new VectorSource({
    features: [
        feat1
    ],
});
const vecLay = new VectorLayer({
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

// Draw extent of demo area above
const demoAreaExt = poly1.getExtent();

const demoAreaExtSrc = new VectorSource({
    features: [ new Feature({
        geometry: new Polygon([
            [
                [ demoAreaExt[0], demoAreaExt[1] ],
                [ demoAreaExt[0], demoAreaExt[3] ],
                [ demoAreaExt[2], demoAreaExt[3] ],
                [ demoAreaExt[2], demoAreaExt[1] ],
                [ demoAreaExt[0], demoAreaExt[1] ],
            ],
        ]),
    }) ],
});
const demoAreaExtLay = new VectorLayer({
    source: demoAreaExtSrc,
});

let shownAreaExtBox = false;

const showAreaExtEl = document.getElementById('show-area-extent');
showAreaExtEl.onclick = () => {
    if (shownAreaExtBox === true) {
        map.removeLayer(demoAreaExtLay);
        shownAreaExtBox = false;
        showAreaExtEl.innerText = 'Show Area Extent';
    } else {
        map.addLayer(demoAreaExtLay);
        shownAreaExtBox = true;
        showAreaExtEl.innerText = 'Hide Area Extent';
    }
};

// Draw area tiles in area extent
const demoAreaExtTilesFeats = polysForExt(demoAreaExt).map(poly => {
    return new Feature({
        geometry: poly,
    });
});

const demoAreaExtTilesSrc = new VectorSource({
    features: demoAreaExtTilesFeats,
});
const demoAreaExtTilesLay = new VectorLayer({
    source: demoAreaExtTilesSrc,
});


let shownAreaExtTilesBoxes = false;

const showAreaExtTilesBoxesEl = document.getElementById('show-area-extent-boxes');
showAreaExtTilesBoxesEl.onclick = () => {
    if (shownAreaExtTilesBoxes === true) {
        map.removeLayer(demoAreaExtTilesLay);
        shownAreaExtTilesBoxes = false;
        showAreaExtTilesBoxesEl.innerText = 'Show Boxes in Area Extent';
    } else {
        map.addLayer(demoAreaExtTilesLay);
        shownAreaExtTilesBoxes = true;
        showAreaExtTilesBoxesEl.innerText = 'Hide Boxes in Area ExtTilesent';
    }
};

// Draw intersecting area tiles for demo
const demoAreaInterFeats = polysForExt(demoAreaExt).map(poly => {
    // Test if area box is in excercise track
    const polyCenter = extCenter(poly.getExtent());
    
    if (poly1.intersectsCoordinate(polyCenter) === true) {
        return new Feature({
            geometry: poly,
        });
    }
    
    return undefined;
}).filter(v => v !== undefined);

const demoAreaInterSrc = new VectorSource({
    features: demoAreaInterFeats,
});
const demoAreaInterLay = new VectorLayer({
    source: demoAreaInterSrc,
});


let shownInterAreaBoxes = false;

const showInterAreaBoxesEl = document.getElementById('show-intersecting-area-boxes');
showInterAreaBoxesEl.onclick = () => {
    if (shownInterAreaBoxes === true) {
        map.removeLayer(demoAreaInterLay);
        shownInterAreaBoxes = false;
        showInterAreaBoxesEl.innerText = 'Show Intersecting Area Boxes';
    } else {
        map.addLayer(demoAreaInterLay);
        shownInterAreaBoxes = true;
        showInterAreaBoxesEl.innerText = 'Hide Intersecting Area Boxes';
    }
};

// Demonstrate how area boxes work
const mapExtent = map.getView().calculateExtent(map.getSize());

const areaFeats = polysForExt(mapExtent).map(poly => {
    return new Feature({
        geometry: poly,
    });
});

const areaVecSrc = new VectorSource({
    features: areaFeats,
});
const areaLay = new VectorLayer({
    source: areaVecSrc,
    style: new Style({
        fill: new Fill({
            color: 'rgba(0, 255, 0, 0.0)',
        }),
        stroke: new Stroke({
            color: 'rgba(0, 255, 0, 1)',
            width: 1,
        }),
    }),
});


let shownGlobalAreaBoxes = false;

const showGlobalAreaBoxesEl = document.getElementById('show-global-area-boxes');
showGlobalAreaBoxesEl.onclick = () => {
    if (shownGlobalAreaBoxes === true) {
        map.removeLayer(areaLay);
        shownGlobalAreaBoxes = false;
        showGlobalAreaBoxesEl.innerText = 'Show Global Area Boxes';
    } else {
        map.addLayer(areaLay);
        shownGlobalAreaBoxes = true;
        showGlobalAreaBoxesEl.innerText = 'Hide Global Area Boxes';
    }
};
