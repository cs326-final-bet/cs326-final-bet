# Milestone 2
Final project milestone 2.

# Table Of Contents
- [Division Of Labor](#division-of-labor)
- [API Reference](#api-reference)
- [CRUD Operations Per Page](#crud-operations-per-page)

# Division of Labor
Noah Huppert: 
* API descriptions & mockups of: POST `/strava`, PUT `/tracks/<track ID>/likes`, PUT `/tracks/<track ID>/comment`, GET `/area`
* Deployed onto Heroku

Patrick Goss
* API descriptions & mockups of: PUT `/createUser`, GET `/workout/id`, GET `/track/id`, POST `/login`
* Wrote CRUD descriptions for Login and Register Pages

Dylan Toothaker
* API descriptions & mockups of: PUT `/users/<userID>/add`, GET `/users/<userID>/profile`, PUT `/users/<userID>/userInfo`, GET `/users/<userID>/userInfo`, GET `/users/<userID>/userStats`

# API Reference
Description of API endpoints. Organized by resource.

## Example Format Section
### HTTP Method `/<HTTP Path>`
Quickly describe the endpoint's purpose. Including any side effects it may have
(like saving a piece of data in a database).

#### Request
URL parameters:

- If you have URL parameters describe them here

Body:

- If your endpoint expects a request body use the bullet point list format, that
  we used to define our data types in milestone 1, to define the JSON request we
  expect for this endpoint.

#### Response
HTTP response code:

- Same bullet point list format to describe JSON response

Other HTTP response code:

- Ditto

## User Endpoints
### POST /Login
 Allows for users to login

#### Request
Body:

* `Username` (String) and `Password` (String)

#### Response
200:

* encrypted token used for authentication

### CREATE /createUser
allows for users to be created 

#### Request
Body:

* `Email` (String), `Username` (String), `Password` (String)

#### Response
200:

* Users email, username and password are saved into database

### PUT `/users/<userID>/add`
Get the ID of the user to add as a friend or remove as a friend, and update the friends list with that user ID.
#### Request
URL parameters:
- `userID` (Integer): ID of user to add or unadd.
Body:
- `isFriend` (Boolean): True if the user is on your friends list, false if the user
  is not on your friends list.
- `friendsList`(userID[]): Updated friends list.
#### Response
200:
- `user` (User): Update user's friendslist.

### GET `/users/<userID>/profile`
  Get the ID of a user to access their profile page.
#### Request
URL parameters:
- `userID` (Integer): ID of user whose profile to view
#### Response
200:
- `user` (User): User information / profile page.

### POST `/users/create`

### PUT `/users/<userID>/userInfo`
Update the users current information. Need authentication to make sure you are the correct user.
#### Request
URL Parameters:
- `userID` (Integer): ID of your user.
Body: 
- `userId` (Number): Unique ID used to identify a user
- `userName` (String): A user's set username
- `userPassword` (String): A user's set password
- `userStats` (Object): JSON object of the user's stats
  - `currentDistance` (Number): The current distance the user has claimed
  - `totalDistance` (Number): The total distance the user has claimed
  - `currentTime` (Number): The current time a user has claimed
  - `totalTime` (Number): The total time a user has claimed.
- `email` (String): The user's email adress
- `friendsList` (Number[]): an Array of userID's the represent the other user's this user has as
a friend.
#### Response
200:
  - `user` (User) updated user information 
  
### GET `/users/<userID>/userInfo`
View the users current information
#### Request
URL Parameters:
- `userID` (Integer): ID of user to view information
#### Response
200:
  -Empty JSON object
  
### GET `/users/<userID>/userStats`
  Get the stats of the user with the requested userID
#### Request
URL Parameters:
- `userID` (Integer): ID of user to compare stats with.
### Response
200:
- `userStats` (Object): JSON object of the user's stats
  - `currentDistance` (Number): The current distance the user has claimed
  - `totalDistance` (Number): The total distance the user has claimed
  - `currentTime` (Number): The current time a user has claimed
  - `totalTime` (Number): The total time a user has claimed.


## Workout Endpoints
### POST `/strava`
Receive information from Strava about a new exercise activity. See the
[Strava webhook API documentation](https://developers.strava.com/docs/webhooks/)
for more details.

When we receive a request from Strava it notifies us that a user has logged a 
new activity. We will then use the Strava API to request details about this
activity, process it, and save it in our system. We will create a Workout, 
Track, and one or more Area types.

#### Request
Body:

- `object_type` (String): Type of object specified in webhook request, always
  `activity` to indicate we are receiving a new activity.
- `object_id` (Number): ID of activity in Strava's system.
- `aspect_type` (String): Action which has taken place, always `create`.
- `updates` (Object): Details about any metadata updated. Not relevant for us.
- `owner_id` (Number): ID of Strava user who owns activity.
- `subscription_id` (Number): ID of Strava subscription. The subscription is 
  a Strava API concept which manages when we receive webhook requests.
- `event_time` (Number): Time at which the activity was created.

#### Response
200:

- Empty JSON object.

### GET /workout/ID
View endpoint which returns all workout data (id (String), totalTime (Number), movingTime (Number), date) as JSON object.

#### Request
URL Parameters:

* `workout ID` (String): ID of workout to get info on
    
#### Response
200:

* `workout` (Workout): ({'id' : '123456789', 'totalTime' : 4300, 'movingTime' : 4250,'date' : 2020-10-02})

## Track Endpoints

### GET /track/ID
View endpoint which returns all track data(id (String), long (Number), lat (Number), comments (String), likes (Number)) as JSON object.

#### Request
URL parameters: 

* `track ID` (String): ID of track to get info on 
    
#### Response
200:

* `track` (Track): ({'id' : '123456789', 'long' : 42.111, 'lat' : -70.111, 'comments' : {'id' : 1, 'comment' : 'Some comment on track 123456789'}, 'likes' : 6})

### PUT `/tracks/<track ID>/likes`
Add or remove a like from a track.

#### Request
URL parameters:

- `track ID` (String): ID of track to like or unlike.

Body:

- `liked` (Boolean): True if the track should be liked by the user, false if the
  track should be un-liked by the user.

#### Response
200:

- `track` (Track): Updated track.

### PUT `/tracks/<track ID>/comments`
Add a comment to a track.

#### Request
URL parameters:

- `track ID` (String): ID of track on which to comment.

Body:

- `comment` (String): Text of comment.

#### Response
200:

- `track` (Track): Updated track.

## Area Endpoints
### GET `/areas?extend=<extent>`
Retrieve all area tiles in the extent provided.

#### Request
URL parameters:

- `extent` (String): Territory in the form of a box on a map to retrieve area 
  tiles for. This is specified by giving the coordinates for the top left and 
  bottom right of the box. Formatted in a string like so:
  ```
  <top left latitude>,<top left longitude>,<bottom right latitude>,<bottom right longitude>
  ```

#### Response
200:

- `areas` (Area[]): Areas in the extent.
- `tracks` (Track[]) Tracks in the extent.

## CRUD for Each Page

#### Register Page

![Register Page](./registerPage.JPG)

* Create: this page will all users to be created with the imput of an email, username, and passwordd

![Register Page](./loginPage.JPG)

* Read: This page will read the username and email as the users login credentials

#### Profile Page

![Profile Page](./profilePage.JPG)

* Read: This page will read the users profile and user information.

#### Area Page

![Area Page](./areaPage.png)

* Read: Retrieves a list of areas which are contained in the section of the map
  which users are currently looking.
* Update: Updates a track with a comment when the user clicks the comment button.
* Update: Updates a track with a like when the user clicks the like button.
