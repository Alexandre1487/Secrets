//jshint esversion:6

require('dotenv').config();

const express = require("express");
const bodyParser = require('body-parser');
const ejs = require("ejs");
const logger = require('morgan');
const passport = require("passport")
const LocalStrategy = require('passport-local');
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require('express-session');

const GoogleStrategy = require('passport-google-oauth20').Strategy;

const SQLiteStore = require('connect-sqlite3')(session);

const MongoDBStore = require('connect-mongodb-session')(session);

// const store = new MongoDBStore({
//     uri: 'mongodb+srv://userUser:SzH8dbzDXDazh8ZT@cluster0.zipgvvy.mongodb.net/?retryWrites=true&w=majority',
//     databaseName: 'myDb',
//     collection: 'mySessions',

//     // expiresKey: `expireskeyname`,
//     expiresAfterSeconds: 60 * 60 * 24 * 14
// });

// const indexRouter = require('./routes/register');
// const authRouter = require('./routes/auth');
// app.use('/', indexRouter);
// app.use('/', authRouter);

// AQUI FICA A LIGAÇÃO À BASE DE DADOS MONGODB
const { MongoClient, ListCollectionsCursor, MongoError } = require("mongodb");
const uri = "mongodb+srv://userUser:SzH8dbzDXDazh8ZT@cluster0.zipgvvy.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const database = client.db("userDB");
const collection = database.collection("users");

const app = express();


app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(session({
    secret: 'Our little secret',
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 7
    },
    // store: store,
    resave: true,
    saveUninitialized: true,
}));

app.use(passport.authenticate('session'));

app.use(passport.initialize());
app.use(passport.session());


passport.use(new LocalStrategy(function verify(email, password) {

    async function run() {

        const user1 = {
            email: req.body.username,
            password: hash
        };

        const user2 = await collection.findOne({ email: req.body.username });

        if (user2 === null) {
            res.send("User do not exist!")
        } else {
            if (user2) {
                bcrypt.compare(user1.password, user2.password).then(function (result) {
                    if (result == true) {
                        res.redirect("/secrets");
                    };
                });
            } else {
                if (user1.email === user2.email) {
                    res.send("Invalid Password, try again!")
                } else {
                    res.send("User do not exist!")
                }
            };
        };

    };

    run().catch(console.dir);

}));

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        cb(null, { id: user.id, email: user.email });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    // userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {

        const userG = {
            name: profile.name.givenName + " " + profile.name.familyName,
            googleId: profile.id
        };

        collection.updateOne(
            { googleId: profile.id },
            {
                $set: {
                    name: profile.name.givenName + " " + profile.name.familyName,
                    googleId: profile.id
                }
            },
            { upsert: true },
            function (err, user) {
                return cb(err, user);
            }
        );

        console.log("Successfully added ou updated a User: " + userG.name);

    },

));





// ROUTES
app.get("/", function (req, res) {
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate("google", { scope: ['profile'] }));

app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    async function (req, res) {
        res.redirect("/secrets1");
    });

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
});

app.get("/secrets", function (req, res) {

    async function run() {

        const usersSecrets = await collection.find({ "secret": { $ne: null } }).project({ secret: 1, _id: 0 }).toArray();
        console.log(usersSecrets);

        if (usersSecrets === null) {
            res.redirect("/");
        } else {
            if (usersSecrets) {
                res.render("secrets", { usersWithSecrets: usersSecrets });
            }
        }

    };

    run().catch(console.dir);

});

app.get("/secrets1", function (req, res) {

    async function run() {

        const usersSecrets = await collection.find({ "secret": { $ne: null } }).project({ secret: 1, _id: 0 }).toArray();
        console.log(usersSecrets);

        if (usersSecrets === null) {
            res.redirect("/");
        } else {
            if (usersSecrets) {
                res.render("secrets1", { usersWithSecrets: usersSecrets });
            }
        }

    };

    run().catch(console.dir);

});

app.get("/submit", function (req, res) {

    if (req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    };

});

app.get("/submit1", function (req, res) {

    if (req.isAuthenticated()) {
        res.render("submit1");
    } else {
        res.redirect("/login");
    };

});

app.get("/logout", function (req, res, next) {

    req.logout(function (err) {
        if (err) { return next(err); }
        res.redirect('/');
    });

});


app.post("/register", function (req, res) {

    bcrypt.hash(req.body.password, saltRounds).then(function (hash) {

        const newUser = {
            email: req.body.username,
            password: hash
        };

        async function run() {

            const user2 = await collection.findOne({ email: req.body.username });

            if (user2 === null) {

                collection.insertOne(newUser);

                req.login(newUser, function (err) {
                    if (err) { return next(err); }
                    return res.redirect("/secrets");
                });

                console.log("Successfully added a new User: " + newUser.email);

            } else {
                res.render("login");
            };

        };

        run().catch(console.dir);

    });

});


app.post("/login", function (req, res) {

    async function run() {

        const user1 = {
            email: req.body.username,
            password: req.body.password
        };

        const user2 = await collection.findOne({ email: req.body.username });
        
        if (user2 === null) {
            res.send("User do not exist!")
        } else {
            if (user2) {
                bcrypt.compare(req.body.password, user2.password).then(function (result) {
                    if (result == true) {
                        req.login(user1, function (err) {
                            if (err) { return next(err); }
                            return res.redirect("/secrets");
                        });
                    } else {
                        if (req.body.username === user2.email) {
                            res.send("Invalid Password, try again!")
                        } else {
                            res.send("User do not exist!")
                        }
                    };
                });
            };
        };

    };

    run().catch(console.dir);

});

app.post("/submit", function (req, res) {

    const submittedSecret = req.body.secret;

    const userLogged = {
        email: req.user,
        secret: req.body.secret
    };

    async function run() {

        const userDB = await collection.findOne({ email: req.user.email });

        if (userDB === null) {
            res.redirect("/");
        } else {

            collection.updateOne(
                { email: req.user.email },
                {
                    $set: {
                        secret: submittedSecret
                    }
                },
            );

            res.redirect("/secrets");
        }

        console.log(userLogged);

    };

    run().catch(console.dir);

});

app.post("/submit1", function (req, res) {

    const submittedSecret = req.body.secret;

    const userLogged = {
        googleId: profile.id,
        secret: req.body.secret
    };

    async function run() {

        const userDB = await collection.findOne({ googleId: profile.id });

        if (userDB === null) {
            res.redirect("/");
        } else {

            collection.updateOne(
                { googleId: profile.id },
                {
                    $set: {
                        secret: submittedSecret
                    }
                },
            );

            res.redirect("/secrets1");
        }

        console.log(userLogged);

    };

    run().catch(console.dir);

});




//SERVIDOR
app.listen(process.env.PORT || 3000, function () {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});