//get elements by id that you need 
const username = document.getElementById('username').value;
const password = document.getElementById('password').value;
const registerBtn = document.getElementById('register-button').value;


registerBtn.onclick = async () => {

    console.log('register Button Clicked');

    if(username === undefined || username.length === 0){
        alert('A valid username was not entered. Try Again');
        return;
    } else if (password === undefined || password.length === 0){
        alert('A valid password was not entered. Try Again');
        return;
    }

    await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username,
            password: password,
        })
    });
    alert('User: ' + username + ' created!');
    //window.location.href = 'area.html';
};
