'use strict';

import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';

import Joi from 'joi';

import stravaApi from 'strava-v3';
import decodePolyline from 'decode-google-map-polyline';

import mongo from 'mongodb';

import passport from  'passport';
import jwt from 'jsonwebtoken';
import LocalStrategy from 'passport-local';

import expressSession from 'express-session';

import minicrypt from './miniCrypt.js';
const mc = new minicrypt();

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

// Database
class DatabaseConnection {
    /**
     * @param uri {string} Connection URI.
     * @param db {string} Name of database.
     */
    constructor(uri, db) {
        this.uri = uri;
        this.dbName = db;
        
        this.dbClient = null;
        this.db = null;
        this.users = null;
        this.areas = null;
        this.tracks = null;

        this.connected = false;
    }

    /**
     * Connects to the database, if already connected does nothing.
     * @returns {Object} With 'db', 'users', 'areas', and 'tracks' properties.
     * @throws {string} If failed to connect to MongoDB
     */
    async get() {
        if (this.connected === false) {
            try {
                this.dbClient = await mongo.MongoClient.connect(this.uri, {
                    useUnifiedTopology: true
                });
            } catch (e) {
                throw `Failed to connect to MongoDB: ${e}`;
            }

            this.db = await this.dbClient.db(this.dbName);
            this.users = await this.db.collection('users');
            this.areas = await this.db.collection('areas');
            this.tracks = await this.db.collection('tracks');

            this.connected = true;
        }

        return {
            db: this.db,
            areas: this.areas,
            tracks: this.tracks,
            users: this.users,
        };
    }

    /**
     * @returns {function(req, res, next)} Express middleware which injects this class
     *     instance into req.db.
     */
    middleware() {
        const self = this;
        return async (req, res, next) => {
            req.db = await self.get();
            return next();
        };
    }
}


const db = new DatabaseConnection(config.mongo.uri, config.mongo.db);
db.get().catch((err) => {
    console.error(`Failed to connect to MongoDB: ${err}`);
    process.exit(1);
}).then(() => {
    console.log('Connected to MongoDB');
});

/**
 * Setup a Passport local strategy. The "local" means "we'll handle the user stuff with
 * our own database".
 */
const passportStrategy = new LocalStrategy(
    /**
     * Determines if a login request is valid.
     * @param username {string} The username provided by the client attempting to login.
     * @param password {string} The plain-text password given by the client.
     * @param done {function(error, ok, msg)} To be called when the login request has
     *     been fully evaluated and its outcome has been determined. Provide an error
     *     when calling if an error occurred, the value of the ok argument indicates if
     *     the user should be let in, and msg provides additional details.
     */
    async (username, password, done) => {
        // Lookup user in the database
        const user = await findUser(username);
        if (user === null) {
            // No user
            return done(null, false, { 'message' : 'Wrong username' });
        }

        // Validate password
        if (!(await validatePassword(user, password))) {
            // Invalid password
            await new Promise((r) => setTimeout(r, 2000)); // two second delay
            
            return done(null, false, { 'message' : 'Wrong password' });
        }

        // User is valid
        return done(null, user, true);
    }
);

/**
 * Middleware which checks that a user is authenticated. If they are not they are 
 * redirect to the login page and then back.
 */
async function checkLoggedIn(req, res, next) {
    if (req.isAuthenticated() === true) {
        // If we are authenticated, run the next route.
        return next();
    } else {
        // Otherwise, redirect to the login page.
        return res.redirect(`/login.html?from=${req.path}`);
    }
}

/**
 * Find user by username.
 */
async function findUser(username){
    const collections = await db.get();
    return await collections.users.findOne({userName : username});
}

async function validatePassword(user, enteredPassword) {
    //have to add checks for the salt and hash
    if(mc.check(enteredPassword, user.hash, user.salt)){
        return false;
    }
    return true;
}

/**
 * Registers a user to the database.
 * @param username {string} Username.
 * @param password {string} Plain text password to be hashed and stored.
 * @returns {boolean} True if a user created, false if user with username already exists.
 */
