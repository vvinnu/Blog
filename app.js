const express = require ('express');
const path = require ('path');
const mongoose = require('mongoose');
const {check,validationResult} = require('express-validator');
const fileupload = require('express-fileupload');

var app=express();
app.use(express.urlencoded({extended:false}));
app.use(fileupload());

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
});

// Model for Posts 
var Post = mongoose.model('posts', {
    title: String,
    slug: String,
    image: String,
    content: String
});

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
            if(data.password != password){
            
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

app.get('/', (req, res) => {
    Post.find({}).then((posts) => {
        res.render('main', { posts: posts });
    }).catch((err) => {
        console.log(err);
        res.render('main', { posts: [] });
    });
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

// Add new page form
app.get('/admin/add-post', (req, res) => {
    if (req.session.isLoggedIn) {
        res.render('admin/add_post', { isLoggedin: req.session.isLoggedIn });
    } else {
        res.redirect('/login');
    }
});

// Handle adding a new page
app.post('/admin/add-post', [
    check('title', 'Title Cannot be Empty').notEmpty(),
    check('slug', 'Slug Cannot be Empty').notEmpty(),
    check('content', 'Content Cannot be Empty').notEmpty()
], (req, res) => {
    if (req.session.isLoggedIn) {
        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.render('admin/add_post', { 
                formErrors: errors.array(), 
                isLoggedin: req.session.isLoggedIn 
            });
        }

        // Handle image upload
        if (!req.files || !req.files.image) {
            return res.render('admin/add_post', {
                errorMessage: "Image is required",
                isLoggedin: req.session.isLoggedIn
            });
        }

        var image = req.files.image;
        var imageName = image.name;
        var imagePath = 'public/uploads/' + imageName;

        image.mv(imagePath).then(() => {
            console.log("Image Upload Successful");
            
            // Create new post
            var newPost = new Post({
                title: req.body.title,
                slug: req.body.slug,
                image: '/uploads/' + imageName,
                content: req.body.content
            });

            newPost.save().then(() => {
                res.render('success_message', {
                    successMessage: "Add Page",
                    successText: "You have successfully created a new page!",
                    isLoggedin: req.session.isLoggedIn
                });
            }).catch((err) => {
                console.log(err);
                res.render('admin/add_post', {
                    errorMessage: "Error saving the page",
                    isLoggedin: req.session.isLoggedIn
                });
            });
        }).catch((err) => {
            console.log(err);
            res.render('admin/add_post', {
                errorMessage: "Error uploading the image",
                isLoggedin: req.session.isLoggedIn
            });
        });
    } else {
        res.redirect('/login');
    }
});

//Logout route to destroy the session
app.get('/logout',(req,res)=>{
    req.session.destroy();
    res.render('success_message',{
        successMessage:"Logout",
        successText:"You have successfully logged out!",
        loggedOut:"Yes"
    });
});

app.get('/home', (req, res) => {
    Post.find({}).then((posts) => {
        res.render('main', { posts: posts });
    }).catch((err) => {
        console.log(err);
        res.render('main', { posts: [] });
    });
});

// Setup route to populate the database with sample data
app.get('/setup', (req, res) => {
    // Sample admin data
    let adminData = [{
        'username': 'admin',
        'password': 'admin123'
    }];

    admin.collection.insertMany(adminData);

    // Sample posts data
    var titles = ['About', 'Team', 'Contact'];
    var slugs = ['about', 'team', 'contact'];
    var images = ['about.jpg', 'team.jpg', 'contact.jpg'];
    var contents = [
        'Learn more about Kitchen Chronicles and our mission to share culinary stories.',
        'Meet the team behind Kitchen Chronicles, passionate food enthusiasts.',
        'Get in touch with us for any inquiries or feedback.'
    ];

    let postData = [];

    for (let i = 0; i < titles.length; i++) {
        let tempPost = {
            title: titles[i],
            slug: slugs[i],
            image: '/uploads/' + images[i],
            content: contents[i]
        };
        postData.push(tempPost);
    }

    Post.collection.insertMany(postData);
    res.send('Database setup complete. You can now proceed with your project.');
});

// Database setup code end
    

app.listen(8000);
console.log("Listening to port 8000");

