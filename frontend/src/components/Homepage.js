import firebase from "../firebase";
import { useEffect, Fragment } from "react";
import { useAuth } from "../auth/authContext";
import {
  Grid,
} from "@geist-ui/react";
import UserProfile from "./UserProfile";
import EventPost from "./EventPost";
import EventMap from "./EventMap";

const db = firebase.firestore();

export default function Homepage() {
  const { getTokens } = useAuth();

  useEffect(() => {
    const init = async () => {
      const tokens = await getTokens();
    };
    init();

    return () => {};
  }, []);
  return (
    <Fragment>
      <Grid.Container gap={.8} style={{ height: "100vh" }}>
        <Grid direction={'column'} xs={8}>
          <EventPost width={"100%"}/>
          <UserProfile />
        </Grid>
        <Grid xs={16}>
          <EventMap />
        </Grid>
      </Grid.Container>
    </Fragment>
  );
}
