'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import Joi from 'joi';
import stravaApi from 'strava-v3';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import decodePolyline from 'decode-google-map-polyline';
import mongo from 'mongodb';
import passport from  'passport';
import LocalStrategy from 'passport-local';
import expressSession from 'express-session';
import minicrypt from './miniCrypt.js';
import MongoClient from 'mongodb';

const strategy = new LocalStrategy(
    async (username, password, done) => {
        let user = await findUser(username);
        if (user === null) {
            return done(null, false, { 'message' : 'Wrong username' });
        }
        if (!(await validatePassword(user, password))) {
        // invalid password
            await new Promise((r) => setTimeout(r, 2000)); // two second delay
            return done(null, false, { 'message' : 'Wrong password' });
        }
        // should create a user object here, associated with a unique identifier
        return done(null, user);
    }
);

const session = {
    secret : process.env.SECRET || 'SECRET', // set this encryption key in Heroku config (never in GitHub)!
    resave : false,
    saveUninitialized: false
};

// Convert user object to a unique identifier.
passport.serializeUser((user, done) => {
    done(null, user);
});
// Convert a unique identifier to a user object.
passport.deserializeUser((uid, done) => {
    done(null, uid);
});

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

/**
 * Return the extent box for the polygon.
 * @param poly {Number[][]} Array of lat long pairs which make up the polygon.
 * @returns {Number[4]} Extent.
 */
function extentForPolygon(polys) {
    if (polys.length === 0) {
        throw 'Polygon cannot by empty';
    }
    
    const topLeft = polys[0];
    const bottomRight = polys[0];

    polys.forEach((poly) => {
        if (poly[0] < topLeft[0]) {
            topLeft[0] = poly[0];
        }

        if (poly[1] < topLeft[1]) {
            topLeft[1] = poly[1];
        }

        if (poly[0] > bottomRight[0]) {
            bottomRight[0] = poly[0];
        }

        if (poly[1] > bottomRight[1]) {
            bottomRight[1] = poly[1];
        }
    });

    return [topLeft[0], topLeft[1], bottomRight[0], bottomRight[1]];
}

/**
 * Returns the center of any box.
 */
function extCenter(ext) {
    return [
        ext[0] + ((ext[2] - ext[0]) / 2),
        ext[1] + ((ext[3] - ext[1]) /2 )
    ];
}

/**
 * Application configuration, all values set via environment variables.
 */
const config = {
    port: process.env.PORT, // Heroku sets this
    strava: {
        access_token: process.env.STRAVA_ACCESS_TOKEN,
        client_id: process.env.STRAVA_CLIENT_ID,
        client_secret: process.env.STRAVA_CLIENT_SECRET,
        redirect_uri: process.env.STRAVA_REDIRECT_URI,
        authentication_token_secret: process.env.STRAVA_AUTHENTICATION_TOKEN_SECRET,
    },
    mongo: {
        uri: process.env.APP_MONGO_URI,
        db: process.env.APP_MONGO_DB,
    }
};

/**
 * Algorithm used to construct JWT authentication tokens.
 */
const STRAVA_AUTH_ALGORITHM ='HS256';

/**
 * Name of cookie in which authentication tokens are stored.
 */
const STRAVA_AUTH_COOKIE = 'stravaAuthenticationToken';

// Check that the configured Strava OAuth redirect endpoint matches with the
// endpoint we will define in our express API, I make this mistake all the
// time so I'm gonna catch it this time...
const STRAVA_OAUTH_REDIRECT_ENDPOINT = '/strava_oauth_callback';
if (config.strava.redirect_uri.indexOf(STRAVA_OAUTH_REDIRECT_ENDPOINT) === -1) {
    throw 'The configured Strava OAuth redirect URI and this app\'s API endpoint do not match, this will cause problems and you must fix it';
}

// Database
let dbClient = null;
let db = null;
let dbUsers = null;
let dbAreas = null;
let dbTracks = null;

(async function () {
    try {
        dbClient = await mongo.MongoClient.connect(config.mongo.uri, {
            useUnifiedTopology: true
        });
    } catch (e) {
        console.error(`Failed to connect to MongoDB: ${e}`);
        process.exit(1);
    }

    db = dbClient.db(config.mongo.db);
    dbUsers = db.collection('users');
    dbAreas = db.collection('areas');
    dbTracks = db.collection('tracks');

    console.log('Connected to MongoDB');
})();

// API
export const app = express();

app.use(bodyParser.json()); // Parse HTTP body as JSON
app.use(express.urlencoded({extended : true}));
app.use(express.static('dist')); // Serve dist/ directory
// app.use(express.static('frontend')); // Serve dist/ directory
app.use(cookieParser()); // Parse cookies

const mc = new minicrypt();
app.use(expressSession(session));
passport.use(strategy);
app.use(passport.initialize());
app.use(passport.session());

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

app.get('/', 
    checkLoggedIn,
    (req, res) => {
        res.redirect('/area.html');
    }
);

/**
 * Users will be redirected to this endpoint when they complete the Strava
 * OAuth flow. We then store their Strava credentials in a cookie and redirect
 * them to the homepage.
 */
