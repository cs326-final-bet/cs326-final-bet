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
const addUser = document.getElementById('followUser');
const getUserStats = document.getElementById('compareProfile');

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

async function loadUserDetails(userId) {
    const resp = await fetch(`/user?userId=${userId}`);
    const body = await resp.json();

    removeChildren(commentBox);

    body.userInfo.comments.forEach((comment) => {
        const el = document.createElement('div');
        const txt = document.createTextNode(comment.userId + ': ' + comment.comment);
        el.appendChild(txt);
        commentBox.appendChild(el);
    });

    userNameHeader.innerHTML = 'User ' + body.userInfo.id + 's Profile';

    const currentDistance = body.userInfo.userStats.currentDistance;
    document.getElementById('currentDist').innerText = 'Current Distance:' + currentDistance;
    const currentArea = body.userInfo.userStats.currentTime;
    document.getElementById('currentArea').innerText = 'Current Area:' + currentArea;
    const totalDistance = body.userInfo.userStats.totalDistance;
    document.getElementById('totalDist').innerText = 'Total Distance:' + totalDistance;
    const totalArea = body.userInfo.userStats.totalTime;
    document.getElementById('totalArea').innerText = 'Total Area:' + totalArea; 

}

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
if (userId === null) {
    alert('You must provide a userId query parameter');
} else {
    loadUserDetails(userId);
}


backToArea.onclick = async () => {
    window.location = './area.html';
};

saveChangesToProfileButton.onclick = async ()=>{
    if(newUsernameText.value === ''){
        alert('Username cannot be blank');
        return;
    } else {
        userNameHeader.innerHTML = newUsernameText.value + '`s Profile';
    }
    panelEl.classList.add('info-panel-hidden');
};
editProfileButton.onclick = async () =>{
    panelEl.classList.remove('info-panel-hidden');
};
cancelEditProfileButton.onclick = async ()=> {
    panelEl.classList.add('info-panel-hidden');
};
addUser.onclick = async () => {
    const resp = await fetch('user/:userId([0-9]+)/addFriend', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            friendsList: friendsList,
        })
    });

    const body = await resp.json();
    const friendsList = body.friendsList;
    const userId = body._id;

    if(friendsList.includes(userId)){
        friendsList.pop(userId);
    } else {
        friendsList.push(userId);
    }


};
getUserStats.onclick = async () => {
    const userIDs = [0];
    await fetch(`/user/${userIDs[0]}/userStats`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            //userStats: userInfo.userStats,
        }),
    });
    getUserStats({
        //user: userInfo.id,;
        //stats: userInfo.userStats,;
    });
};

leaveCommentButtonEl.onclick = async () => {
    if (leaveCommentValueEl.value.length === 0) {
        alert('Cannot leave empty comment');
        return;
    }
    const userIDs = [0];
    await fetch(`/users/${userIDs[0]}/comments`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user: userNameHeader.value,
            comment: leaveCommentValueEl.value,
        }),
        
    });
    
    addComment({
        user: userNameHeader.innerHTML,
        value: leaveCommentValueEl.value,
    });
    

    leaveCommentValueEl.value = '';
};
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

// // Load user info
// /**
//  * Removes all children from a DOM element.
//  * @param e {DOM Element} To remove children from within.
//  */
// function removeChildren(el) {
//     while (el.firstChild !== null) {
//         el.removeChild(el.firstChild);
//     }
// }

// const commentsEl = document.getElementById('userComments');

// async function loadUserDetails(userId) {
//     const resp = await fetch(`/user?userId=${userId}`);
//     const body = await resp.json();

//     removeChildren(commentsEl);

//     body.userInfo.comments.forEach((comment) => {
//         const el = document.createElement('div');
//         const txt = document.createTextNode(comment.comment);
//         el.appendChild(txt);
//         commentsEl.appendChild(el);
//     });
// }

// const urlParams = new URLSearchParams(window.location.search);
// const userId = urlParams.get('userId');
// if (userId === null) {
//     alert('You must provide a userId query parameter');
// } else {
//     loadUserDetails(userId);
// }
