// Tell the server where to send the user after they login
const urlParams = new URLSearchParams(window.location.search);
const fromURI = urlParams.get('from');

const fromFormEl = document.getElementById('from');
fromFormEl.value = fromURI;

