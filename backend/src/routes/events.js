const express = require('express');
const geofire = require('geofire-common');
const { firebase } = require('../firebase-init.js');

const db = firebase.firestore();

async function handleEvent(req, res) {
  const { lat, lng, eventData } = req.body;
  if (!lat || !lng || !eventData) {
    return res.status(400).send('Insufficient info');
  }
  // TODO: Add data validation
  const eventDoc = {
    eventData,
    locationHash: geofire.geohashForLocation([lat, lng]),
    lat,
    lng,
    ts: firebase.firestore.FieldValue.serverTimestamp(),
  };
  const result = await firebase.firestore().collection('eventEntries').add(eventDoc);

  return firebase.firestore().collection('user_metadata')
    .doc(req.locals.user.email)
    .collection('event_entries')
    .doc(result.id)
    .set(eventDoc)
    .then(() => res.status(200).send(result.id)).catch((e) => res.status(500).send(e));
}

async function searchNearbyEvents(req, res) {
  let { lat, lng, radius } = req.query;
  console.log(req.query);
  // TODO: Add data validation
  if (!lat || !lng) {
    return res.status(400).send('Insufficient info');
  }
  lat = Number(lat);
  lng = Number(lng);
  const metersIn25Miles = 40000;

  if (isNaN(lat) || isNaN(lng) || (radius && isNaN(Number(radius)))) {
    radius = radius ? Number(radius) * 1609 : metersIn25Miles;
    return res.status(400).send('Invalid location');
  }

  const center = [lat, lng];
  const bounds = geofire.geohashQueryBounds(center, radius);
  const promises = bounds.map((b) => {
    return firebase.firestore()
      .collection('eventEntries')
      .orderBy('locationHash')
      .startAt(b[0])
      .endAt(b[1])
      .get();
  });
  const snapshots = await Promise.all(promises);
  const matchingDocs = snapshots.flatMap((snap) => snap.docs.reduce((result, doc) => {
    const dCenter = [doc.get('lat'), doc.get('lng')];
    const distInKm = geofire.distanceBetween(dCenter, center);
    if (distInKm <= radius) {
      eventDoc = doc.data();
      // delete eventDoc.ts;
      result.push(eventDoc);
    }
    return result;
  }, []));
  return res.status(200).send(matchingDocs);
}

function getEventRoutes() {
  const router = express.Router();
  router.post('/', handleEvent);
  router.get('/nearby', searchNearbyEvents);
  return router;
}

module.exports = { handleEvent, searchNearbyEvents, getEventRoutes };