app.get(STRAVA_OAUTH_REDIRECT_ENDPOINT, async (req, res) => {
    // After the user agrees to give us access to their Strava account we should
    // have a request with a 'code' URL parameter. Exchange that with Strava on
    // our end and "we're in" ;)
    const stravaOAuthCode = req.query.code;

    let stravaTok = null;

    try {
        stravaTok = await stravaApi.oauth.getToken(stravaOAuthCode);
    } catch (e) {
        console.error(`Failed to exchange a Strava OAuth code for a token: ${e}`);
        return res.redirect('/strava_sync?auth_error=strava');
    }

    // Figure out who this token belongs to, makes our life a lot easier later on.
    const userStrava = new stravaApi.client(stravaTok.access_token);
    
    let athlete = null;
    try {
        athlete = await userStrava.athlete.get();
    } catch (e) {
        console.error(`Failed to get information about authentication token owner: ${e}`);
        return res.redirect('/strava_sync?auth_error=strava');
    }

    // Send user a symmetrically encrypted JWT which contains their strava token,
    // we will use this in other endpoints to get their data.
    let token = null;
    
    try {
        token = await jwt.sign({
            payload: {
                strava: {
                    authentication: {
                        expires_at: stravaTok.expires_at,
                        refresh_token: stravaTok.refresh_token,
                        access_token: stravaTok.access_token,
                    },
                    athlete: athlete,
                },
            },
        }, config.strava.authentication_token_secret, {
            algorithm: STRAVA_AUTH_ALGORITHM, 
        });
    } catch (e) {
        console.error(`Failed to construct JWT: ${e}`);
        return res.redirect('/strava_sync?auth_error=internal');
    }

    res.cookie(STRAVA_AUTH_COOKIE, token);

    return res.redirect('/strava_sync');
});

app.get('/strava_sync',
    /**
         * Middleware which ensures a valid Strava JWT authentication token exists.
         * This gives us access to a user's Strava account. If the user is not logged
         * in we redirect them through the strava OAuth flow. Then we set the 
         * req.stravaAuthToken to the decoded value. Additionally creates a Strava 
         * client for that user in req.userStrava.
         */

    async (req, res, next) => {
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
    },
    /**
         * Actual handler which does the activity fetching. It get's all activities in 
         * the user's strava account.
         */
    async (req, res) => {
        // Get activities
        let activities = null;
            
        try {
            activities = await req.userStrava.athlete.listActivities({});
        } catch (e) {
            console.error(`Failed to get Strava user activities: ${e}`);
            return res.status(500).json({
                error: 'Failed to get Strava user activities',
            });
        }

        // Add all user's tracks to database
        await Promise.all(activities.map(async (act) => {
            // Check if we already have this track in the database
            const storedTrack = await dbTracks.findOne({
                strava: {
                    activityId: act.id,
                },
            });

            if (storedTrack !== null) {
                // We already have this activity synced into our database so just skip
                return;
            }

            // Get the points of the workout
            const points = decodePolyline(act.map.summary_polyline).map((pnt) => {
                return {
                    longitude: pnt.lng,
                    latitude: pnt.lat,
                };
            });
            const pointsArr = points.map((point) => {
                return [points.longitude, points.latitude];
            });
                
            // Insert into database
            const track = {
                strava: {
                    activityId: act.id,
                },
                points: points,
                likes: [],
            };
                
            await dbTracks.insert(track);

            // Determine what areas track is within
            const trackExt = extentForPolygon(pointsArr);
            const extPolys = polysForExt(trackExt);
            // TODO: These extPolys are now in step 2 of the finding areas algorithm.
            //       Now all we must do is find if their center's are in the polygon
            //       Then add the track's ID to the area!
        }));
            
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
        user: Joi.number().required(),
        comment: Joi.string().required(),
    })), 
    
    (req, res) => {
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
        const user = dbUsers.findOne({
            id: req.query.userId,
        });
        let comments = user.comments;
        const userIdBody = req.body.user;
        const comment = req.body.comment;
        comments.push({userIdBody : comment});

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
app.get('/user/:userIDs([0-9]+)/userStats', async (req, res) => {
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
    //Get the user from the DB
    const user = dbUsers.findOne({
        id: req.query.userId,
    });
    const userStats = user.userStats;
    //return the user stats
    return res.send({
        userStats: userStats,
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
    //Get the user
    const user = dbUsers.findOne({
        id: req.query.userId,
    });
    //Generate fake user
    
    return res.send({
        userInfo: user,
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
app.post('/login', validateBody(Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    })),
    passport.authenticate('local' , {     // use username/password authentication
        'successRedirect' : '/area.html',   // when we login, go to /private 
        'failureRedirect' : '/login.html'      // otherwise, back to login
    })
);


//register
app.post('/register', validateBody(Joi.object({
        username: Joi.string().required(),
        password: Joi.string().required()
    })),
    async (req, res) => {
        const username = req.body['username'];
        const password = req.body['password'];
        //console.log(username + " " + password);
        //console.log("blah blah" + await addUser(username, password) + "tex");
        if(await addUser(username, password)){
            res.redirect('/login.html');
        } else {
            res.redirect('/register.html');
        }
    }
);

// //get register
// app.get('/register',
//     (req, res) => res.sendFile(process.cwd() + '/frontend/register.html')
// );

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
app.get('/track/:trackId', async (req, res) => {
    const track = await dbTracks.findOne()
});

//User Database and Authentication Stuff
async function checkLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        // If we are authenticated, run the next route.
        next();
    } else {
        // Otherwise, redirect to the login page.
        res.redirect('/login.html');
    }
}

async function findUser(username){
    return await dbUsers.findOne({userName : username});
}

async function validatePassword(user, enteredPassword) {
    //have to add checks for the salt and hash
    if(mc.check(enteredPassword, user.hash, user.salt)){
        return false;
    }
    return true;
}

async function addUser(username, password){
    if(await dbUsers.findOne({ userName : username })){
        return false;
    } else {
        const [salt, hash] = mc.hash(password);
        const user = {
            userName : username,
            salt : salt,
            hash : hash
        };
        //add user to data base
        await dbUsers.insert(user);
        return true;
    }
}

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