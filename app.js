const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const { check, validationResult } = require('express-validator');
const fileupload = require('express-fileupload');

var app = express();
app.use(express.urlencoded({ extended: false }));
app.use(fileupload());

app.set('views', path.join(__dirname, 'views'));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

// Adding sessions
var session = require('express-session');

app.use(session({
    secret: 'mysecret',
    resave: false,
    saveUninitialized: true,
}));

// Model for user details
var admin = mongoose.model('users', {
    username: String,
    password: String
});

// Model for Posts 
var Post = mongoose.model('posts', {
    title: String,
    slug: String,
    image: String,
    content: String
});

mongoose.connect('mongodb://localhost:27017/Blog');

app.get('/login', (req, res) => {
    Post.find({}).then((posts) => {
        res.render('login', {
            posts: posts,
            isLoggedin: req.session.isLoggedIn || false
        });
    }).catch((err) => {
        console.log(err);
        res.render('login', {
            posts: [],
            isLoggedin: req.session.isLoggedIn || false
        });
    });
});

// Verifying the login credentials
app.post('/login', [
    check('username', 'Username Cannot be Empty').notEmpty(),
    check('password', 'Password Cannot be Empty').notEmpty()
], (req, res) => {
    var errors = validationResult(req);
    if (!errors.isEmpty()) {
        return Post.find({}).then((posts) => {
            res.render('login', {
                formErrors: errors.array(),
                posts: posts,
                isLoggedin: req.session.isLoggedIn || false
            });
        }).catch((err) => {
            console.log(err);
            res.render('login', {
                formErrors: errors.array(),
                posts: [],
                isLoggedin: req.session.isLoggedIn || false
            });
        });
    }
    var username = req.body.username;
    var password = req.body.password;

    admin.findOne({ username: username }).then((data) => {
        if (data == null) {
            console.log("Invalid Username");
            return Post.find({}).then((posts) => {
                res.render('login', {
                    errorMessage: "Invalid Username",
                    posts: posts,
                    isLoggedin: req.session.isLoggedIn || false
                });
            }).catch((err) => {
                console.log(err);
                res.render('login', {
                    errorMessage: "Invalid Username",
                    posts: [],
                    isLoggedin: req.session.isLoggedIn || false
                });
            });
        } else {
            if (data.password != password) {
                console.log("Invalid Password");
                return Post.find({}).then((posts) => {
                    res.render('login', {
                        errorMessage: "Invalid Password",
                        posts: posts,
                        isLoggedin: req.session.isLoggedIn || false
                    });
                }).catch((err) => {
                    console.log(err);
                    res.render('login', {
                        errorMessage: "Invalid Password",
                        posts: [],
                        isLoggedin: req.session.isLoggedIn || false
                    });
                });
            } else {
                console.log("Login Success");
                // Setting the session variable to display Welcome Admin Message
                req.session.isLoggedIn = true;
                return res.redirect('/admin');
            }
        }
    }).catch((err) => {
        console.log(err);
        Post.find({}).then((posts) => {
            res.render('error', {
                errorMessage: "Error checking credentials",
                posts: posts,
                isLoggedin: req.session.isLoggedIn || false
            });
        }).catch((err) => {
            console.log(err);
            res.render('error', {
                errorMessage: "Error checking credentials",
                posts: [],
                isLoggedin: req.session.isLoggedIn || false
            });
        });
    });
});

// Rendering the main home page
app.get('/', (req, res) => {
    Post.find({}).then((posts) => {
        res.render('main', { 
            posts: posts,
            isLoggedin: req.session.isLoggedIn || false
        });
    }).catch((err) => {
        console.log(err);
        res.render('main', { 
            posts: [],
            isLoggedin: req.session.isLoggedIn || false
        });
    });
});

// Individual post page
app.get('/post/:slug', (req, res) => {
    Post.findOne({ slug: req.params.slug }).then((post) => {
        if (!post) {
            return res.render('error', {
                errorMessage: "Post not found"
            });
        }
        Post.find({}).then((posts) => {
            res.render('post', {
                post: post,
                posts: posts,
                isLoggedin: req.session.isLoggedIn || false
            });
        }).catch((err) => {
            console.log(err);
            res.render('error', {
                errorMessage: "Error loading the post"
            });
        });
    }).catch((err) => {
        console.log(err);
        res.render('error', {
            errorMessage: "Error loading the post"
        });
    });
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        req.session.isLoggedIn = true;
        return res.redirect('/admin');
    } else {
        Post.find({}).then((posts) => {
            res.render('login', {
                errorMessage: "Invalid username or password",
                posts: posts
            });
        }).catch((err) => {
            console.log(err);
            res.render('error', {
                errorMessage: "Error loading posts"
            });
        });
    }
});

