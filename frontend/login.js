//get elements by id that you need 

const username = document.getElementById("username").value;
const password = document.getElementById("password").value;
const loginBtn = document.getElementById("login-button").value;

function login(){
    loginBtn.onclick = async () => {
        if(username === undefined || username.length === 0){
            alert('A valid username was not entered. Try Again');
            return;
        }

        if(password === undefined || password.length === 0){
            alert('A valid password was not entered. Try Again');
            return;
        }

        await fetch(`/login`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: username,
                password: password
            })
        });

        window.location.href = 'area.html';
    }
}