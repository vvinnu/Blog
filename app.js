const express = require ('express');
const path = require ('path');
const mongoose = require('mongoose');
const {check,validationResult} = require('express-validator');

var app=express();
app.use(express.urlencoded({extended:false}));

app.set('views',path.join(__dirname,'views'));
app.use(express.static(__dirname + '/public'));
app.set('view engine' , 'ejs');

//Rendering the main home page

app.get('/',(req,res)=>{
    res.render('main');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

app.listen(8000);
console.log("Listening to port 8000");