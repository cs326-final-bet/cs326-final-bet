# Milestone 2
Final project milestone 2.

# Table Of Contents
- [API Reference](#api-reference)

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
