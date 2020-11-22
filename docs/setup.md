# Setup
Final project setup documentation.

# Table Of Contents
- [Instructions](#instructions)

# Instructions
To setup the project follow these steps:

1. Install dependencies:
   ```
   npm install
   ```
2. Run the bundler for the frontend:
   ```
   npm run build
   ```
3. Set configuration variables by creating a file named `.env` and adding the
   the following values:
   ```
    PORT=8000

    STRAVA_ACCESS_TOKEN=YOUR_VALUE
    STRAVA_CLIENT_ID=YOUR_VALUE
    STRAVA_CLIENT_SECRET=YOUR_VALUE
    STRAVA_REDIRECT_URI=http://localhost:8000/strava_oauth_callback
    STRAVA_AUTHENTICATION_TOKEN_SECRET=YOUR_VALUE

    APP_MONGO_URI=YOUR_VALUE
    APP_MONGO_DB=dev-cs-326-final

   ```
   Be sure to substitute `YOUR_VALUE` for your own values of the 
   respective fields.
4. Start the server:
   ```
   npm start
   ```
   
Access the server on the web address printed to the console. 

For instructions on how to develop changes see the [development section in the
README.md file](../README.md#development).
