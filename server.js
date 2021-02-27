/* eslint-disable semi */
/* eslint-disable indent */
/* eslint-disable no-trailing-spaces */
/* eslint-disable eol-last */
/* eslint-disable no-redeclare */
/* eslint-disable no-undef */
/* eslint-disable quotes */
"use strict";
// Application Dependencies

const express = require("express");
const cors = require("cors");
require("dotenv").config();
const superagent = require("superagent");
const pg = require("pg");



// Application Setup
const PORT = process.env.PORT || 3000;
const server = express();
server.use(cors());
const client = new pg.Client({ 
  connectionString: process.env.DATABASE_URL
});


// Route Definitions
server.get('/location', locationHandler);
server.get('/weather', weatherHandler);
server.get('/parks', parkHandler);
server.get('/movies', movieHandler);
server.get('/yelp', yelpHandler);
server.get('/*', errorHandler);
// server.use(handleError);

function locationHandler(req, res) {
  const cityName = req.query.city;
  let SQL = `SELECT * FROM locations WHERE search_query = '${cityName}';`;
  
  // url : https://eu1.locationiq.com/v1/search.php?key=YOUR_ACCESS_TOKEN&q=SEARCH_STRING&format=json
  

  let key = process.env.LOCATION_KEY;
  let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json `;
  client.query(SQL).then (result =>
    {
      if(result.rows.length === 0)
      {
        superagent.get(url)
        .then((locData) => {
          const locObj = new Location(cityName, locData.body[0]);
          const insQuery = 'INSERT INTO locations (search_query, formatted_query, latitude, longitude)  VALUES ($1,$2,$3,$4) RETURNING *;';
          let Val = [cityName, locObj.formatted_query , locObj.latitude , locObj.longitude];
          client.query(insQuery , Val)
          .then ((LocReturn) =>
          {
           console.log(LocReturn.rows[0]);
            res.json(LocReturn.rows[0]);
          })
          .catch(() => {
            errorHandler(`Error`, req, res);
          })
          
          
        })
        .catch(() => {
          errorHandler(`Error`, req, res);
        })
      }

      else if(result.rows[0].search_query === cityName)
      {
        const ObjReturn = new Location(result.rows[0].search_query, result.rows[0]);
        res.json(ObjReturn);
      }
    })
 
    .catch(() => {
      errorHandler(`Error`, req, res);
    })
    
}


function weatherHandler(req, res) {
 
  let cityName = req.query.search_query;

  const key = process.env.WEATHER_KEY;
  const url = `http://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`;
  let weathArr;
  superagent
    .get(url)
    .then(weatData => {
      weathArr = weatData.body.data.map(value => {
        // const wethObj = new Weather(value);
        // console.log(weathArr);
        return new Weather(value);
        // const wethObj = new Weather(weatData);
      })
      res.send(weathArr);

     
    })
    .catch(() => {
      errorHandler(`Error`, req, res);
    })
   
}

function parkHandler(req, res) {
  
  let key = process.env.PARK_KEY;
  let ParkString = req.query.latitude + ',' + req.query.longitude;
  let url = `https://developer.nps.gov/api/v1/parks?parkCode=${ParkString}&limit=3&api_key=${key}`;
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
    })
}


function movieHandler(req,res)
{
  let cityName = req.query.search_query;

  const key = process.env.MOVIE_API_KEY;
  const url = `https://api.themoviedb.org/3/search/movie?api_key=${key}&query=${cityName}`;
  //https://api.themoviedb.org/3/movie/550?api_key=017d3fc6b24135df056b8d42bdc41218
  
  superagent
    .get(url)
    .then(MovData => {
     let MovArr = MovData.body.results.map(value => {
        return new Movie(value);
      })
      res.send(MovArr);

     
    })
    .catch(() => { 
      errorHandler(`Error`, req, res);
    })
   
}



function yelpHandler(req,res)
{
  let cityName = req.query.search_query;
  const page = req.query.page;
  let limit = 5;
  const key = process.env.YELP_API_KEY;
  const offset = ((page - 1) * limit + 1);
  const url = `https://api.yelp.com/v3/businesses/search?location=${cityName}&limit=${limit}&offset=${offset}`;
  
  
  superagent.get(url)
    .set("Authorization", `Bearer ${key}`)
    .then(yelData => {
     let yelArr = yelData.body.businesses.map(value => {
        return new Yelp(value);
      })
      res.send(yelArr);

     
    })
    .catch(() => { 
      errorHandler(`Error`, req, res);
    })
   
}


function errorHandler(errors) {
    server.use("*", (req, res) => {
      res.status(500).send(errors);
    })
  }


// constructors
function Location(city, locJson) {
  this.search_query = city;
  this.formatted_query = locJson.display_name ||locJson.formatted_query ;
  this.latitude = locJson.lat || locJson.latitude;
  this.longitude = locJson.lon || locJson.longitude;

  // this.formatted_query = locJson.display_name  ;
  // this.latitude = locJson.lat ;
  // this.longitude = locJson.lon ;
}


function Weather(wethJson) {
  this.forecast = wethJson.weather.description;
  this.time = new Date(wethJson.valid_date).toDateString();
}


function Park(geoData) {
  this.name = geoData.fullName;
  this.address = `"${geoData.addresses[0].line1}" "${geoData.addresses[0].city}" "${geoData.addresses[0].stateCode}" "${geoData.addresses[0].postalCode}"`;
  this.fee = geoData.entranceFees[0].cost;
  this.description = geoData.description;
  this.url = geoData.url;
}

function Movie(MoData)
{
  this.title = MoData.title;
  this.overview = MoData.overview;
  this.popularity = MoData.popularity;
  this.total_votes = MoData.total_votes;
  this.image_url = `https://image.tmdb.org/t/p/w500/${MoData.poster_path}`;
  this.released_on = MoData.released_on;
  this.average_votes = MoData.average_votes;
  
}


function Yelp(YelpData) {
  this.url = YelpData.url;
  this.name = YelpData.name;
  this.price = YelpData.price;
  this.rating = YelpData.rating;
  this.image_url = YelpData.image_url;
};

// server.listen(PORT, () => {
//   console.log(`Listening on PORT ${PORT}`);
// });

client.connect()
    .then(() => {
        server.listen(PORT, () => {
            console.log(`its port is ${PORT}`)
        });
    });