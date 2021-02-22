/* eslint-disable indent */
/* eslint-disable no-trailing-spaces */
/* eslint-disable eol-last */
/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
/* eslint-disable quotes */
"use strict";
// Application Dependencies
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const superagent = require("superagent");

// Application Setup
const PORT = process.env.PORT || 3000;
const server = express();
server.use(cors());

// Route Definitions
server.get('/location', locationHandler);
server.get('/weather', weatherHandler);
server.get('/parks', parkHandler);
server.get('/*', errorHandler);
// server.use(handleError);

function locationHandler(req, res) {
  const cityName = req.query.city;
  // url : https://eu1.locationiq.com/v1/search.php?key=YOUR_ACCESS_TOKEN&q=SEARCH_STRING&format=json

  let key = process.env.LOCATION_KEY;
  let url = `http://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json
  `;
  superagent
    .get(url)
    .then((locData) => {
      const locObj = new Location(cityName, locData.body[0]);
      res.send(locObj);
    })
    .catch(() => {
      errorHandler(`Error`, req, res);
    });
}
function weatherHandler(req, res) {
  // https://api.weatherbit.io/v2.0/forecast/daily?city=Raleigh,NC&key=API_KEY
  
  let cityName = req.query.search_query;

  const key = process.env.WEATHER_KEY;
  const url = `http://api.weatherbit.io/v2.0/forecast/daily?city=${cityName},NC&key=${key}`;
  superagent
    .get(url)
    .then(weatData => {
      const weathArr = weatData.body.data.map(value => {
        // const wethObj = new Weather(value);
        // console.log(weathArr);
        return new Weather(value);
        // const wethObj = new Weather(weatData);
      });
      res.send(weathArr);

     
    })
    .catch(() => {
      errorHandler(`Error`, req, res);
    });
    console.log(weathArr);
}

function parkHandler(req, res) {
  // https://developer.nps.gov/api/v1/parks?parkCode=acad&api_key=wNBehwNfBlbKWvhCgiCjwV5ZFDSTLmCwwbxfVgqd

  let key = process.env.PARK_KEY;
  let url = `https://developer.nps.gov/api/v1/parks?parkCode=acad&api_key=${key}`;
  superagent
    .get(url)
    .then((parkData) => {
      const parkArr = parkData.body.data.map((value) => {
        const parkObj = new Park(value);
        return parkObj;
      });
      res.send(parkArr);
    })
    .catch(() => {
      errorHandler(`Error`, req, res);
    });
}


function errorHandler(errors) {
    server.use("*", (req, res) => {
      res.status(500).send(errors);
    });
  }

  
// constructors
function Location(city, locJson) {
  this.search_query = city;
  this.formatted_query = locJson.display_name;
  this.latitude = locJson.lat;
  this.longitude = locJson.lon;
}


function Weather(wethJson) {
  this.forecast = wethJson.weather.description;
  this.time = new Date(wethJson.valid_date).toDateString();
}


function Park(geoData) {
  this.name = geoData.fullName;
  this.address = `${geoData.addresses[0].line1}${geoData.addresses[0].city}${geoData.addresses[0].stateCode}${geoData.addresses[0].postalCode}`;
  this.fee = geoData.entranceFees[0].cost;
  this.description = geoData.description;
  this.url = geoData.url;
}



server.listen(PORT, () => {
  console.log(`Listening on PORT ${PORT}`);
});