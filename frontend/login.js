// Tell the server where to send the user after they login
const urlParams = new URLSearchParams(window.location.search);
const fromURI = urlParams.get('from');

const fromFormEl = document.getElementById('from');
const registerButtonEl = document.getElementById('register-button');

if (fromURI !== null)  {
    fromFormEl.value = fromURI;

    registerButtonEl.href = `register.html?from=${fromURI}`;
}