// Admin Home page after login
app.get('/admin', (req, res) => {
    if (req.session.isLoggedIn) {
        Post.find({}).then((posts) => {
            res.render('success_message', {
                successMessage: "Welcome",
                successText: "Hello Admin, Welcome to the dashboard!",
                posts: posts,
                isLoggedin: req.session.isLoggedIn
            });
        }).catch((err) => {
            console.log(err);
            res.render('success_message', {
                successMessage: "Welcome",
                successText: "Hello Admin, Welcome to the dashboard!",
                posts: [],
                isLoggedin: req.session.isLoggedIn
            });
        });
    } else {
        res.redirect('/login');
    }
});

// Add new page form
app.get('/admin/add-post', (req, res) => {
    if (req.session.isLoggedIn) {
        Post.find({}).then((posts) => {
            res.render('admin/add_post', { 
                posts: posts,
                isLoggedin: req.session.isLoggedIn 
            });
        }).catch((err) => {
            console.log(err);
            res.render('admin/add_post', { 
                posts: [],
                isLoggedin: req.session.isLoggedIn 
            });
        });
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
            return Post.find({}).then((posts) => {
                res.render('admin/add_post', { 
                    formErrors: errors.array(), 
                    posts: posts,
                    isLoggedin: req.session.isLoggedIn 
                });
            });
        }

        // Handle image upload
        if (!req.files || !req.files.image) {
            return Post.find({}).then((posts) => {
                res.render('admin/add_post', {
                    errorMessage: "Image is required",
                    posts: posts,
                    isLoggedin: req.session.isLoggedIn
                });
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
                Post.find({}).then((posts) => {
                    res.render('success_message', {
                        successMessage: "Add Page",
                        successText: "You have successfully created a new page!",
                        posts: posts,
                        isLoggedin: req.session.isLoggedIn
                    });
                });
            }).catch((err) => {
                console.log(err);
                Post.find({}).then((posts) => {
                    res.render('admin/add_post', {
                        errorMessage: "Error saving the page",
                        posts: posts,
                        isLoggedin: req.session.isLoggedIn
                    });
                });
            });
        }).catch((err) => {
            console.log(err);
            Post.find({}).then((posts) => {
                res.render('admin/add_post', {
                    errorMessage: "Error uploading the image",
                    posts: posts,
                    isLoggedin: req.session.isLoggedIn
                });
            });
        });
    } else {
        res.redirect('/login');
    }
});

// List all posts for editing
app.get('/admin/posts', (req, res) => {
    if (req.session.isLoggedIn) {
        Post.find({}).then((posts) => {
            res.render('admin/posts', {
                posts: posts,
                isLoggedin: req.session.isLoggedIn
            });
        }).catch((err) => {
            console.log(err);
            res.render('admin/posts', {
                posts: [],
                isLoggedin: req.session.isLoggedIn
            });
        });
    } else {
        res.redirect('/login');
    }
});

// Delete a page
app.get('/admin/delete-post/:id', (req, res) => {
    if (req.session.isLoggedIn) {
        Post.findByIdAndDelete(req.params.id).then(() => {
            req.session.successMessage = "You have successfully deleted the page!";
            res.redirect('/admin/posts');
        }).catch((err) => {
            console.log(err);
            Post.find({}).then((posts) => {
                res.render('admin/posts', {
                    posts: posts,
                    isLoggedin: req.session.isLoggedIn,
                    errorMessage: "Error deleting the page"
                });
            });
        });
    } else {
        res.redirect('/login');
    }
});

// Edit page form
app.get('/admin/edit-post/:id', (req, res) => {
    if (req.session.isLoggedIn) {
        Post.findById(req.params.id).then((post) => {
            if (!post) {
                return Post.find({}).then((posts) => {
                    res.render('success_message', {
                        successMessage: "Error",
                        successText: "Page not found",
                        posts: posts,
                        isLoggedin: req.session.isLoggedIn
                    });
                });
            }
            Post.find({}).then((posts) => {
                res.render('admin/edit_post', {
                    post: post,
                    posts: posts,
                    isLoggedin: req.session.isLoggedIn
                });
            });
        }).catch((err) => {
            console.log(err);
            Post.find({}).then((posts) => {
                res.render('success_message', {
                    successMessage: "Error",
                    successText: "Error loading the page",
                    posts: posts,
                    isLoggedin: req.session.isLoggedIn
                });
            });
        });
    } else {
        res.redirect('/login');
    }
});

