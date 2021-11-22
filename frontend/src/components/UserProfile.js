import "firebase/auth";
import axios from "axios";
import "firebase/firestore";
import { useState, useEffect } from "react";
import { useAuth } from "../auth/authContext";
import {
  Button,
  Card,
  Collapse,
  Spacer,
  Text,
  User,
} from "@geist-ui/react";
import crimeMarkerIcon from "../assets/crime.png";
import shoppingMarkerIcon from "../assets/shopping.png";
import restaurantMarkerIcon from "../assets/restaurant.png";
import localEventMarkerIcon from "../assets/local_event.png";
import otherMarkerIcon from "../assets/star.png";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

const UserProfile = () => {
  const [userData, setUserData] = useState(null);
  const [userEntries, setUserEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const { getTokens, signOut } = useAuth();

  async function fetchUserMetadata() {
    try {
      const tokens = await getTokens();
      return axios
        .get(`${BASE_URL}/api/users/me`, { headers: tokens })
        .then((res) => {
          if (res.status === 200) {
            setUserData(res.data.userData);
            setUserEntries(res.data.userEntries);
            setLoading(false);
          }
        });
    } catch (e) {
      console.error(e);
    }
  }

  useEffect(() => {
    fetchUserMetadata();
  }, []);

  const renderIcon = (category) => {
    switch (category) {
      case "crime":
        return crimeMarkerIcon;
      case "shopping":
        return shoppingMarkerIcon;
      case "restaurant":
        return restaurantMarkerIcon;
      case "local_event":
        return localEventMarkerIcon;
      default:
        return otherMarkerIcon;
    }
  }

  const renderDate = (event) => {
    var timestamp = new Date(event.ts.seconds * 1000);
    var dateOptions = { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return (<div>
      <Text small type="secondary">
        {timestamp.toLocaleDateString("en-US", dateOptions)}
      </Text>
    </div>)
  }

  return (
    <div>
      {loading ? (
        <div></div>
      ) : (
        <div>
          <div>
            <Card width="100%">
              <User
                name={userData.name}
                src={userData.picture}
              >
                {userData.phone}
              </User>
              <Button
                size="mini"
                onClick={() => {
                  signOut();
                }}
              >
                Sign out
              </Button>
              <Button
                size="mini"
                onClick={() => {
                  fetchUserMetadata();
                }}
              >
                Refresh
              </Button>
              <Spacer />
              <Collapse title={<h5>My recent activity</h5>}>
                {userEntries.map((entry) => (
                  <div style={{ "margin-bottom": "25px" }}>
                    <div style={{ display: "flex", flexWrap: "wrap", margin: "0", padding: "0" }}>
                      <div style={{ float: "left" }}>
                        <img width="25" height="25" src={renderIcon(entry.eventData.eventCategory)} />
                      </div>
                      <div style={{ float: "right" }}>
                        <Text small>
                          {entry.eventData.eventText}
                        </Text>
                      </div>
                    </div>
                    {renderDate(entry)}
                  </div>
                ))}
              </Collapse>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
