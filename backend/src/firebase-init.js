const firebase = require('firebase/app');
const admin = require('firebase-admin');
require('firebase/auth');
require('firebase/firestore');
require('dotenv').config();

admin.initializeApp({
  credential: admin.credential.cert({
    type: process.env.GOOGLE_CREDENTIALS_TYPE,
    project_id: process.env.GOOGLE_CREDENTIALS_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CREDENTIALS_PRIVATE_KEY.replace(/\\n/g, '\n'),
    client_email: process.env.GOOGLE_CREDENTIALS_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CREDENTIALS_CLIENT_ID,
    auth_uri: process.env.GOOGLE_CREDENTIALS_AUTH_URI,
    token_uri: process.env.GOOGLE_CREDENTIALS_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_CREDENTIALS_AUTH_PROVIDER_X509_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CREDENTIALS_CLIENT_X509_CERT_URL,
  }),
});

const firebaseConfig = {
  apiKey: "AIzaSyCBOKh9mmgDkn_5XwJz5GcAHCfrrNqLxSk",
  authDomain: "community-88108.firebaseapp.com",
  projectId: "community-88108",
  storageBucket: "community-88108.appspot.com",
  messagingSenderId: "101055341943",
  appId: "1:101055341943:web:5553e7965377a43dc5ed72",
  measurementId: "G-WFBZESNTHS"
};

firebase.initializeApp(firebaseConfig);

module.exports = { firebase, admin };
