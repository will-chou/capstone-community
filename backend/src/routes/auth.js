/* eslint-disable no-console */

const express = require('express');
const { uuid } = require('uuidv4');
const { firebase, admin } = require('../firebase-init.js');
const client = require('../twilio-init.js');

const db = firebase.firestore();
require('dotenv').config();

/*
-- Request Headers --
login_token: generated on client-side via firebase.auth().currentUser.getIdToken(true)
two_fac_token: received from this server after passing 2-fac

Parse the login token via Firebase Admin API. Get the email. Get the two-fac token
associated with this email in 2fac db. Check that this two-fac token matches the
two-fac token received in the headers. If all's well, user checks out, and we set the
request.user_email property so downstream handlers know who is making the request.
*/
async function firebaseAuthMiddleware(req, res, next) {
  const loginToken = req.headers.login_token;
  req.locals = req.locals || {};
  if (loginToken == null) {
    console.log('firebase token not found');
    return res.status(401).send({ error: 'Unauthorized' });
  }
  try {
    return admin
      .auth()
      .verifyIdToken(loginToken, true)
      .then((decodedToken) => {
        req.locals.user = decodedToken;
        next();
      })
      .catch(() => res.status(401).send({ error: 'Unauthorized' }));
  } catch (e) {
    console.log('could not decode token');
    return res.status(401).send({ error: 'Unauthorized' });
  }
}

async function twilioAuthMiddleware(req, res, next) {
  const twoFacToken = req.headers.two_fac_token;
  req.locals = req.locals || {};
  if (twoFacToken == null) {
    console.log('two fac token not found');
    return res.status(401).send({ error: 'Unauthorized' });
  }
  try {
    const firebaseRes = await db
      .collection('2_fac')
      .doc(req.locals.user.email)
      .get();
    const twoFacEntry = firebaseRes.data();
    if (twoFacToken === twoFacEntry.token) {
      return next();
    }
    return res.status(401).send({ error: 'Unauthorized' });
  } catch (_) {
    console.log("couldn't get a 2fac entry");
    return res.status(401).send({ error: 'Unauthorized' });
  }
}

/*

-- Request Body --
phone: Phone number

Make sure a valid 10-digit US phone number is sent in the body.
*/
async function validatePhoneForRegistrationMiddleware(req, res, next) {
  const { phone } = req.body;
  const { uid } = req.locals.user;
  const reg = new RegExp('^[0-9]{10}$');
  if (!phone || !reg.test(phone)) {
    await admin.auth().deleteUser(uid);
    return res.status(400).send({ error: 'Invalid phone number' });
  }
  req.locals.user.phone = phone;
  return next();
}

/*

POST

Register info under user (later extendable to other fields, for now it's just phone)

-- Request Body --
phone: Phone number

-- Response --
None other than 200 response status if success

Once user registers through the Firebase authentication API on the frontend,
a POST request hits this endpoint to create the corresponding user metadata
document in Firestore.
*/
async function handleRegister(req, res) {
  const { email, phone, name, picture } = req.locals.user;
  console.log(req.locals.user);
  db.collection('user_metadata').doc(email).set({
    phone,
    event_entries: [],
    name,
    picture,
  });
  return res.status(200).json({ message: 'success' });
}

/*

GET

-- Response --
sessionId or error

Check if firebase id token is valid through firebase admin API. If so,
establish a new 2-fac session by creating a new document in 2_fac with
- sessionId: uuid generated for the server and the user to keep
track of this transaction
- code: the 4-digit code the user should enter
- token: uuid generated to give to the user once they pass 2-fac auth
to authenticate into other endpoints
*/
async function handleInit2facSession(req, res) {
  try {
    const { email } = req.locals.user;
    if (!email) {
      return res.status(400).send({ error: 'Invalid token' });
    }
    const sessionId = uuid();
    /* generate code between 1000 and 9999 and stringify */
    const code = (
      Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000
    ).toString();
    /* this is the token the user will need to present in order to be fully authenticated
     * we will only hand over this token to client side when 2-factor authentication is complete
     */
    const token = uuid();
    db.collection('2_fac').doc(email).set({
      sessionId,
      code,
      token,
    });

    const firebaseRes = await db.collection('user_metadata').doc(email).get();
    const userMetadata = firebaseRes.data();
    try {
      const message = await client.messages.create({
        to: userMetadata.phone,
        from: process.env.TWILIO_REGISTERED_NUMBER,
        body: `Your community login code: ${code}`,
      });
      console.log(message.sid);
      return res.status(200).send({ sessionId });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ error });
    }
  } catch (_) {
    return res.status(400).send({ error: 'Invalid token' });
  }
}

/*
-- Request Body --
sessionId, code

-- Response --
token or error

Check if session matches existing two-factor authentication session and that
the user entered code matches the code from this login session. If we pass
these checks then return the user the token they can use to make requests
to other endpoints.
*/
async function handle2FactorAuthentication(req, res) {
  const { sessionId, code } = req.body;
  const { email } = req.locals.user;
  if (!sessionId || !code || !email) {
    return res.status(400).send({ error: 'Invalid request' });
  }
  try {
    const firebaseRes = await db.collection('2_fac').doc(email).get();
    const twoFacEntry = firebaseRes.data();
    if (sessionId === twoFacEntry.sessionId && code === twoFacEntry.code) {
      return res.status(200).send({ token: twoFacEntry.token });
    }
    return res.status(401).send({ error: 'Incorrect code' });
  } catch (_) {
    return res.status(401).send({ error: 'No session found' });
  }
}

function getAuthRoutes() {
  const router = express.Router();
  router.post(
    '/register',
    validatePhoneForRegistrationMiddleware,
    handleRegister,
  );
  router.get('/init2facSession', handleInit2facSession);
  router.post('/complete2fac', handle2FactorAuthentication);
  return router;
}
module.exports = {
  firebaseAuthMiddleware,
  twilioAuthMiddleware,
  getAuthRoutes,
};
