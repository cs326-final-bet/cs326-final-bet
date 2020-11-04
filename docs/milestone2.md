# Milestone 2
Final project milestone 2.

# Table Of Contents
- [API Reference](#api-reference)

# API Reference
Description of API endpoints. Organized by resource.

## Example Format Section
### <HTTP Method> `/<HTTP Path>`
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
TODO

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

## Track Endpoints
### UPDATE `/tracks/<track ID>/likes`
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

### UPDATE `/tracks/<track ID>/comments`
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