async function addUser(username, password){
    const collections = await db.get();
    if(await collections.users.findOne({ userName : username }) !== null){
        return false;
    } else {
        const [salt, hash] = mc.hash(password);
        const user = {
            userName : username,
            salt : salt,
            hash : hash,
            userStats : {
                totalDistance : 0,
                totalTime : 0
            },
            friendsList : [],
            comments : []
        };
        //add user to data base
        await collections.users.insert(user);
        return true;
    }
}


/**
 * Details on saving user session details via cookies.
 */
const appSession = {
    secret : process.env.SECRET || 'SECRET', // set this encryption key in Heroku config (never in GitHub)!
    resave : false,
    saveUninitialized: false
};

/**
 * Convert user object to a unique identifier.
 */
passport.serializeUser((user, done) => {
    done(null, user);
});

/**
 * Convert a unique identifier to a user object.
 */
passport.deserializeUser((uid, done) => {
    done(null, uid);
});

/* eslint-disable no-unused-vars */
/**
 * Don't use anymore but they are useful.
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
 * Returns the center of any box.
 */
function extCenter(ext) {
    return [
        ext[0] + ((ext[2] - ext[0]) / 2),
        ext[1] + ((ext[3] - ext[1]) /2 )
    ];
}

/* eslint-enable no-unused-vars */

/**
 * Break any area up into 0.01 mile square boxes.
 * @params extent {number[4]} Map extent, latitude and longitude pairs in the format
 *     [upper left lat, upper left long, bottom right lat, bottom right long].
 * @returns {number[][][]} All 0.01 mile square boxes which cover the provided extent.
 *     Each box is provided as a line string, which is an array of lat long pair arrays.
 */
function polysForExt(extent) {
    const polys = [];

    /**
     * Rounds to the nearest hundredths place.
     */
    function r(v) {
        return Math.round((v + Number.EPSILON) * 100) / 100;
    }

    // Define two corners across from each other. First we round all values, otherwise
    // could could end up with some sort of "9999999" which we wouldn't really care
    // about (way too precise). Then we add and subtract 0.01 miles on either side of
    // the previously defined and rounded corner as to not miss anything. If the caller
    // of this function needs only polygons which overlap their provided extent they
    // can do that.
    const extBegin = [ extent[0], extent[1] ].map(r).map(v => v - 0.01);
    const extEnd = [ extent[2], extent[3] ].map(r).map(v => v + 0.01);

    // Make the boxes
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
        throw 'Polygon cannot be empty';
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
 * Algorithm used to construct JWT authentication tokens to strore Strava API 
 * credentials only.
 */
const STRAVA_AUTH_ALGORITHM ='HS256';

/**
 * Name of cookie in which Strava authentication tokens are stored.
 */
const STRAVA_AUTH_COOKIE = 'stravaAuthenticationToken';

// Check that the configured Strava OAuth redirect endpoint matches with the
// endpoint we will define in our express API, I make this mistake all the
// time so I'm gonna catch it this time...
const STRAVA_OAUTH_REDIRECT_ENDPOINT = '/strava_oauth_callback';
if (config.strava.redirect_uri.indexOf(STRAVA_OAUTH_REDIRECT_ENDPOINT) === -1) {
    throw 'The configured Strava OAuth redirect URI and this app\'s API endpoint do not match, this will cause problems and you must fix it';
}

// API
export const app = express();

app.use(db.middleware()); // Database available at req.db

app.use(bodyParser.json()); // Parse HTTP body as JSON
app.use(express.urlencoded({extended : true})); // Handle HTTP bodies from HTML forms
app.use(express.static('dist')); // Serve dist directory
app.use(cookieParser()); // Parse cookies

app.use(expressSession(appSession)); // Keep track of cookies

// Passport authentication (req.isAuthenticated() and req.user)
passport.use(passportStrategy);
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
                error: {
                    overview: 'The request body was not properly formatted',
                    details: result.error,
                },
            });
        }

        next();
    };
}

/**
 * Redirects the user to login page if not logged in. Otherwise redirects them to the
 * map area page.
 */
app.get('/', 
    checkLoggedIn,
    (req, res) => {
        res.redirect('/area.html');
    }
);

