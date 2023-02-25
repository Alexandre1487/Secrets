//jshint esversion:6

require('dotenv').config();

const express = require("express");
const bodyParser = require('body-parser');
const ejs = require("ejs");

const mongodb = require("mongodb");

const crypto = require("crypto");

const algorithm = process.env.ALGORITHM;
const key = crypto.createHash('sha256').update(String(algorithm)).digest('base64').substr(0, 32);
const iv = crypto.randomBytes(16).toString('hex').slice(0, 16);

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


// AQUI FICA A LIGAÇÃO À BASE DE DADOS MONGODB
const { MongoClient, ListCollectionsCursor, MongoError } = require("mongodb");
const { log } = require("console");
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



    async function run() {
        const username = req.body.username;
        const password = req.body.password;

        const cipher = crypto.createCipheriv(algorithm, key, iv);
        const encryptedData = cipher.update(String(password), 'utf8', 'hex') + cipher.final('hex');

        const newUser = {
            email: username,
            password: encryptedData,
        };

        const user2 = await collection.findOne({ email: username });

        if (user2 === null) {

            collection.insertOne(newUser);

            console.log("Successfully added a new User: " + username);

            res.render("secrets");
        } else {
            res.render("login");
        };

        // const decipher = crypto.createDecipheriv(algorithm, key, iv);
        // const decryptedData = decipher.update(encryptedData, "hex", "utf-8")+decipher.final("utf-8");
        // console.log("original. " + decryptedData);
    };

    run().catch(console.dir);

});


app.post("/login", function (req, res) {

    const username = req.body.username;
    const password = req.body.password;

    const cipher = crypto.createCipheriv(algorithm, key, iv);
    const encryptedData = cipher.update(String(password), 'utf8', 'hex') + cipher.final('hex');

    const user1 = {
        email: username,
        password: encryptedData
    };

    async function run() {

        const user2 = await collection.findOne({ email: username });

        if (user2 === null) {
            res.send("User do not exist!")
        } else {
            if (user1.password === user2.password) {
                res.render("secrets");
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