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
    res.status(200).json({ response: "not yet implemented" })  
}) 

app.post('/api/db/get_user_data', (req, res) => {
    res.status(200).json({ response: "not yet implemented" })  
}) 


app.listen(port, ip_address, () => {
  console.debug(`Server is running on ${ip_address} at port ${port} \n`) 
}) 