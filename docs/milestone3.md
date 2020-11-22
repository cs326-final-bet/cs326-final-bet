# Milestone 3
Final project milestone 3.

# Table Of Contents
- [Database Description](#database-description)
- [Division Of Labor](#division-of-labor)

# Database Descriptions

## dbUsers

- {
- `_id`: Number, //Uniquely identifies a user
- `userName`: String, //Users selected username
- `salt`: String,//Salt for user password
- `hash`: String,//Hash for user password
- `userStats`: { //Object of the users stats
    -   `totalDistance`: Number, //The total distance the user has
    -   `totalTime`: Number //The total area the user has
- },
- `friendsList`: Number[], //Array of userId that represent which users this user has as a friend
- `comments`: Object[] //Array of objects which include a userID, and a comment from that user.
- }

## dbTracks

- {
- `_id`: Number, //Uniquely identifies a track
- `strava` : Object, //Has workout data (activityID)
- `points` : Array of longitude and latitude points
}

## dbAreas

{
- `_id` : String //Uniquely identifies an area
- `position` : Object<Objects> //Gives cube ositions in longitude and latitude
- `polygon` : Array of logitude and latitude points
- `trackIds` : Array<Object> // an Array of track IDs

# Division of Labor
Noah Huppert: 
* Implemented Strava, areas, and map, also assisted with both User and login/register functionality. Set up mongoDB

Patrick Goss
* Implemented login and register functionality and completed dbAreas and adTracks descriptions. Helped set up mongoDB

Dylan Toothaker
* Created User endpoints / Implement dbUsers into endpoints / Profile.html UI changes / Back-end profile functionality


