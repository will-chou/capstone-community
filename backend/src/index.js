/* eslint-disable no-console */

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
const path = require('path')

const { getRoutes, getExternalRoutes } = require('./routes/index.js');
const redisClient = require('./redis-client');

function handleTerminate(server) {
  async function exitHandler(options = {}) {
    redisClient.quit();
    await server
      .close()
      .then(() => {
        console.log('Server successfully closed');
      })
      .catch((e) => {
        console.log('Something went wrong closing the server: ', e);
      });
    if (options.exit) process.exit();
  }
  process.on('exit', exitHandler);
  process.on('SIGINT', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR1', exitHandler.bind(null, { exit: true }));
  process.on('SIGUSR2', exitHandler.bind(null, { exit: true }));
  process.on('uncaughtException', (error) => {
    console.log('Uncaught exception: ', error);
    exitHandler({ exit: true });
  });
}

function debug(req, res, next) {
  console.log(req.route && req.route.path);
  console.log(req.headers);
  console.log(req.body);
  console.log();
  return next();
}

function startServer({ port = process.env.PORT || 5000 } = {}) {
  const app = express();
  app.use(cors());
  app.use(bodyParser.json());
  app.use('/api', debug, getRoutes());
  app.get('/test', debug, (req, res) => {
    res.send('test');
  });

  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../../frontend/build')))

  // AFTER defining routes: Anything that doesn't match what's above, send back index.html; (the beginning slash ('/') in the string is important!)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname + '/../../frontend/build/index.html'))
  })

  return new Promise((resolve) => {
    const server = app.listen(port, () => {
      console.log(`Listening on port ${server.address().port}`);
      const closeFunction = server.close.bind(server);
      server.close = () => new Promise((resolveClose) => {
        closeFunction(resolveClose);
      });
      handleTerminate(server);
      resolve(server);
    });
  });
}

startServer();
