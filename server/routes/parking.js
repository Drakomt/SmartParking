const express = require('express');
const router = express.Router();
const serv= require('../services/parkingServices')

router.get('/lotsbycity',(req,res)=>{
    serv.getLotsByCity(req,res);
})

router.get('/parkingsbyname',(req,res)=>{
    serv.getParkingsByName(req,res);
})

module.exports=router;