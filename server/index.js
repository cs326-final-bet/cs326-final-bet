'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import Joi from 'joi';

/*
import passport from  'passport';
import LocalStrategy from 'passport-local';
//require('dotenv').config();
//const passport = require('passport');               // handles authentication
//const LocalStrategy = require('passport-local').Strategy; // username/password strategy
//const minicrypt = require('./miniCrypt');
//const mc = new minicrypt();

const strategy = new LocalStrategy(
    // async (username, password, done) => {
    //     if (!findUser(username)) {
    //         return done(null, false, { 'message' : 'Wrong username' });
    //     }
    //     if (!validatePassword(username, password)) {
    //     // invalid password
    //     // should disable logins after N messages
    //     // delay return to rate-limit brute-force attacks
    //         await new Promise((r) => setTimeout(r, 2000)); // two second delay
    //         return done(null, false, { 'message' : 'Wrong password' });
    //     }
    //     // success!
    //     // should create a user object here, associated with a unique identifier
    //     return done(null, username);
    // }
);


passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());
*/


/**
 * Generates random number.
 * From: https://stackoverflow.com/a/1527820
 * @param min {number} Minimum inclusive.
 * @param max {number} Maximum inclusive.
 * @returns {number} Random number in range [min, max].
 */
function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Get a random number of random numbers. At least one.
 * @param numMax {number} Maximum number of random numbers, inclusive.
 * @param min {number} Minimum random number inclusive.
 * @param max {number} Maximum random number inclusive.
 * @returns {number[]} Random amount of numbers (amount in range [1, numMax]).
 *     Each number in the range [min, max].
 */
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
 * @params extent {number[4]} Map extent, latitude and longitude pairs in the format
 *     [upper left lat, upper left long, bottom right lat, bottom right long].
 * @returns {number[][][]} All 0.01 mile square boxes which cover the provided extent.
 *     Each box is provided as a line string, which is an array of lat long pair arrays.
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
export const app = express();

app.use(bodyParser.json()); // Parse HTTP body as JSON
app.use(express.static('dist')); // Serve dist/ directory

