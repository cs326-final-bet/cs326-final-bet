# Milestone 1
## Teamwork
### Division Of Labor
The division of labor in phase 1 is as follows:

- Data (Descriptions and user interactions)
  - **Name Of Data Type**: Your name
- Pages (Wireframes and HTML implementations)
  - **Create User**: Patrick Goss
  - **Login**: Patrick Goss
  - **Profile**: Dylan Toothaker
  - **Tracks**: Noah Huppert
  
Notes: The create user and login pages were both completed by Patrick Goss 
because these pages are similar. 

### Communication
The team held 2 virtual meetings over Zoom to directly coordinate work for this 
milestone. A private student only Slack channel was also used to communicate 
daily about milestone 1 details. The team made sure to come to an agreement 
before instituting any new processes or utilizing any new technologies.

## Data Interactions
This app will operate on a user based system. Each person that signs up will have their own profile that will keep track of their user data (email, password, username) and each user will have to sign up with an email and create a username and password for verification. Profiles will also keep track of the users personal fitness statistics (number of workouts, space claimed, duration of workouts, dates of workouts) so they can see how long and consistantly they workout. This app will also support data on what routes have been run in an area and will display this by showing the area claimed on a map. The ability to comment on different routes will also be available through this application. Finally this app will have data on which route is most popular, users will have the ability to rate different routes they have ran or biked.

## Data
The following are descriptions of our application's data. These include a brief 
overview of each data type, an example JSON object which specifies the fields 
and types of our data via example, and details on interactions the user could 
have with each type of data.

### User
User Data. Contains the data for each individual user.

Data format:

- `userId` (Number)
- `userName` (String)
- `userPassword` (String)
- `userStats` (Object)
  - `currentDistance` (Number)
  - `totalDistance` (Number)
  - `currentTime` (Number)
  - `totalTime` (Number)
- `email` (String)
- `friendsList` (Number[])

Each user will have a unique ID to identify them. Each user will have a username and passowrd to log into our application. Each user will have an email to register with.
We will also keep track of the users stats and friends list.

### Track
Track Data. Contains the data for each individual track

Data format:

- `id` (Number)
- `long` (Number)
- `lat` (Number)
- `comments` (String)
- `likes` (Number)

Each track will have a unique id to identify them. Each track will have a longitude and latitude value that will point to the beginning of each track. Each track will support comment data so users will be able to comment on each track and they will also support like data so users can like tracks.

### Work Out
Data format:

- `startTime` (Date)
- `finishTime` (Date)
- `totalTime` (Number)
- `date` (Date)

Everytime a user completes a workout workout data will be logged. This includes a startTime value which will hold the time (military time) the workout was started, a finishTime value that will hold the time (military time) the workout was completed, and totalTime which will be the duration of the workout (startTime - finishTime). Each workout will also take down the date of the workout. All the times for now will be taken down in EST.

### Area
Area Data. Contains data about an area claimed by a user's exercise track. 
To record this data we divide the world into equally sized squares which we 
call "areas". Every valid location on the ground has a corresponding area. 
Determining which area a coordinate falls in is easy using this method. No need
to do any sort of complex query in the database, instead just use this 
2-dimensional hash function.

How this logic works is outside the scope of milestone 1. However in preparation
for future milestones our team has solved this problem ([`area-tiles/area-tiles.md`](../area-tiles/area-tiles.md)).

Area Data JSON:

- `position` (Object)
  - `lat` (Number)
  - `long` (Number)
- `trackIds` (Number[])
- `ownerId` (Number)

The `trackIds` field records the ID of every track which encompassed the area 
tile. The current winner who owns this area tile is recorded in the `ownerId` 
field.

User interactions:

- Any time the user submits a new work out the area tiles they claim will 
  be recorded.
- Any time the user loads the area page the area tiles the user will see on the
  map will be queried and returned. This will be used to show the winner of
  each tile.

# Pages
## Register Page 

The purpose of the Register page is for users to create a profile by entering their email, a desired username and a password.
Wireframe:
![Register Page](./ProjectRegisterWireframe.JPG)

[HTML implementation of wireframe](../../register.html)


## Login

The purpose of the Login page is to allow users to login with their personal login credentials, username and password.

![Register Page](./ProjectLoginWireframe.JPG)

[HTML implementation of wireframe](../../login.html)

## Profile 
Description:
This page shows a users profile which includes the users map, and stats 
as well as a way to compare the users stats to your own.
Wireframe:

![Register Page](./ProfilePageWireframe.PNG)

[HTML implementation of wireframe](../../profile.html)

## Area
The page shows areas claimed by exercises. The winners who have claimed each
area are displayed here. Like a leader board map.

![Wireframe of area page](./area-wireframe.jpg)  

[HTML implementation of wireframe](../../area.html)
