import firebase from "../firebase";
import { useEffect, Fragment } from "react";
import { useAuth } from "../auth/authContext";
import {
  Row,
  Col,
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
      <Row gap={.8} style={{ height: "100vh" }}>
        <Col span={8}>
          <EventPost width={"100%"}/>
          <UserProfile />
        </Col>
        <Col span={16}>
          <EventMap />
        </Col>
      </Row>
    </Fragment>
  );
}
