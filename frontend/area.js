import 'regenerator-runtime/runtime';

import { AreasMap } from './mapping.js';

const headerEl = document.getElementById('header');
const mapBoxEl = document.getElementById('mapbox');
const logoutButtonEl = document.getElementById('logout');

const map = new AreasMap(mapBoxEl);

const resizeMap = () => {
    mapBoxEl.style.height = `${window.innerHeight - headerEl.offsetHeight}px`;
};
//resizeMap();
window.onresize = resizeMap;

/*

(async function() {
    const resp = await fetch('/any_user_area');
    const body = await resp.json();

    if (body.area !== null) {
        map.map.getView().setCenter([
            body.area.beginPosition.latitude,
            body.area.beginPosition.longitude,
        ]);
        await map.fetchAndDraw();
    }
})();
*/

// From: https://stackoverflow.com/a/30387077
function removeCookie(sKey, sPath, sDomain) {
    document.cookie = encodeURIComponent(sKey) + 
                  '=; expires=Thu, 01 Jan 1970 00:00:00 GMT' + 
                  (sDomain ? '; domain=' + sDomain : '') + 
                  (sPath ? '; path=' + sPath : '');
}

logoutButtonEl.onclick = () => {
    removeCookie('connect.sid');
    window.location.href = '/';
};
