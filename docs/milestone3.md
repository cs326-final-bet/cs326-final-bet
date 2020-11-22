# Milestone 3
Final project milestone 3.

# Table Of Contents
- [Database Description](#database-description)
- [Division Of Labor](#division-of-labor)

# Database Descriptions
## dbUsers

*{
*_id: Number, //Uniquely identifies a user
*userName: String, //Users selected username
*salt: String,//Salt for user password
*hash: String,//Hash for user password
*userStats: { //Object of the users stats
 *       currentDistance: Number, //The current distance the user has on their map
 *       currentArea: Number, //The current area the user has on their map
 *       totalDistance: Number, //The total distance the user has
 *       totalArea: Number //The total area the user has
*    },
*friendsList: Number[], //Array of userId that represent which users this user has as a friend
*comments: Object[] //Array of objects which include a userID, and a comment from that user.
*}

dbTracks

dbAreas

# Division of Labor
Noah Huppert: 
* API descriptions & mockups of: POST `/strava`, PUT `/tracks/<track ID>/likes`, PUT `/tracks/<track ID>/comment`, GET `/area`
* Deployed onto Heroku

Patrick Goss
* API descriptions & mockups of: PUT `/createUser`, GET `/workout/id`, GET `/track/id`, POST `/login`
* Wrote CRUD descriptions for Login and Register Pages

Dylan Toothaker
* Created User endpoints / Implement dbUsers into endpoints / Profile.html UI changes / Back-end profile functionality


