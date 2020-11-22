//get elements by id that you need 

const username = document.getElementById('username');
const password = document.getElementById('password');
const loginBtn = document.getElementById('login-button').value;


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
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: username.value,
            password: password.value,
        })
    });

    //window.location.href = 'area.html';
};
