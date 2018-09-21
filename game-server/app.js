var express = require("express");
var app = express();

var mongoose = require("mongoose");
mongoose.Promise = global.Promise;

// Connects to the leaderboard in mongodb
// mongoose.connect(process.env.DATABASE_URL);
mongoose.connect("mongodb://localhost:27017/leaderboard");

var nameSchema = new mongoose.Schema({
    user: String,
    score: Number
}, 
{ 
    versionKey: false    // hide the __v field
});

var User = mongoose.model("User", nameSchema);

var bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(function(req, res, next) {
    // enable cors
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Post high score to the database
app.post("/addscore", (req, res, next) => {
    var myData = new User(req.body);
    myData.save()
    .then(item => {
        res.send("High score is saved to database");
    })
.catch(err => {
        res.status(400).send("Unable to save high score to database");
    });
});

// Returns a form for saving scores manually
app.get("/", (req, res, next) => {
    res.sendFile(__dirname + "/index.html");
});

// Returns the entire leaderboard
app.get('/leaderboard', function(req, res, next) {    
    User.find({}, function (err, leaderboard) {
        res.send(leaderboard);
    });
});

// Returns the entire dictionary
app.get('/words', function(req, res, next) {   
    var difficulty = req.query.difficulty;  
    res.sendFile(__dirname + "/data/dictionary" + difficulty + ".txt");
});

// Serve app in port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Our app is running on port ${ PORT }`);
});