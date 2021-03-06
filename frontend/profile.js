'use strict';

import 'regenerator-runtime/runtime';

import { AreasMap } from './mapping.js';

const backToArea = document.getElementById('homeButton');
const compareProfileButton = document.getElementById('compareProfile');
const closeCompareProfileButton = document.getElementById('info-close');
const panelEl = document.getElementById('info-panel');
const userNameHeader = document.getElementById('header');
const leaveCommentButtonEl = document.getElementById('shareComment');
const leaveCommentValueEl = document.getElementById('leaveAComment');
const commentBox = document.getElementById('userComments');
const addUser = document.getElementById('followUser');

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

const userNames = {};

async function loadUserDetails(userId) {
    const resp = await fetch(`/user?userId=${userId}`);
    const body = await resp.json();

    removeChildren(commentBox);

    await Promise.all(body.userInfo.comments.map(async (comment) => {
        if (Object.keys(userNames).indexOf(comment.userId) === -1) {
            const cmtUsrResp = await fetch(`/user?userId=${comment.userId}`);
            const cmtUsrBody = await cmtUsrResp.json();

            userNames[comment.userId] = cmtUsrBody.userInfo.userName;
        }
        
        const el = document.createElement('div');
        const txt = document.createTextNode(userNames[comment.userId] + ': ' + comment.comment);
        el.appendChild(txt);
        commentBox.appendChild(el);
    }));

    userNameHeader.innerText = body.userInfo.userName;

    const totalDistance = body.userInfo.userStats.totalDistance;
    document.getElementById('totalDist').innerText = 'Total Distance:' + totalDistance;
    const totalArea = body.userInfo.userStats.totalTime;
    document.getElementById('totalTime').innerText = 'Total Time:' + totalArea; 

}

const urlParams = new URLSearchParams(window.location.search);
const userId = urlParams.get('userId');
if (userId === null) {
    window.location.href = '/my_profile';
} else {
    loadUserDetails(userId);
}


backToArea.onclick = async () => {
    window.location = './area.html';
};

compareProfileButton.onclick = async () =>{
    panelEl.classList.remove('info-panel-hidden');

    const result = await fetch(`/user/${userId}/userStats`, {
        method: 'GET',
    });

    const body = await result.json();
    console.log(body);
    document.getElementById('distDifference').innerText = body.distDiff;
    document.getElementById('timeDifference').innerText = body.timeDiff;
};

closeCompareProfileButton.onclick = async ()=> {
    panelEl.classList.add('info-panel-hidden');
};

addUser.onclick = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    await fetch(`/user/${userId}/addFriend`, {
        method: 'PUT',
    });
};

leaveCommentButtonEl.onclick = async () => {
    if (leaveCommentValueEl.value.length === 0) {
        alert('Cannot leave empty comment');
        return;
    }
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get('userId');
    
    await fetch(`/users/${userId}/comments`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            comment: leaveCommentValueEl.value,
        }),
        
    });
    
    addComment({
        user: userNameHeader.innerText,
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
const mapBoxEl = document.getElementById('userMap');
new AreasMap(mapBoxEl, { userId: userId });


