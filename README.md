# Community

## Frontend

### React: Add `.env`

```
REACT_APP_DEMO_FIREBASE_API_KEY=...
REACT_APP_API_BASE_URL=http://localhost:5000 or https://capstone-community.herokuapp.com depending on if you're testing locally or with deployed server
```

### Running the web app

```
yarn install
yarn start
```

You will likely get an error on Chrome about localhost being insecure. This is because we need our localhost deployment to utilize HTTPS in order to have access to the geolocation API we use to post a song with location data. In order to bypass this error, visit chrome://flags/#allow-insecure-localhost, enable the setting, and relaunch Chrome.

## Backend

Within the backend directory

### Create a .env file in `backend`

```
FIREBASE_API_KEY=...
REDIS_URL=redis://localhost:6379 (or production domain)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_REGISTERED_NUMBER=...
SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
BASE_URL=http://localhost:5000 (or your production server domain)
GOOGLE_CREDENTIALS_TYPE=...
GOOGLE_CREDENTIALS_PROJECT_ID=...
GOOGLE_CREDENTIALS_PRIVATE_KEY_ID=...
GOOGLE_CREDENTIALS_PRIVATE_KEY=...
GOOGLE_CREDENTIALS_CLIENT_EMAIL=...
GOOGLE_CREDENTIALS_CLIENT_ID=...
GOOGLE_CREDENTIALS_AUTH_URI=...
GOOGLE_CREDENTIALS_TOKEN_URI=...
GOOGLE_CREDENTIALS_AUTH_PROVIDER_X509_CERT_URL=...
GOOGLE_CREDENTIALS_CLIENT_X509_CERT_URL=...
```

The values for the environment variables prefixed with GOOGLE_CREDENTIALS can be downloaded from firebase console.

### Running the server locally

```
brew install redis # Make sure redis is installed
yarn install
redis-server & # Start redis server in the background
yarn dev
```

### Deploying

```
heroku login # Log in to heroku
heroku git:remote -a capstone-community # Add heroku remote if not added yet
git push heroku main # Make sure heroku remote is added
```

### Linting

Using eslint-airbnb

```
yarn lint
```

Insert your own API keys or contact @will-chou for values used in production.
