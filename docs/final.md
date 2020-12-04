# Bet
## Fitness.io
## Fall 2020

### Overview: A brief overview of your application. This will be based on what you are submitting as your final web application artifact. You should also mention why your application is innovative.

### Team Members: A list of your team members, with names and GitHub aliases.

 - Patrick Goss - `pgoss`
 - Noah Huppert - `Noah-Huppert`
 - Dylan Toothaker - `DTooth`

### User Interface: A final up-to-date list/table describing your application’s user interface. This should include the name of the UI view and its purpose. You should include a screenshot of each of your UI views.

#### Login:

#### Register:

#### Area:

#### Profile:
- A specific user's profile page including their stats, their map of claimed area, and comments other users have posted.
[image]
- Profile page has a follow button, that adds this user as your friend. It has a 'back to home' button that returns the user to the home page (area.html). It also includes a post comment area, to leave a comment on a user's profile, and a compare stats button to see the difference in you and another users stats.
- Compare Stats Panel
[image]

### APIs: A final up-to-date list/table describing your application’s API

#### User:
##### GET /user/${userId}/userStats
- GET method to retrieve another user's stats to compare to your own.
##### PUT /user/${userId}/addFriend
- PUT method to add or remove a friend from your friends list.
##### PUT /users/${userId}/comments
- PUT method to post a comment on a user's profile.

#### Workout:

#### Track:

#### Area:

### Database: A final up-to-date representation of your database including a brief description of each of the entities in your data model and their relationships if any.

#### UserDB: 
A database for the user's personal data such as username, password, friendslist, etc.
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

#### TrackDB:

#### WorkoutDB:

### URL Routes/Mappings: A final up-to-date table of all the URL routes that your application supports and a short description of what those routes are used for. You should also indicate any authentication and permissions on those routes.

#### Login:

#### Register:

#### Profile: 
##### profile.html

#### Area:

### Authentication/Authorization: A final up-to-date description of how users are authenticated and any permissions for specific users (if any) that you used in your application. You should mention how they relate to which UI views are accessible.



### Division of Labor: A breakdown of the division of labor for each team member — that is, saying who did what, for the entire project. Remember that everyone is expected to contribute roughly equally to each phase of the project. We expect to see similar numbers and kinds of GitHub commits by each student.

#### Patrick

#### Dylan
- Profile.html
- Profile.js
- Profile.scss
- Ceated user endpoints: /addFriend /comment /user /userStats
- Implement dbUsers into endpoints
- Back-end profile functionality
#### Noah

### Conclusion: A conclusion describing your team’s experience in working on this project. This should include what you learned through the design and implementation process, the difficulties you encountered, what your team would have liked to know before starting the project that would have helped you later, and any other technical hurdles that your team encountered

## Dylan
Our team learned a lot creating this application. We learned very early on that our design process and implementation process would not be exactly what we wanted. When proposing our idea, Joseph let us know that the idea we had might be too out of scope for this class. We decided to go with it anyways because we wanted a challenge. We encountered a few difficulties implementing some of our ideas from our design process into the actual application. But with some minor changes we were able to get the majority of what we wanted to implement, implemented. Personally, I would have liked to spend a little more time on API endpoints and database implementation. Those were our two biggest struggles with this project. If we had more time we definitely would have liked to go through, fix bugs, make our HTML nicer looking, and implement a function to have strava automatically sync with our application and let users allow our app to use there location so a proper map loads when viewing their own profile. 
