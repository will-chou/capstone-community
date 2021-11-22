import {
  createContext,
  Context,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import firebase from "../firebase";
import { useStateCallback } from "../hooks";

import axios from "axios";

import { API_URL } from "../constants";

function useProvideAuth() {
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  /**
   * {
   *   phoneNumber: String
   * }
   */
  const [userData, _setUserData] = useStateCallback({});
  function mergeUserData(newData, callback = () => {}) {
    _setUserData(
      (prev) => ({ ...prev, ...newData }),
      () => {
        callback();
      }
    );
  }

  const signInWithGoogle = () => {
    setLoading(true);
    return firebase
      .auth()
      .signInWithPopup(new firebase.auth.GoogleAuthProvider())
      .catch((e) => {
        console.log(e);
        setLoading(false);
      });
  };

  const signOut = () => {
    return firebase
      .auth()
      .signOut()
      .then(() => {
        setAuth(null);
        setLoading(true);
      });
  };

  useEffect(() => {
    const twilioToken = localStorage.getItem("twilioToken");
    setTwilioToken(twilioToken);
    const unsubscribe = firebase.auth().onAuthStateChanged(async (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Twilio stuff
  const [twilioSessionId, setTwilioSessionId] = useStateCallback(null);
  const [twilioToken, setTwilioToken] = useStateCallback(null);

  /**
   * @param {string} phoneNumber
   * @returns {Promise}
   */
  const startTwilioAuthSession = () => {
    return new Promise(async (resolve, reject) => {
      const idToken = await user.getIdToken();
      axios
        .get(`${API_URL}/api/auth/init2facSession`, {
          headers: { login_token: idToken },
        })
        .then((res) => {
          if (res.status == 200) {
            // change to 2-fac screen
            setTwilioSessionId(res.data.sessionId, () => {
              resolve();
            });
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  const sendTwilioVerifCode = (code) => {
    if (!twilioSessionId) return null;
    return new Promise(async (resolve, reject) => {
      const idToken = await user.getIdToken();
      axios
        .post(
          `${API_URL}/api/auth/complete2fac`,
          { sessionId: twilioSessionId, code: code },
          { headers: { login_token: idToken } }
        )
        .then((res) => {
          if (res.status == 200) {
            // change to 2-fac screen
            setTwilioToken(res.data.token, () => {
              localStorage.setItem("twilioToken", res.data.token);
              resolve();
            });
          }
        })
        .catch((e) => {
          reject(e);
        });
    });
  };

  const getTokens = useCallback(() => {
    return new Promise(async (resolve, reject) => {
      const idToken = user ? await user.getIdToken() : null;
      const ret = {
        login_token: idToken,
        two_fac_token: twilioToken,
      };
      resolve(ret);
    });
  }, [user, twilioToken]);

  return {
    auth,
    user,
    userData,
    loading,
    twilioToken,
    mergeUserData,
    signInWithGoogle,
    signOut,
    startTwilioAuthSession,
    sendTwilioVerifCode,
    getTokens,
  };
}

const authContext = createContext({
  auth: null,
  user: null,
  userData: {},
  loading: true,
  twilioToken: null,
  mergeUserData: () => {},
  signInWithGoogle: async () => {},
  signOut: async () => {},
  startTwilioAuthSession: async () => {},
  sendTwilioVerifCode: async () => {},
  getTokens: async () => {},
});

export function AuthProvider({ children }) {
  const auth = useProvideAuth();

  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => useContext(authContext);
