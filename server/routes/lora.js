const express = require('express');
const router = express.Router();
const serv= require('../services/loraServices')


router.post('/status',(req,res)=>{
    serv.getStatus(req,res);
})

module.exports=router;