// Handle editing a page
app.post('/admin/edit-post/:id', [
    check('title', 'Title Cannot be Empty').notEmpty(),
    check('slug', 'Slug Cannot be Empty').notEmpty(),
    check('content', 'Content Cannot be Empty').notEmpty()
], (req, res) => {
    if (req.session.isLoggedIn) {
        var errors = validationResult(req);
        if (!errors.isEmpty()) {
            return Post.findById(req.params.id).then((post) => {
                Post.find({}).then((posts) => {
                    res.render('admin/edit_post', {
                        post: post,
                        formErrors: errors.array(),
                        posts: posts,
                        isLoggedin: req.session.isLoggedIn
                    });
                });
            });
        }

        // Prepare update data
        var updateData = {
            title: req.body.title,
            slug: req.body.slug,
            content: req.body.content
        };

        // Handle image upload if a new image is provided
        if (req.files && req.files.image) {
            var image = req.files.image;
            var imageName = image.name;
            var imagePath = 'public/uploads/' + imageName;

            image.mv(imagePath).then(() => {
                console.log("Image Upload Successful");
                updateData.image = '/uploads/' + imageName;
                Post.findByIdAndUpdate(req.params.id, updateData).then(() => {
                    Post.find({}).then((posts) => {
                        res.render('success_message', {
                            successMessage: "Edit Page",
                            successText: "You have successfully updated the page!",
                            posts: posts,
                            isLoggedin: req.session.isLoggedIn
                        });
                    });
                }).catch((err) => {
                    console.log(err);
                    Post.find({}).then((posts) => {
                        res.render('admin/edit_post', {
                            post: { _id: req.params.id, ...req.body },
                            errorMessage: "Error updating the page",
                            posts: posts,
                            isLoggedin: req.session.isLoggedIn
                        });
                    });
                });
            }).catch((err) => {
                console.log(err);
                Post.find({}).then((posts) => {
                    res.render('admin/edit_post', {
                        post: { _id: req.params.id, ...req.body },
                        errorMessage: "Error uploading the image",
                        posts: posts,
                        isLoggedin: req.session.isLoggedIn
                    });
                });
            });
        } else {
            // Update the post without changing the image
            Post.findByIdAndUpdate(req.params.id, updateData).then(() => {
                Post.find({}).then((posts) => {
                    res.render('success_message', {
                        successMessage: "Edit Page",
                        successText: "You have successfully updated the page!",
                        posts: posts,
                        isLoggedin: req.session.isLoggedIn
                    });
                });
            }).catch((err) => {
                console.log(err);
                Post.find({}).then((posts) => {
                    res.render('admin/edit_post', {
                        post: { _id: req.params.id, ...req.body },
                        errorMessage: "Error updating the page",
                        posts: posts,
                        isLoggedin: req.session.isLoggedIn
                    });
                });
            });
        }
    } else {
        res.redirect('/login');
    }
});

// Logout route to destroy the session
app.get('/logout', (req, res) => {
    req.session.destroy();
    Post.find({}).then((posts) => {
        res.render('success_message', {
            successMessage: "Logout",
            successText: "You have successfully logged out!",
            posts: posts,
            loggedOut: "Yes"
        });
    }).catch((err) => {
        console.log(err);
        res.render('success_message', {
            successMessage: "Logout",
            successText: "You have successfully logged out!",
            posts: [],
            loggedOut: "Yes"
        });
    });
});

app.get('/home', (req, res) => {
    Post.find({}).then((posts) => {
        res.render('main', { 
            posts: posts,
            isLoggedin: req.session.isLoggedIn || false
        });
    }).catch((err) => {
        console.log(err);
        res.render('main', { 
            posts: [],
            isLoggedin: req.session.isLoggedIn || false
        });
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
    var titles = ['About', 'Team', 'Contact','Recipes for a Healthy Lifestyle'];
    var slugs = ['about', 'team', 'contact','recipes-for-a-healthy-lifestyle'];
    var images = ['about.jpg', 'team.jpg', 'contact.jpg','recipe.jpg'];
    var contents = [
        'Learn more about Kitchen Chronicles and our mission to share culinary stories.',
        'Meet the team behind Kitchen Chronicles, passionate food enthusiasts.',
        'Get in touch with us for any inquiries or feedback.',
        '<p>Eating healthy doesnt have to be boring! At Kitchen Chronicles, we believe in creating delicious meals that nourish your body and soul. Here are some of our favorite recipes to inspire a healthier lifestyle:</p><h3>Avocado Toast with a Twist</h3><p>Swap out the usual toppings with a sprinkle of chia seeds and a drizzle of lemon-tahini dressing for a nutrient-packed breakfast.</p><h3>Quinoa Salad Bowl</h3><p>Mix quinoa with roasted veggies, feta cheese, and a zesty olive oil dressing for a satisfying lunch that keeps you energized.</p><p>Explore more recipes on our blog and share your own healthy creations with us!</p>'
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

app.listen(8000);
console.log("Listening to port 8000");