/**
 * Returns a middleware function to validate that a request body matches a 
 * Joi schema.
 * @param schema {Joi Schema} Schema to ensure the request body meets.
 * @returns {function(req, res, next)} An Express middleware function which ensures that
 *     request body meets the requirements set by the schema. If the body does not 
 *     fullfill the requirements an HTTP 400 response with an "error" key will be 
 *     returned which holds the error object returned by Joi.
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
    res.redirect('/login.html');
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
    const areas = polys.map((poly) => {
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
    const tracks = polys.map((poly) => {
        return {
            trackId: getRandomInt(0, 1000),
            longitude: poly[0][0][0],
            latitude: poly[0][0][1],
            likes: getRandomInts(10, 0, 1000),
        };
    });

    // Remove some areas so the entire screen isn't just full
    let maxRemoveNum = areas.length;
    if (maxRemoveNum > 5) {
        maxRemoveNum -= 5;
    }
    
    const removeNum = getRandomInt(Math.round(areas.length / 2), maxRemoveNum);
    for (let i = 0; i < removeNum; i++) {
        const removeIndex = getRandomInt(0, areas.length-1);
        areas.splice(removeIndex, 1);
        tracks.splice(removeIndex, 1);
    }

    return res.send({
        areas: areas,
        tracks: tracks,
    });
});

// Like area
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
            trackId: getRandomInt(0, 1000),
            longitude: getRandomInt(-80, 80),
            latitude: getRandomInt(-80, 80),
            likes: likes,
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

// Comment on user
app.put('/users/:userId([0-9]+)/comments',
    validateBody(Joi.object({
        comment: Joi.string().required(),
    })),
    (req, res) => {
        res.send({
            user:  {
                id: req.userId,
                userName: 'user name',
                userPassword: 'user password',
                userStats: {
                    currentDistance: getRandomInt(0, 1000),
                    currentTime: getRandomInt(0, 1000),
                    totalDistance: getRandomInt(0 ,1000),
                    totalTime: getRandomInt(0, 1000)
                },
                email: 'user email',
                friendsList: [getRandomInts(10, 0, 1000)],
                comments: [ req.body.comment ],
            },
        });
    });

//add friend
app.put('/user/:userId([0-9]+)/addFriend',
    validateBody(Joi.object({
        isFriend: Joi.boolean().required(),
    })),
    (req, res) => {
        const friendsList = [];
        if(req.body.isFriend === true){
            friendsList.push(getRandomInt(0, 1000));
        }
        res.send({
            userInfo: {
                id: getRandomInt(0, 1000),
                userName: 'user name',
                userPassword: 'user password',
                userStats: {
                    currentDistance: getRandomInt(0, 1000),
                    currentTime: getRandomInt(0, 1000),
                    totalDistance: getRandomInt(0 ,1000),
                    totalTime: getRandomInt(0, 1000)
                },
                email: 'user email',
                friendsList: [req.body.id],
                comments: [ 'foobar', 'foobaz' ],
            }
        });
    });
//get user stats
app.get('/user/userStats', (req, res) => {
    const userIdStr = req.query.userId;
    if(userIdStr === undefined){
        return res
            .status(400)
            .send({
                error: '"userId" URL query parameter required'
            });
    }
    const userId = parseInt(userIdStr);
    if(isNaN(userId)){
        return res  
            .status(400)
            .send({
                error: 'userId must be an integer'
            });
    }
    //Generate fake user
    const userInfo = {
        id: userId,
        userName: 'user name',
        userPassword: 'user password',
        userStats: {
            currentDistance: getRandomInt(0, 1000),
            currentTime: getRandomInt(0, 1000),
            totalDistance: getRandomInt(0 ,1000),
            totalTime: getRandomInt(0, 1000)
        },
        email: 'user email',
        friendsList: [getRandomInts(10, 0, 1000)]
    };
    return res.send({
        userStats: userInfo.userStats,
    });
});
//get user profile
app.get('/user', (req, res) =>{
    const userIdStr = req.query.userId;
    if(userIdStr === undefined){
        return res
            .status(400)
            .send({
                error: '"userId" URL query parameter required'
            });
    }
    const userId = parseInt(userIdStr);
    if(isNaN(userId)){
        return res  
            .status(400)
            .send({
                error: 'userId must be an integer'
            });
    }
    //Generate fake user
    const userInfo = {
        id: userId,
        userName: 'user name',
        userPassword: 'user password',
        userStats: {
            currentDistance: getRandomInt(0, 1000),
            currentTime: getRandomInt(0, 1000),
            totalDistance: getRandomInt(0 ,1000),
            totalTime: getRandomInt(0, 1000)
        },
        email: 'user email',
        friendsList: [getRandomInts(10, 0, 1000)],
        comments: ['foobar', 'foobaz'],
    };
    return res.send({
        userInfo: userInfo,
    });
});
//update user information
app.put('/user/updateInfo',(req, res) => {
    const userIdStr = req.query.userId;
    const newUsername = req.query.newUsername;
    if(userIdStr === undefined){
        return res
            .status(400)
            .send({
                error: '"userId" URL query parameter required'
            });
    }
    if(newUsername === undefined){
        return res
            .status(400)
            .send({
                error: '"username" URL query parameter required'
            });
    }
    const userId = parseInt(userIdStr);
    if(isNaN(userId)){
        return res  
            .status(400)
            .send({
                error: 'userId must be an integer'
            });
    }
    validateBody(Joi.object({
        username: Joi.string().required(),
    }));
    //Generate fake user
    const userInfo = {
        id: userId,
        userName: 'user name',
        userPassword: 'user password',
        userStats: {
            currentDistance: getRandomInt(0, 1000),
            currentTime: getRandomInt(0, 1000),
            totalDistance: getRandomInt(0 ,1000),
            totalTime: getRandomInt(0, 1000)
        },
        email: 'user email',
        friendsList: [getRandomInts(10, 0, 1000)],
        comments: ['foobar', 'foobaz'],
    };
    userInfo.userName = newUsername;
    req.send({
        userInfo: userInfo,
    });
});

//login 
app.post('/login',(req, res) => {
    validateBody(Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    }));
    res.send('Login Successful');
});

//createUser
app.post('/createUser', (req, res) => {
    validateBody(Joi.object({
        //email: Joi.string().required(),
        username: Joi.string().required(),
        password: Joi.string().required()
    }));
    res.send({
        user : {
            id: getRandomInt(0, 1000),
            userName: 'user name',
            userPassword: 'user password',
            userStats: {
                currentDistance: 0,
                currentTime: 0,
                totalDistance: 0,
                totalTime: 0
            },
            email: 'user email',
            friendsList: [],
            comments: [],
        }
    });
});

//get workout Data
app.get('/workout/:workoutId([0-9]+)', (req, res) => {
    const workoutIdStr = req.query.workoutId;
    if(workoutIdStr === undefined){
        return res
            .status(400)
            .send({
                error: 'workoutID is not included in URL'
            });
    }
    const workoutID = parseInt(workoutIdStr);
    if(isNaN(workoutID)){
        return res  
            .status(400)
            .send({
                error: 'workoutID must be an integer'
            });
    }
    return res.send({
        workoutId: getRandomInt(0, 1000),
        totalTime: getRandomInt(0, 10000),
        movingTime: getRandomInt(0,10000),
        date: '11-01-2020'
    });
});

//get track Data
app.get('/track/:trackId([0-9]+)', (req, res) => {
    const trackIdStr = req.query.trackId;
    if(trackIdStr === undefined){
        return res
            .status(400)
            .send({
                error: 'TrackID not included in URL'
            });
    }
    const trackID = parseInt(trackIdStr);
    if(isNaN(trackID)){
        return res  
            .status(400)
            .send({
                error: 'trackID must be an integer'
            });
    }
    return res.send({
        trackId: getRandomInt(0, 1000),
        longitude: getRandomInt(-80, 80),
        latitude: getRandomInt(-80, 80),
        likes: getRandomInts(10, 0, 1000),
    });
});

///////////////Authentication Stuff//////////////////
//always returning true right now
// function findUser(username){
//     // if(username in database){
//     let username = username;
//     return true;
//     // }
//     //return false;
// }

// function validatePassword(username, password) {
//     let password = password;
//     if(!findUser(username)){
//         return false;
//     }
//     return true;
// }

// function addUser(username, password){
//     if(findUser(username)){
//         return false;
//     } else {
//         const [salt, hash] = mc.hash(password);
//         //add user to data base
//         //db.users.insertOne
//         return true;
//     }
// }
//////////////////////
