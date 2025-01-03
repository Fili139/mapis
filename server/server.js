// env var
require('dotenv').config()
//l used to create and connect to mysql db
const mysql = require("mysql2")
const express = require('express') 
const jwt = require('jsonwebtoken') 
const cors = require('cors') 

// const passport = require('passport') 
// const GoogleStrategy = require('passport-google-oauth20').Strategy

const app = express() 

app.use(express.json()) 
app.use(cors()) 

//if false, logs in the console won't be printed
const DEBUG = false 
if(!DEBUG)
    console.log = function() {}

const port = process.env.PORT
const ip_address = process.env.IP_ADDRESS
const db_host = process.env.DB_HOST
const db_user = process.env.DB_USER
const db_password = process.env.DB_PASSWORD
const db_database = process.env.DB_DATABASE
const jwt_secret = process.env.JWT_SECRET
const client_id = process.env.GOOGLE_ID_CLIENT
const client_secret = process.env.GOOGLE_CLIENT_SECRET

/*
const db = mysql.createConnection({
    host: db_host,
    user: db_user,
    password: db_password,
    database: db_database,
    timezone: "Z"
})

//DB connection
db.connect(function(err) {
    if (err) throw err 
    console.log("Connected!") 
})
*/

//auxiliar f used to check if a query fails without crashing the server
const checkQueryErr = (err, res) => {
  if (err) {             
    console.debug("QUERY ERROR, Non blocking error:", err);
    res.status(400).send({ response: err }) 

    return true;
  }
  
  return false;
}

const pool = mysql.createPool({
  host: db_host,
  user: db_user,
  password: db_password,
  database: db_database,
  waitForConnections: true,
  connectionLimit: 10,
  //maxIdle: 10, // max idle connections, the default value is the same as `connectionLimit`
  //idleTimeout: 60000, // idle connections timeout, in milliseconds, the default value 60000
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  timezone: 'Z',
  charset: 'utf8mb4', // For full Unicode support
});


/*
// Initialize Passport.js
passport.use(
    new GoogleStrategy(
      {
        clientID: client_id,
        clientSecret: client_secret,
        callbackURL: 'http://localhost:5000/auth/google/callback',
      },
      (accessToken, refreshToken, profile, done) => {
        console.debug("in passport use - at:", accessToken, "rt:", refreshToken, "profile:", profile)
        // You can store the profile information (e.g., user ID) in a DB here.
        return done(null, profile) 
      }
    )
  ) 
  
  passport.serializeUser((user, done) => done(null, user)) 
  passport.deserializeUser((user, done) => done(null, user)) 
*/

app.post('/api/auth/login', (req, res) => {
    const { token } = req.body 

    if (!token)
        return res.status(400).send('No token provided') 

    // Verify the Google token using Google's OAuth2.0 API
    const { OAuth2Client } = require('google-auth-library') 
    const client = new OAuth2Client(client_id) 

    async function verify() {
        const ticket = await client.verifyIdToken({
        idToken: token,
        audience: client_id,
        }) 

        const payload = ticket.getPayload() 
        console.debug('Google login success for:', payload.email) 

        // Create JWT token to send back to frontend
        const jwtToken = jwt.sign(payload, jwt_secret /*,{ expiresIn: payload.exp }*/)  // sus da controlalre, prima era '1h' ma dava errore
        res.status(200).json({ token: jwtToken, email: payload.email }) 
    }

    verify().catch((error) => {
        console.error('Error verifying token:', error) 
        res.status(400).send('Invalid token') 
    }) 
})

app.post('/api/db/add_user', (req, res) => {
  let email = req.body.email;

  let add_user = `INSERT INTO user (email) VALUES (?) ON DUPLICATE KEY UPDATE email=VALUES(email), ts_update=CURRENT_TIMESTAMP;`;
  pool.execute(add_user, [email], function (err, result) {
    if (checkQueryErr(err, res))
      return;

    res.status(200).json({ response: result })
  });
})

app.post('/api/db/add_marker', (req, res) => {
  let user = req.body.user;
  let type = req.body.type;
  let lat = req.body.lat;
  let lng = req.body.lng;

  let add_user = `INSERT INTO marker (user, type, lat, lng) VALUES (?, ?, ?, ?);`;
  pool.execute(add_user, [user, type, lat, lng], function (err, result) {
    if (checkQueryErr(err, res))
      return;

    res.status(200).json({ response: result })
  });
}) 

app.post('/api/db/get_user_markers', (req, res) => {
  let email = req.body.email;
  
  let get_user_markers = `SELECT * FROM marker as m JOIN user as u ON u.id=m.user WHERE u.email=?`;
  pool.execute(get_user_markers, [email], function (err, result) {
    if (checkQueryErr(err, res))
      return;

    res.status(200).json({ response: result })
  });
})

app.listen(port, ip_address, () => {
  console.debug(`Server is running on ${ip_address} at port ${port} \n`) 
}) 