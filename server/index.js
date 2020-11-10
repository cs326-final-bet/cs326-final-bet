import express from 'express';
import bodyParser from 'body-parser';
import Joi from 'joi';

/**
 * From: https://stackoverflow.com/a/1527820
 * Returns a random integer between min (inclusive) and max (inclusive).
 * The value is no lower than min (or the next integer greater than min
 * if min isn't an integer) and no greater than max (or the next integer
 * lower than max if max isn't an integer).
 * Using Math.round() will give you a non-uniform distribution!
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomInts(numMax, min, max) {
    const items = [];
    const num = getRandomInt(1, numMax);
    
    for (let i = 0; i < num; i += 1) {
        const n = getRandomInt(min, max);

        if (items.indexOf(n) === -1) {
            items.push(n);
        }
    }

    return items;
}

/**
 * Break any area up into 0.01 mile square boxes.
 */
function polysForExt(extent) {
    const polys = [];

    function r(v) {
        return Math.round((v + Number.EPSILON) * 100) / 100;
    }
    
    const extBegin = [ extent[0], extent[1] ].map(r).map(v => v - 0.01);
    const extEnd = [ extent[2], extent[3] ].map(r).map(v => v + 0.01);

    for (let x = extBegin[0]; x < extEnd[0]; x += 0.01) {
        for (let y = extBegin[1]; y < extEnd[1]; y += 0.01) {
            polys.push([
                [x, y],
                [x, y + 0.01],
                [x + 0.01, y + 0.01],
                [x + 0.01, y],
			 [x, y],
            ]);
        }
    }

    return polys;
}

// API
const app = express();
const port = process.env.PORT || 8000;

app.use(bodyParser.json());
app.use(express.static('dist'));

/**
 * Returns a middleware function to validate that a request body matches a 
 * Joi schema.
 */
function validateBody(schema) {
    return (req, res, next) => {
        const result = schema.validate(req.body);

        if (result.error !== undefined) {
            return res.status(400).send({
                error: result.error,
            });
        }

        next();
    };
}

app.get('/', (req, res) => {
    res.redirect('/area.html');
});

app.get('/areas', (req, res) => {
    // Check extent parameter
    const extStr = req.query.extent;

    if (extStr === undefined) {
        return res
            .status(400)
            .send({
                error: '"extent" URL query parameter required'
            });
    }
    
    const extParts = extStr.split(',');
    let extBad = false;
    
    if (extParts.length !== 4) {
        extBad = true;
    }

    const extent = extParts.map(s => parseFloat(s));
    if (extent.filter(i => isNaN(i)).length > 0) {
        extBad = true;
    }

    if (extBad === true) {
        return res
            .status(400)
            .send({
                error: '"extent" URL query parameter must be in the format: <top left latitude>,<top left longitude>,<bottom right latitude>,<bottom right longitude>',
            });
    }

    // Generate fake extent
    const polys = polysForExt(extent);
    let areas = polys.map((poly) => {
        const trackIds = getRandomInts(10, 0, 1000);
        
        return {
		  id: getRandomInt(0, 1000),
		  score: getRandomInt(0, 1000),
            position: {
			 topLeft: {
				latitude: poly[0][0],
				longitude: poly[0][1],
			 },
			 bottomRight: {
				latitude: poly[2][0],
				longitude: poly[2][1],
			 },
		  },
		  polygon: poly,
            trackIds: trackIds,
            ownerId: getRandomInt(0, 1000),
        };
    });

    // Remove some areas so the entire screen isn't just full
    let maxRemoveNum = areas.length;
    if (maxRemoveNum > 5) {
	   maxRemoveNum -= 5;
    }
    
    const removeNum = getRandomInt(Math.round(areas.length / 2), maxRemoveNum);
    for (let i = 0; i < removeNum; i++) {
	   areas.splice(getRandomInt(0, areas.length-1), 1);
    }

    return res.send({
        areas: areas,
    });
});

app.post('/strava',
    validateBody(Joi.object({
        object_type: Joi.string()
            .required()
            .pattern(new RegExp('^activity$')),
        object_id: Joi.number().required(),
        aspect_type: Joi.string()
            .required()
            .pattern(new RegExp('^create$')),
        owner_id: Joi.number().required(),
        subscription_id: Joi.number().required(),
        event_time: Joi.number().required(),
    })),
    (req, res) => {
        res.send({});
    });

app.put('/tracks/:trackId([0-9]+)/likes',
    validateBody(Joi.object({
        liked: Joi.boolean().required(),
    })),
    (req, res) => {
        const likes = [];
        if (req.body.liked === true) {
            likes.push(getRandomInt(0, 1000));
        }
               
        res.send({
            track: {
                id: getRandomInt(0, 1000),
                longitude: getRandomInt(-80, 80),
                latitude: getRandomInt(-80, 80),
                comments: [],
                likes: likes,
            },
        });
    });

app.put('/tracks/:trackId([0-9]+)/comments',
    validateBody(Joi.object({
        comment: Joi.string().required(),
    })),
    (req, res) => {
        res.send({
            track: {
                id: getRandomInt(0, 1000),
                longitude: getRandomInt(-80, 80),
                latitude: getRandomInt(-80, 80),
                comments: [ {
                    userId: getRandomInt(0, 1000),
                    comment: req.body.comment,
                } ],
                likes: getRandomInts(10, 0, 1000),
            },
        });
    });


app.listen(port, () => {
    console.log(`\
Server listening on port ${port}. View in your web browser:

    http://127.0.0.1:${port} or http://localhost:${port}`);
});
