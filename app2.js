//jshint esversion:6

const express = require("express");
const bodyParser = require('body-parser');
const ejs = require("ejs");
const md5 = require("md5");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// AQUI FICA A LIGAÇÃO À BASE DE DADOS MONGODB
const { MongoClient, ListCollectionsCursor, MongoError } = require("mongodb");
const uri = "mongodb+srv://userUser:SzH8dbzDXDazh8ZT@cluster0.zipgvvy.mongodb.net/?retryWrites=true&w=majority";
const client = new MongoClient(uri);

const database = client.db("userDB");
const collection = database.collection("users");


// ROUTES
app.get("/", function (req, res) {
    res.render("home");
});

app.get("/login", function (req, res) {
    res.render("login");
});

app.get("/register", function (req, res) {
    res.render("register");
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

                console.log("Successfully added a new User: " + req.body.username);

                res.render("secrets");
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
                        res.render("secrets");
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

});




//SERVIDOR
app.listen(process.env.PORT || 3000, function () {
    console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});