/**
 * Users will be redirected to this endpoint when they complete the Strava
 * OAuth flow. We then store their Strava credentials in a cookie and redirect
 * them to the /strava_sync endpoint. This imports all their Strava activities into
 * our database.
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

/**
 * Redirects the user through the Strava OAuth flow if we have not previously logged
 * them into strava.
 */
app.get('/strava_sync',  (req, res, next) => {
    /**
     * First ensure user is logged into our system.
     */
    return checkLoggedIn(req, res, next);
}, async (req, res, next) => {
    /**
     * Middleware which ensures a valid Strava JWT authentication token exists.
     * This gives us access to a user's Strava account. If the user is not logged
     * in we redirect them through the strava OAuth flow. Then we set the 
     * req.stravaAuthToken to the decoded value. Additionally creates a Strava 
     * client for that user in req.userStrava.
     */
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
}, async (req, res) => {
    /**
     * Actual handler which does the activity fetching. It get's all activities in 
     * the user's strava account.
     */
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
        const storedTrack = await req.db.tracks.findOne({
            strava: {
                activityId: act.id,
            },
            userId: new mongo.ObjectID(req.user._id),
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
            return [point.longitude, point.latitude];
        });
        
        // Insert into database
        const track = {
            strava: {
                activityId: act.id,
            },
            userId: new mongo.ObjectID(req.user._id),
            points: points,
            likes: [],
        };
        
        const trackInsertRes = await req.db.tracks.insert(track);
        if (trackInsertRes.insertedCount !== 1) {
            throw `Inserted 1 track but mongodb result said we inserted ${trackInsertRes.insertedCount}`;
        }
        const trackId = trackInsertRes.insertedIds[0];

        // Determine what areas track is within
        const trackExt = extentForPolygon(pointsArr);
        const extPolys = polysForExt(trackExt);

        extPolys.forEach(async (poly) => {
            // See if an area exists yet
            const areaQuery = {
                beginPosition: {
                    latitude: poly[0][0],
                    longitude: poly[0][1],
                },
            };
            
            let area = await req.db.areas.findOne(areaQuery);

            // If no area exists yet
            if (area === null) {
                // Initialize area
                area = {
                    score: 0,
                    beginPosition: {
                        latitude: poly[0][0],
                        longitude: poly[0][1],
                    },
                    endPosition: {
                        latitude: poly[2][0],
                        longitude: poly[2][1],
                    },
                    polygon: poly,
                    trackIds: [],
                    userIds: [],
                };
            }

            // Update area with track
            area.trackIds.push(trackId);
            area.userIds.push(req.user._id);

            // Upsert area
            await req.db.areas.update(areaQuery, area, { upsert: true });
        });
    }));
    
    res.redirect('/area.html');
});

app.get('/areas', async (req, res) => {
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

    // Query database for areas in the extent
    const q = {
        'beginPosition.latitude': {
            $gte: extent[0],
            $lte: extent[2],
        },
        'beginPosition.longitude': {
            $gte: extent[1],
            $lte: extent[3],
        },
    };
    const areas = await req.db.areas.find(q).toArray();

    // Find associated tracks
    const trackIdsSet = new Set();
    const tracksToAreas = {}; // Keys track ids, values set of area ids
    areas.forEach((area) => {
        area.trackIds.forEach((trackId) => {
            if (Object.keys(tracksToAreas).indexOf(trackId) === -1) {
                tracksToAreas[trackId] = new Set();
            }

            tracksToAreas[trackId].add(area._id.toString());
            trackIdsSet.add(trackId.toString());
        });
    });

    const trackIdsArr = Array.from(trackIdsSet).map((trackId) => {
        return new mongo.ObjectID(trackId);
    });

    const tracks = await Promise.all(trackIdsArr.map(async (trackId) => {
        return await req.db.tracks.findOne(trackId);
    }));

    // Filter results by userId query parameter if provided
    const filteredTracks = tracks.filter((track) => {
        if (req.query.userId === undefined) {
            return true;
        }

        return tracks.userId === req.query.userId;
    });
    const filteredAreas = areas.filter((area) => {
        if (req.query.userId === undefined) {
            return true;
        }

        return area.userIds.indexOf(req.query.userId) !== -1;
    });

    return res.send({
        areas: filteredAreas,
        tracks: filteredTracks,
    });
});

