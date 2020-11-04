# Milestone 2
Final project milestone 2.

# Table Of Contents
- [API Reference](#api-reference)

# API Reference
Description of API endpoints. Organized by resource.

## User Endpoints
TODO

## Workout Endpoints
TODO

## Track Endpoints
TODO

## Area Endpoints
### GET `/areas?extend=<extent>`
Retrieve all area tiles in the extent provided.

#### Request
URL parameters:

- `extent`: Territory in the form of a box on a map to retrieve area tiles for.
  This is specified by giving the coordinates for the top left and bottom right
  of the box. Formatted in a string like so:
  ```
  <top left latitude>,<top left longitude>,<bottom right latitude>,<bottom right longitude>
  ```

#### Response
200:

- `areas` (Area[]): Areas in the extent.
