const express = require ('express');
const path = require ('path');
const mongoose = require('mongoose');
const {check,validationResult} = require('express-validator');

var app=express();
app.use(express.urlencoded({extended:false}));

app.set('views',path.join(__dirname,'views'));
app.use(express.static(__dirname + '/public'));
app.set('view engine' , 'ejs');

//Adding sessions

var session = require('express-session');

app.use(session({
    secret:'mysecret',
    resave:false,
    saveUninitialized:true,
}));


//Connecting to MongoDB

var admin = mongoose.model('users',{
    username:String,
    password:String
})

mongoose.connect('mongodb://localhost:27017/Blog');

// Verifying the login credentials
app.post('/login',[
    check('username','Username Cannot be Empty').notEmpty(),
    check('password','Password Cannot be Empty').notEmpty()
],(req,res)=>{
    var errors = validationResult(req);
    if(!errors.isEmpty()){
        return res.render('login',{formErrors:errors.array()});
    }
    var username = req.body.username;
    var password = req.body.password;
    
    admin.findOne({username:username}).then((data)=>{
        if(data == null){
            console.log("Invalid Username");
            return res.render('login',{
                errorMessage:"Invalid Username"
            });
        }else {
            if(data.password == password){
            
            console.log("Invalid Password");
            return res.render('login',{
                errorMessage:"Invalid Password"
            });
        }else{
            console.log("Login Success");
            //Setting the session variable to display Welcome Admin Message
            req.session.isLoggedIn = true;
            return res.redirect('/admin');
        }
        }
    });
});

//Rendering the main home page

app.get('/',(req,res)=>{
    res.render('main');
});

app.get('/login',(req,res)=>{
    res.render('login');
});

//Admin Home page after login
app.get('/admin',(req,res)=>{
    res.render('success_message',{
        successMessage:"Welcome",
        successText:"Hello Admin, Welcome to the dashboard!",
        isLoggedin:req.session.isLoggedIn
    });
});

//Logout route to destroy the session
app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.redirect('/');
});

    

app.listen(8000);
console.log("Listening to port 8000");