app.get('/any_user_area', checkLoggedIn, async (req, res) => {
    const area = await req.db.areas.findOne({
        userIds: req.user._id,
    });

    return res.send({
        area: area,
    });
});

app.get('/my_profile', (req, res) => {
    if (req.user === undefined) {
        return res.redirect('/login.html');
    }

    return res.redirect(`/profile.html?userId=${req.user._id}`);
});

// Comment on user
app.put('/users/:userId/comments',
    validateBody(Joi.object({
        comment: Joi.string().required(),
    })), 
    async (req, res) => {
        const user = await req.db.users.findOne({
            _id: new mongo.ObjectID(req.params.userId),
        });

        user.comments.push({
            userId: req.user._id,
            comment: req.body.comment,
        });

        await req.db.users.update({
            _id: new mongo.ObjectID(req.params.userId),
        }, user);


        res.send({
            user: user,
        });
    });

//add friend
app.put('/user/:userId/addFriend',
    async (req, res) => {
        const userIdStr = req.params.userId;

        const user = await req.db.users.findOne({
            _id: new mongo.ObjectID(userIdStr),
        });

        const friendsList = user.friendsList;

        if(friendsList.includes(req.user._id)){
            user.friendsList.splice(user.friendsList.indexOf(req.user._id), 1);
        } else {
            user.friendsList.push(req.user._id);
        }
        await req.db.users.update({
            _id: new mongo.ObjectID(userIdStr),
        },user);
        res.send({
            friendsList: friendsList,
        });
    });
//get user stats
app.get('/user/:userId/userStats',  async (req, res) => {
    const userIdStr = req.params.userId;

    //Get the user from the DB
    const user = await req.db.users.findOne({
        _id: new mongo.ObjectID(userIdStr),
    });
    
    // const userStats = user.userStats;
    
    // Return the user stats
    const timeDifference = req.user.userStats.currentTime - user.userStats.currentTime;
    const distanceDifference = req.user.userStats.currentDistance - user.userStats.currentDistance;
    return res.send({
        timeDiff: timeDifference,
        distDiff: distanceDifference,
    });
});
//get user profile
app.get('/user', async (req, res) =>{
    const userIdStr = req.query.userId;
    if(userIdStr === undefined){
        return res
            .status(400)
            .send({
                error: '"userId" URL query parameter required'
            });
    }
    
    //Get the user
    const user = await req.db.users.findOne({
        _id: new mongo.ObjectID(userIdStr),
    }, { _id: true, userName: true, userStats: true, friendsList: true, comments: true});
    
    return res.send({
        userInfo: user,
    });
});

//post login 
app.post('/login', validateBody(Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    from: Joi.string(),
})), (req, res, next) => {
    let successRedirect = '/';
    if (req.body.from !== undefined) {
        successRedirect = req.body.from;
    }
    
    return passport.authenticate('local' , {     // use username/password authentication
        'successRedirect' : successRedirect,
        'failureRedirect' : '/login.html'      // otherwise, back to login
    })(req, res, next);
});

//register
app.post('/register', validateBody(Joi.object({
    username: Joi.string().required(),
    password: Joi.string().required(),
    from: Joi.string(),
})),
async (req, res) => {
    const username = req.body['username'];
    const password = req.body['password'];

    let successRedirect = '/';
    if (req.body.from !== undefined) {
        successRedirect = req.body.from;
    }

    if(await addUser(username, password)){
        res.redirect(`/login.html?from=${successRedirect}`);
    } else {
        res.redirect('/register.html');
    }
}
);

//get track Data
app.get('/track/:trackId', async (req, res) => {
    const track = await req.db.tracks.findOne({
        _id: new mongo.ObjectID(req.params.trackId),
    });

    return res.send({
        track: track,
    });
});

/**
 * Run the server.
 */
export function runApp() {
    app.listen(config.port, () => {
        console.log(`\
Server listening on port ${config.port}. View in your web browser:

    http://127.0.0.1:${config.port} or http://localhost:${config.port}
`);
    });
}
