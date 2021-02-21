/* eslint-disable no-redeclare */
/* eslint-disable eol-last */
/* eslint-disable no-unused-vars */
/* eslint-disable semi */
/* eslint-disable no-trailing-spaces */
/* eslint-disable indent */
/* eslint-disable no-undef */
'use strict';

const express = require('express');
require('dotenv').config();

const cors =  require('cors');

const server = express(); 
server.use(cors());

const PORT = process.env.PORT || 3030;

server.get('/',(req,res)=>{
    res.send('home route');
})

server.get('/test' , (req, res) =>
{
    res.send('The server is working');
})


server.get('/location' , (req,res) =>
{
    const LocData = require('./data/location.json');
    // console.log(LocData);
    const LocObj = new Location(LocData);
    res.send(LocObj);
})

function Location(LocInfo)
{
    this.search_query = 'Lynnwood';
    this.formatted_query = LocInfo[0].display_name;
    this.latitude = LocInfo[0].lat;
    this.longitude = LocInfo[0].lon;
}


server.get('/weather' , (req,res) =>
{
    const WeData = require('./data/weather.json');
    const weatherArr = [];
    // const LocObj = new Location(LocData);
    // res.send(LocObj);
    WeData.data.forEach (val => 
        {
            const WeObj = new Weather(val);
            weatherArr.push(WeObj);
        })
        res.send(weatherArr);
})

function Weather(WeInfo)
{
    this.weather = WeInfo.weather.description;
    this.time = new Date(WeInfo.datetime).toDateString();

}
// // location route
// // localhost:3000/location
// server.get('/location',(req,res)=>{
//     const locData = require('./data/geo.json');
//     console.log(locData);
//     console.log(locData[0]);
//     // res.send(locData);
//     const locObj = new Location(locData);
//     console.log(locObj)
//     res.send(locObj);
    
// })

// // localhost:3000/ssss
// server.use('*',(req,res)=>{
//     res.status(404).send('route not found')
// })

// function Location (geoData) {
//     this.search_query = 'Lynnwood';
//     this.formatted_query= geoData[0].display_name;
//     this.latitude = geoData[0].lat;
//     this.longitude = geoData[0].lon;
//     // {
//     //     "search_query": "seattle",
//     //     "formatted_query": "Seattle, WA, USA",
//     //     "latitude": "47.606210",
//     //     "longitude": "-122.332071"
//     //   }
// }


server.get('*', (req, res) => {
    res.status(500).send('Page not found');
  })


server.listen(PORT, ()=>{
    console.log(`Listening on PORT ${PORT}`);
})