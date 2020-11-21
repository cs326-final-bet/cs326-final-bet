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

// Load user info
/**
 * Removes all children from a DOM element.
 * @param e {DOM Element} To remove children from within.
 */
function removeChildren(el) {
    while (el.firstChild !== null) {
        el.removeChild(el.firstChild);
    }
}

const commentsEl = document.getElementById('userComments');

async function loadUserDetails(userId) {
    const resp = await fetch(`/user?userId=${userId}`);
    const body = await resp.json();

    removeChildren(commentsEl);

    body.userInfo.comments.forEach((comment) => {
        const el = document.createElement('div');
        const txt = document.createTextNode(comment.comment);
        el.appendChild(txt);
        commentsEl.appendChild(el);
    });
}

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
if (userId === null) {
    alert('You must provide a userId query parameter');
} else {
    loadUserDetails(userId);
}
