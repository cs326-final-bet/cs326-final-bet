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
const newUsernameText = document.getElementById('update-username');
const cancelEditProfileButton = document.getElementById('info-cancel');
const panelEl = document.getElementById('info-panel');
const userNameHeader = document.getElementById('header');
const leaveCommentButtonEl = document.getElementById('shareComment');
const leaveCommentValueEl = document.getElementById('leaveAComment');
const commentBox = document.getElementById('userComments');

backToArea.onclick = async () => {
    window.location = './area.html'
};
saveChangesToProfileButton.onclick = async ()=>{
    if(newUsernameText.value === ''){
        alert("Username cannot be blank");
        return;
    } else {
        userNameHeader.innerHTML = newUsernameText.value + '`s Profile';
    }
    panelEl.classList.add('info-panel-hidden');
}
editProfileButton.onclick = async () =>{
    panelEl.classList.remove('info-panel-hidden');
}
cancelEditProfileButton.onclick = async ()=> {
    panelEl.classList.add('info-panel-hidden');
}

leaveCommentButtonEl.onclick = async () => {
    if (leaveCommentValueEl.value.length === 0) {
        alert('Cannot leave empty comment');
        return;
    }
    let userIDs = [0];
    await fetch(`/users/${userIDs[0]}/comments`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            comment: leaveCommentValueEl.value,
        }),
        
    });
    
    addComment({
        user: userNameHeader.innerHTML,
        value: leaveCommentValueEl.value,
    });

    leaveCommentValueEl.value = '';
}
function addComment(comment) {
    const container = document.createElement('div');
    
    const user = document.createElement('b');
    user.appendChild(document.createTextNode(comment.user + ': '));

    const value = document.createElement('span');
    value.appendChild(document.createTextNode(comment.value));

    container.appendChild(user);
    container.appendChild(value);

    commentBox.appendChild(container);
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
