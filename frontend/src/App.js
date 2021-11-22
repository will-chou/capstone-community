import styled from "@emotion/styled";
import firebase from "./firebase";
import { useEffect, useState, Fragment } from "react";
import {
  Button,
  Text,
  Spacer,
  GeistProvider,
  CssBaseline,
} from "@geist-ui/react";
import axios from "axios";
import { AuthProvider, useAuth } from "./auth/authContext";
import Homepage from "./components/Homepage";
import TwoFacAuth from "./components/TwoFacAuth";

const Page = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const db = firebase.firestore();

function App() {
  const { user, twilioToken, loading, signInWithGoogle, signOut } = useAuth();
  if (loading) return <Fragment />;
  window.console.log(user);
  return (
    <Page>
      {user ? (
        <Fragment>
          {twilioToken ? <Homepage></Homepage> : <TwoFacAuth></TwoFacAuth>}
          {/* <Button
            size="mini"
            onClick={() => {
              signOut();
            }}
          >
            Sign out
          </Button> */}
        </Fragment>
      ) : (
        <Fragment>
          <Text h1>Community</Text>
          <Text p>It's lit</Text>
          <Spacer y={2} />
          <Button
            onClick={() => {
              var provider = new firebase.auth.GoogleAuthProvider();
              provider.setCustomParameters({
                prompt: "select_account",
              });
              return signInWithGoogle();
            }}
          >
            Sign In
          </Button>
        </Fragment>
      )}
    </Page>
  );
}

function AppWrapper() {
  return (
    <GeistProvider>
      <CssBaseline />
      <AuthProvider>
        <App />
      </AuthProvider>
    </GeistProvider>
  );
}

export default AppWrapper;
