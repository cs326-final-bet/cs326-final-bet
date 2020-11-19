import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { OSM } from 'ol/source';
import 'regenerator-runtime/runtime';
import { PROJ } from './mapping.js';

'use strict';


// const MongoClient = require('mongodb').MongoClient,
//       // hardcode local connection; should set programmatically
//       url = 'mongodb://localhost:27017';

// MongoClient.connect(url, { useUnifiedTopology: true }, (err, db) => {
//   if (err) { throw err; }
//   console.log("We're in!");
//   db.close();
// });

// db.post()

const backToArea = document.getElementById('homeButton');
const editProfileButton = document.getElementById('editProfile');
const saveChangesToProfileButton = document.getElementById('info-save-changes');
const cancelEditProfileButton = document.getElementById('info-cancel');
const panelEl = document.getElementById('info-panel');

backToArea.onclick = async () => {
    window.location = './area.html'
};
saveChangesToProfileButton.onclick = async ()=>{
    panelEl.classList.add('info-panel-hidden');
}
editProfileButton.onclick = async () =>{
    panelEl.classList.remove('info-panel-hidden');
}
cancelEditProfileButton.onclick = async ()=> {
    panelEl.classList.add('info-panel-hidden');
}





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
