import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
import firebase from "firebase/app";

const firebaseConfig = {
  apiKey: "AIzaSyCBOKh9mmgDkn_5XwJz5GcAHCfrrNqLxSk",
  authDomain: "community-88108.firebaseapp.com",
  projectId: "community-88108",
  storageBucket: "community-88108.appspot.com",
  messagingSenderId: "101055341943",
  appId: "1:101055341943:web:3ad0377dfd392f58c5ed72",
  measurementId: "G-8THN5SP9VV"
};

if (!firebase.default.apps.length) {
  firebase.default.initializeApp(firebaseConfig);
  if (process.browser) {
    firebase.default
      .firestore()
      .enablePersistence()
      .catch((err) => {
        if (err.code == "failed-precondition") {
          // Multiple tabs open, persistence can only be enabled
          // in one tab at a a time.
          // ...
        } else if (err.code == "unimplemented") {
          // The current browser does not support all of the
          // features required to enable persistence
          // ...
        }
      });
  }
}

export default firebase;
