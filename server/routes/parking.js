const express = require('express');
const router = express.Router();
const serv= require('../services/parkingServices')

router.get('/city',(req,res)=>{
    serv.getCity(req,res);
})

module.exports=router;