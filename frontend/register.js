//get elements by id that you need 
const username = document.getElementById('username');
const password = document.getElementById('password');
const registerBtn = document.getElementById('register-button');


registerBtn.onclick = async () => {

    console.log('register Button Clicked');

    if(username.value === undefined || username.value.length === 0){
        alert('A valid username was not entered. Try Again');
        return;
    } else if (password.value === undefined || password.value.length === 0){
        alert('A valid password was not entered. Try Again');
        return;
    }

    await fetch('/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username: username.value,
            password: password.value,
        })
    });
    alert('User: ' + username.value + ' created!');
    //window.location.href = 'area.html';
};
