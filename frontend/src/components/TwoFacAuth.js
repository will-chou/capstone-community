import styled from "@emotion/styled";
import firebase from "../firebase";
import { useEffect, useState, Fragment } from "react";
import { useAuth } from "../auth/authContext";
import {
  Button,
  Text,
  Spacer,
  Grid,
  Input,
  Card,
} from "@geist-ui/react";
import axios from "axios";
import _ from "lodash";
import { API_URL } from "../constants";

const db = firebase.firestore();

const STAGES = {
  DEFAULT: 0,
  ENTER_PHONE_NUMBER: 1,
  ENTER_VERIF_CODE: 2,
};

const CenteringContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

function EnterPhoneNumberStage({ onNext = () => {} }) {
  const { user, mergeUserData, sendTwilioVerifCode, startTwilioAuthSession } =
    useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loadingPhoneNumber, setLoadingPhoneNumber] = useState(true);
  const [loadingSubmit, setLoadingSubmit] = useState(false);

  useEffect(() => {
    // @TODO: Use a backend GET rote to get user metadata
    db.collection("user_metadata")
      .doc(user.email)
      .get()
      .then((doc) => {
        setLoadingPhoneNumber(false);
        if (!doc.exists) {
          return;
        }
        const data = doc.data();
        mergeUserData(data, () => {
          if (data.phone) {
            onNext();
          }
        });
      }).catch(e => {
        console.log(e);
      });
    return () => {};
  }, []);

  if (loadingPhoneNumber) return <Fragment></Fragment>;
  return (
    <CenteringContainer>
      <Card>
        <Text h2>Enter phone number</Text>
        <Text p>
          We'll send you a verification code for two-factor authentication.
        </Text>
        <Grid.Container align="middle">
          <Grid>
            <Input
              size="large"
              placeholder="Phone Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            ></Input>
          </Grid>
          <Spacer x={0.5} />
          <Grid>
            <Button
              type="secondary"
              auto
              onClick={() => {
                mergeUserData({ phone: phoneNumber }, async () => {
                  setLoadingSubmit(true);
                  const idToken = await user.getIdToken();
                  axios
                    .post(
                      `${API_URL}/api/auth/register`,
                      { phone: phoneNumber },
                      { headers: { login_token: idToken } }
                    )
                    .then(() => {
                      setLoadingSubmit(false);
                      onNext();
                    });
                });
              }}
            >
              Submit
            </Button>
          </Grid>
        </Grid.Container>
      </Card>
    </CenteringContainer>
  );
}

const formatPhoneNumber = (phoneNumber) => {
  // convert the raw number to (xxx) xxx-xxx format
  const x =
    phoneNumber &&
    phoneNumber.replace(/\D/g, "").match(/(\d{0,3})(\d{0,3})(\d{0,4})/);
  return !x[2] ? x[1] : `(${x[1]}) ${x[2]}${x[3] ? `-${x[3]}` : ""}`;
};

function EnterVerifCodeStage({ onNext = () => {} }) {
  const { userData, sendTwilioVerifCode, startTwilioAuthSession } = useAuth();
  const [code, setCode] = useState("");
  const [loadingAuthSession, setLoadingAuthSession] = useState(false);
  const [loadingSendVerif, setLoadingSendVerif] = useState(false);
  useEffect(() => {
    setLoadingAuthSession(true);
    startTwilioAuthSession().then(() => {
      setLoadingAuthSession(false);
    });
    return () => {};
  }, []);

  return (
    <CenteringContainer>
      <Card>
        <Text h2>Two-Factor Auth</Text>
        <Text p span>
          Your phone number is: <b>{formatPhoneNumber(userData.phone)}</b>.
        </Text>
        <Text p span>
          You'll receive a code via text—enter it to enter the app.
        </Text>
        <Grid.Container align="middle">
          <Grid>
            <Text p span>
              {loadingAuthSession ? (
                <Text b type="warning" margin="0">
                  Sending code...
                </Text>
              ) : (
                <Text b type="success" margin="0">
                  Code sent!
                </Text>
              )}
            </Text>
          </Grid>
          <Spacer x={0.5} />
          <Grid>
            <Button
              size="small"
              auto
              loading={loadingAuthSession}
              onClick={() => {
                setLoadingAuthSession(true);
                startTwilioAuthSession().then(() => {
                  setLoadingAuthSession(false);
                });
              }}
            >
              Resend Code
            </Button>
          </Grid>
        </Grid.Container>
        <Spacer y={1} />
        <Grid.Container align="middle">
          <Grid>
            <Input
              placeholder="Code"
              size="large"
              onChange={(e) => {
                setCode(e.target.value);
              }}
            ></Input>
          </Grid>
          <Spacer x={0.5} />
          <Grid>
            <Button
              auto
              type="secondary"
              loading={loadingSendVerif}
              onClick={() => {
                setLoadingSendVerif(true);
                sendTwilioVerifCode(code).then(() => {
                  setLoadingSendVerif(false);
                  onNext();
                });
              }}
            >
              Submit
            </Button>
          </Grid>
        </Grid.Container>
      </Card>
    </CenteringContainer>
  );
}

function RenderStage({ stage, setStage = () => {} }) {
  const {
    user,
    twilioToken,
    loading,
    signInWithGoogle,
    signOut,
    sendTwilioVerifCode,
    startTwilioAuthSession,
  } = useAuth();

  switch (stage) {
    case STAGES.ENTER_PHONE_NUMBER:
      return (
        <EnterPhoneNumberStage
          onNext={() => {
            setStage(STAGES.ENTER_VERIF_CODE);
          }}
        />
      );
    case STAGES.ENTER_VERIF_CODE:
      return <EnterVerifCodeStage onNext={async () => {}} />;
    default:
      return <Fragment />;
  }
}

export default function TwoFacAuth() {
  const [stage, setStage] = useState(STAGES.ENTER_PHONE_NUMBER);
  const { loading } = useAuth();
  if (loading) return <Fragment />;
  return (
    <Grid
      gap={1}
      style={{ margin: "15px 0", width: "800px", height: "600px" }}
      justify="center"
    >
      <RenderStage stage={stage} setStage={setStage} />
    </Grid>
  );
}
