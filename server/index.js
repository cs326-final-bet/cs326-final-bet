'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import Joi from 'joi';
import stravaApi from 'strava-v3';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import decodePolyline from 'decode-google-map-polyline';
import mongo from 'mongodb';

import minicrypt from './miniCrypt.js'; 
import passport from  'passport';
import LocalStrategy from 'passport-local';
import expressSession from 'express-session';
import minicrypt from './miniCrypt.js';
import MongoClient from 'mongodb';

// The environment variable DATABASE_URL should be defined (through Heroku / locally / both)

const strategy = new LocalStrategy(
    async (username, password, done) => {
        if (!findUser(username)) {
            return done(null, false, { 'message' : 'Wrong username' });
        }
        if (!validatePassword(username, password)) {
        // invalid password
            await new Promise((r) => setTimeout(r, 2000)); // two second delay
            return done(null, false, { 'message' : 'Wrong password' });
        }
        // should create a user object here, associated with a unique identifier
        return done(null, username);
    }
);

const session = {
    secret : process.env.SECRET || 'SECRET', // set this encryption key in Heroku config (never in GitHub)!
    resave : false,
    saveUninitialized: false
};


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
//const port = process.env.PORT || 8000;
// Connect to the database, then start the server
client.connect(err => {
    if (err) {
        console.error(err);
    } else {
        app.listen(process.env.PORT || 8000);
    }
})

app.use(bodyParser.json());
app.use(express.static('dist'));
app.use(express.static('frontend'));

const mc = new minicrypt();
app.use(expressSession(session));
passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json()); // allow JSON inputs
app.use(express.urlencoded({'extended' : true})); // allow URLencoded data



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

/**
 * Middleware which ensures a valid Strava JWT authentication token exists then sets
 * req.stravaAuthToken to the decoded value. Additionally creates a Strava client for
 * that user in req.userStrava.
 */
const verifyStravaAuthToken = async (req, res, next) => {
    // Check authentication cookie exists
    if (req.cookies[STRAVA_AUTH_COOKIE] === undefined) {
        // If not then redirect user to authenticate with Strava
        return res.redirect(`http://www.strava.com/oauth/authorize?client_id=${config.strava.client_id}&response_type=code&redirect_uri=${config.strava.redirect_uri}&approval_prompt=force&scope=read,activity:read`);
    }

    // Verify JWT
    const authCookie = req.cookies[STRAVA_AUTH_COOKIE];
    try {
        req.authToken = await jwt.verify(
            authCookie, config.strava.authentication_token_secret, {
                algorithm: STRAVA_AUTH_ALGORITHM,
            });
    } catch (e) {
        console.error(`Failed to verify an authentication token JWT: ${e}`);
        return res.status(401).json({
            error: 'Not authorized',
        });
    }

    req.userStrava = new stravaApi.client(req.authToken.payload.strava.authentication.access_token);

    next();
};

app.get('/', 
    checkLoggedIn,
    (req, res) => {
        res.redirect('/area.html');
    }
);

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
        areas.splice(getRandomInt(0, areas.length-1), 1);
    }

    return res.send({
        areas: areas,
    });

});

// Like area
app.put('/areas/:areaId([0-9]+)/likes',
    validateBody(Joi.object({
        liked: Joi.boolean().required(),
    })),
    (req, res) => {
        const likes = [];
        if (req.body.liked === true) {
            likes.push(getRandomInt(0, 1000));
        }

        const poly = polysForExt([0, 0, 0.1, 0.1])[0];
               
        res.send({
            area:  {
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
                trackIds: getRandomInts(10, 0, 1000),
                ownerId: getRandomInt(0, 1000),
                likes: likes,
            },
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

//post login 
app.post('/login', (req, res) => {
    validateBody(Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    }));
    passport.authenticate('local' , {     // use username/password authentication
        'successRedirect' : '/private',   // when we login, go to /private 
        'failureRedirect' : '/login'      // otherwise, back to login
    });
    //res.redirect('/areas');
});

//get login
app.get('/login',
    (req, res) => res.sendFile(process.cwd() + '/frontend/login.html')
);

//register
app.post('/register', (req, res) => {
    validateBody(Joi.object({
        email: Joi.string().required(),
        username: Joi.string().required(),
        password: Joi.string().required()
    }));
    const username = req.body['username'];
    const password = req.body['password'];
    if(addUser(username, password)){
        res.redirect('/login')
    } else {
        res.redirect('/register');
    }
    /*res.send({
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
            comments: []
        }
    });*/
});

//get register
app.get('/register',
    (req, res) => res.sendFile(process.cwd() + '/frontend/register.html')
);

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
        comments: [],
        likes: getRandomInts(10, 0, 1000)
    });
});

/**
 * Run the server.
 */
export function runApp() {
    app.listen(config.port, () => {
        console.log(`\
Server listening on port ${config.port}. View in your web browser:

    http://127.0.0.1:${config.port} or http://localhost:${config.port}`);
    });
}
//User Database and Authentication Stuff
async function checkLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        // If we are authenticated, run the next route.
        next();
    } else {
        // Otherwise, redirect to the login page.
        res.redirect('/login');
    }
}

async function findUser(username){
    if(!(dbUsers.findOne({username : username}))){
        return true;
    }
    return false;
}

async function validatePassword(username, password) {
    if(!(dbUsers.findOne({ username : username }))){
        return false;
    }
    //have to add checks for the salt and hash
    if(mc.check(password, dbUsers.findOne({username : username}).hash, dbUsers.findOne({username : username}).salt)){
        return false;
    }
    return true;
}

async function addUser(username, password){
    if(dbUsers.findOne(username)){
        return false;
    } else {
        const [salt, hash] = mc.hash(password);
        const user = {
            username : username,
            salt : salt,
            hash : hash
        }
        //add user to data base
        await dbUsers.insert(user);
        return true;
    }
}
