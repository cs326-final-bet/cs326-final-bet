# CS 326 Final Project
UMass computer science 326 final project, team bet.

# Table Of Contents
- [Overview](#overview)
- [Development](#development)

# Overview
This repository includes the final project API server and frontend code.

The server code is located in [`server/`](./server) and the frontend code is
located in [`frontend/`](./frontend). 

See the [development section](#development) for instruction on how to modify
and build the source code.

# Development
The server is written in Javascript and is run with NodeJs. The frontend is 
written in HTML, Javascript, and SASS and uses Parcel for bundling.

## What Is Bundling?
Why do we need Parcel for "bundling"? And what is "bundling" anyways?

It's important to recognize the difference between writing server code for 
NodeJs and writing frontend code for the browser. The server code will be run
by NodeJs. While the frontend code will be run by every user's browser. These
are two completely different environments, and have their own idiosyncrasies. 
For example in the browser you can access the `window` and `document` variables
in order to control what the user sees. However these variables are not 
available in NodeJs.

When developing in NodeJs we can use packages which are published to 
NPM repository (aka the node package manager repository). We can do this on the
server side because NodeJs knows that packages are downloaded into the 
`node_modules` directory.

However when developing code for the frontend, which will run in the browser, we
must use a bundler if we want to use packages from NPM. This is because people
will be viewing our frontend via their own browser's. And their browsers have 
absolutely no idea how to get packages from the NPM repository. So we must help 
them out. This is where a bundler comes in. 

Since user's browsers won't have any idea how to download packages from the NPM
package repository we have to help them out. We will help them out by first 
downloading the NPM packages we want into our `node_modules` folder. Then we 
will use a bundler to combine all the files in the `node_modules` folder into
one big Javascript file. Finally we will include this big Javascript file in our
frontend code. 

The Parcel bundler does this all for us. Without the Parcel bundler user's 
browsers would have no idea where to download the source code for all the NPM
packages we are using. With a bundler we just combine all the package source 
code files and give it to the user's browser.

## Server
To develop the server edit files in the [`server/`](./server) directory. The
[`server/index.js`](./server/index.js) file is the main file for the server. 
This is where our API and everything else is setup.

To start the server run:

```
npm start
```

This will run the API and serve the frontend files!

Any time you make a change to the server's code you must restart the server.

## Frontend
To develop the frontend edit files in the [`frontend/`](./frontend) directory. 
Remember that we must use a bundler here. This is because our frontend makes use
of some packages from the NPM package repository. Without the bundler this would
not be possible. 

Any time you change a file in the `frontend/` directory you must re-run Parcel 
bundler. Otherwise your changes will not be reflected. To make Parcel re-run
every time you change a file run:

```
npm run watch
```

Then to see your files start the server and open the server's address up in 
your web browser.
