//get elements by id that you need 
'use strict';

import 'regenerator-runtime/runtime';

const username = document.getElementById('username');
const password = document.getElementById('password');
const loginBtn = document.getElementById('login-button');


loginBtn.onclick = async () => {
    if(username.value === undefined || username.value.length === 0){
        alert('A valid username was not entered. Try Again');
        return;
    }

    if(password.value === undefined || password.value.length === 0){
        alert('A valid password was not entered. Try Again');
        return;
    }

    await fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username.value,
            password: password.value
        })
    });

    //window.location.href = 'area.html';
};
