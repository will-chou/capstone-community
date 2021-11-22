import "firebase/auth";
import axios from "axios";
import "firebase/firestore";
import { useState, useEffect, Fragment } from "react";
import ReactMapboxGl, { Marker, Popup } from "react-mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import currentLocationIcon from "../assets/you_are_here.png";
import crimeMarkerIcon from "../assets/crime.png";
import shoppingMarkerIcon from "../assets/shopping.png";
import restaurantMarkerIcon from "../assets/restaurant.png";
import localEventMarkerIcon from "../assets/local_event.png";
import otherMarkerIcon from "../assets/star.png";
import { useAuth } from "../auth/authContext";
import EventWidget from "./EventWidget";
import {
  Button,
  Select,
} from "@geist-ui/react";

const Map = ReactMapboxGl({
  accessToken:
    "pk.eyJ1IjoibWljaGFlbHcxIiwiYSI6ImNrb29xYXkzZDAxOXMydWxrNm5mdTh2cjUifQ.BUPHP_fptDzgtWTc4mIhIA",
});

const EventMap = () => {
  const BASE_URL = process.env.REACT_APP_API_BASE_URL;
  const [userLocation, setUserLocation] = useState(null);
  const [center, setCenter] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [nearbyEvents, setNearbyEvents] = useState([]);
  const [viewport, setViewport] = useState({});
  const { getTokens } = useAuth();
  const [eventCategory, setEventCategory] = useState(null);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [radius, setRadius] = useState("25");

  function refreshMap() {
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      reCenter(coords);
      setUserLocation([coords.longitude, coords.latitude]);
      const tokens = await getTokens();
      axios
        .get(
          `${BASE_URL}/api/events/nearby?lat=${coords.latitude}&lng=${coords.longitude}&radius=${radius}`,
          { headers: tokens }
        )
        .then((res) => {
          if (res.status === 200) {
            setNearbyEvents(res.data);
            setFilteredEvents(res.data);
            setEventCategory("all");
          }
        });
    });
  }
  useEffect(() => {
    refreshMap();
  }, []);

  useEffect(() => {
    refreshMap();
  }, [radius])

  useEffect(() => {
    if (eventCategory != null) {
      if (eventCategory === "all") {
        setFilteredEvents(nearbyEvents);
      } else {
        setFilteredEvents(nearbyEvents.filter(event =>
          event.eventData.eventCategory === eventCategory || (!event.eventData.eventCategory && eventCategory === "other")
        ));
      }
    }
  }, [eventCategory]);

  const reCenter = (location, zoom) => {
    setViewport((prev) => {
      let newViewport = {
        ...prev,
        center: [location.longitude, location.latitude],
        zoom: zoom,
        transitionDuration: 600,
        //transitionEasing: d3.easeCubic
      };
      return newViewport;
    });
  };

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

  return (
    <div>
      {userLocation == null ? (
        <div>Loading...</div>
      ) : (
        <Fragment>
          <Map
            {...viewport}
            style="mapbox://styles/mapbox/light-v9"
            containerStyle={{
              height: "600px",
              width: "800px",
            }}
          >
            <Marker coordinates={userLocation} anchor="bottom">
              <img width="50" height="50" src={currentLocationIcon} />
            </Marker>
            {filteredEvents.map((event) => (
              <Marker
                coordinates={[event.lng, event.lat]}
                anchor="bottom"
                onClick={() => {
                  setSelectedEvent(event);
                  setCenter([event.lng, event.lat]);
                }}
              >
                <img width="25" height="25" src={renderIcon(event.eventData.eventCategory)} />
              </Marker>
            ))}
            {selectedEvent && (
              <Popup
                key={selectedEvent.locationHash}
                coordinates={[selectedEvent.lng, selectedEvent.lat]}
              >
                <div>
                  <EventWidget
                    event={selectedEvent}
                    height="80px"
                    width="100%"
                  />
                  <div>
                    <button
                      onClick={() => {
                        setSelectedEvent(null);
                        setCenter(userLocation);
                      }}
                    >
                      Close
                    </button>
                  </div>
                </div>
              </Popup>
            )}
          </Map>
          <Select
            placeholder="Filter by category"
            onChange={val => setEventCategory(val)}
            width="20%"
            value={eventCategory}
          >
            <Select.Option value="all">All</Select.Option>
            <Select.Option value="crime">Crime</Select.Option>
            <Select.Option value="shopping">Shopping</Select.Option>
            <Select.Option value="restaurant">Restaurants</Select.Option>
            <Select.Option value="local_event">Local events</Select.Option>
            <Select.Option value="other">Other</Select.Option>
          </Select>
          <Select
            placeholder="Filter by distance (radius)"
            onChange={val => setRadius(val)}
            width="30%"
            value={radius}
          >
            <Select.Option value="5">5 mi</Select.Option>
            <Select.Option value="10">10 mi</Select.Option>
            <Select.Option value="25">25 mi</Select.Option>
            <Select.Option value="50">50 mi</Select.Option>
            <Select.Option value="100">100 mi</Select.Option>
          </Select>
          <Button size="small" onClick={refreshMap}>
            Refresh Map
          </Button>
        </Fragment>
      )}
    </div>
  );
};

export default EventMap;
