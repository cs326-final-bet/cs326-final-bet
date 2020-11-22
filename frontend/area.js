import 'regenerator-runtime/runtime';

import { AreasMap } from './mapping.js';

const headerEl = document.getElementById('header');
const mapBoxEl = document.getElementById('mapbox');

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
