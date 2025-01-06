// env var
require('dotenv').config()
const express = require('express') 
const jwt = require('jsonwebtoken') 
const cors = require('cors') 
const { createClient } = require('@supabase/supabase-js');

// const passport = require('passport') 
// const GoogleStrategy = require('passport-google-oauth20').Strategy

const app = express() 
app.use(express.json())

// Configura il middleware cors
app.use(cors({
  origin: ['http://localhost:5173', 'https://mapis.surge.sh', 'https://mapis_beta.surge.sh'],  // Permetti l'accesso al frontend (React app)
  methods: ['GET', 'POST', 'OPTIONS'],
}));


//if false, logs in the console won't be printed
const DEBUG = false 
if(!DEBUG)
    console.debug = function() {}

const port = process.env.PORT
const ip_address = process.env.IP_ADDRESS
const jwt_secret = process.env.JWT_SECRET
const client_id = process.env.GOOGLE_ID_CLIENT
const client_secret = process.env.GOOGLE_CLIENT_SECRET
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

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

const getUserId = async (email) => {
  const { data, error } = await supabase
  .from('user')
  .select()
  .eq('email', email)

  return error ? null : data[0].id
}

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

app.post('/api/db/add_user', async (req, res) => {
  let email = req.body.email;

  const { data, error } = await supabase
  .from('user')
  .upsert([
    { email: email }
  ], { onConflict: 'email' })
  .select();

  if (error) {
    console.debug("add_user error:", error)
    res.status(400).send({ response: error }) 
  }
  else {
    console.debug("add_user data:", data)
    res.status(200).json({ response: data[0] })
  }
})

app.post('/api/db/add_marker', async (req, res) => {
  let user = req.body.user;
  let type = req.body.type;
  let description = req.body.description;
  let lat = req.body.lat;
  let lng = req.body.lng;

  const { data, error } = await supabase
  .from('marker')
  .insert([
    { user: user, type: type, description, description, lat: lat, lng: lng }
  ])
  .select();

  if (error) {
    console.debug("add_marker error:", error)
    res.status(400).send({ response: error }) 
  }
  else {
    console.debug("add_marker data:", data)
    res.status(200).json({ response: data[0] })
  }
}) 

app.post('/api/db/get_user_markers', async (req, res) => {
  let email = req.body.email;
  
  let userId = await getUserId(email)

  const { data, error } = await supabase
  .from('marker')
  .select()
  .eq('user', userId)

  if (error) {
    console.debug("get_user_markers error:", error)
    res.status(400).send({ response: error }) 
  }
  else {
    console.debug("get_user_markers data:", data)
    res.status(200).json({ response: data })
  }
})

app.listen(port, ip_address, () => {
  console.log(`Server is running on ${ip_address} at port ${port} \n`) 
}) 