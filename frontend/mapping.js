import 'regenerator-runtime/runtime';

import 'ol/ol.css';
import Map from 'ol/Map';
import TileLayer from 'ol/layer/Tile';
import View from 'ol/View';
import { OSM, Vector as VectorSource } from 'ol/source';
import { Vector as VectorLayer } from 'ol/layer';
import Feature from 'ol/Feature';
import { Polygon } from 'ol/geom';
import {Fill, Stroke, Style} from 'ol/style';

/**
 * The geographical projection used in this project. What us laymen usually
 * refer to as "normal" or latitude longitude.
 */
export const PROJ = 'EPSG:4326';

export class AreasMap {
    /**
     * @param mapEl {DOM Element} To place map. Must have an id.
     * @param dataFilter {Object} Defines broad limits on what type of data the map
     *     will show. Allowed keys 'userId' (Will only display areas for user).
     * @throws {string} If mapEl is not valid.
     */
    constructor(mapEl, dataFilter) {
        if (mapEl.id === null || mapEl.id === undefined) {
            throw 'mapEl requires an id, has none';
        }
        this.mapEl = mapEl;
        
        this.dataFilter = dataFilter;
        
        // Show map
        this.map = new Map({
            layers: [
                new TileLayer({
                    source: new OSM()
                }),
            ],
            target: this.mapEl.id,
            view: new View({
                projection: PROJ,
                zoom: 13,
                center: [-71.455554, 42.387689],
            }),
        });

        // Map layer for area squares
        this.areasVecSrc = new VectorSource({
            features: [],
        });

        this.areasLay = new VectorLayer({
            source: this.areasVecSrc,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(175, 81, 245, 0.4)',
                }),
                stroke: new Stroke({
                    color: 'rgba(175, 81, 245, 1)',
                    width: 1,
                }),
            }),
        });

        this.map.addLayer(this.areasLay);

        // Map layer for exercise tracks
        this.tracksVecSrc = new VectorSource({
            features: [],
        });

        this.tracksLay = new VectorLayer({
            source: this.tracksVecSrc,
            style: new Style({
                fill: new Fill({
                    color: 'rgba(0, 0, 0, 0)',
                }),
                stroke: new Stroke({
                    color: 'rgba(0, 255, 245, 1)',
                    width: 1,
                }),
            }),
        });

        this.map.addLayer(this.tracksLay);

        // Redraw everything on the map when it moves
        this.map.on('moveend', () => {
            this.fetchAndDraw();
        });

        // Make big
        const headerEl = document.getElementById('header');
        this.mapEl.style.height = `${window.innerHeight - headerEl.offsetHeight}px`;

        this.fetchAndDraw();
    }

    /**
     * Get areas from the API which are visible on the map and draw them.
     * @param map {Map} To draw areas.
     */
    async fetchAndDraw() {
        const ext = this.map.getView().calculateExtent(this.map.getSize());

        let dataFilterURLQueries = '';
        if (this.dataFilter !== undefined) {
            if (this.dataFilter.userId !== undefined) {
                dataFilterURLQueries += `&userId=${this.dataFilter.userId}`;
            }
        }
        
        const resp = await fetch(`/areas?extent=${ext.join(',')}${dataFilterURLQueries}`);
        const body = await resp.json();

        // Load areas onto map
        const areasFeats = body.areas.map(area => {
            const feat = new Feature({
                geometry: new Polygon([area.polygon]),
            });

            feat.attributes = {
                area_id: area.id,
                user: area.ownerId,
                score: area.score,
                trackIds: area.trackIds,
            };

            return feat;
        });

        this.areasVecSrc.clear();
        this.areasVecSrc.addFeatures(areasFeats);

        // Load tracks onto map
        const tracksFeats = body.tracks.map(track => {
            const points = track.points.map((point) => {
                return [point.longitude, point.latitude];
            });
            
            const feat = new Feature({
                geometry: new Polygon([ points ]),
            });

            return feat;
        });

        this.tracksVecSrc.clear();
        this.tracksVecSrc.addFeatures(tracksFeats);

        console.log("Updated map");

    }
}
