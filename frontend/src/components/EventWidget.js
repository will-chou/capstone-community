import { Text } from "@geist-ui/react";
import crimeMarkerIcon from "../assets/crime.png";
import shoppingMarkerIcon from "../assets/shopping.png";
import restaurantMarkerIcon from "../assets/restaurant.png";
import localEventMarkerIcon from "../assets/local_event.png";
import otherMarkerIcon from "../assets/star.png";

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

const EventWidget = ({ event, width = 300, height = 380 }) => {
    var eventData = event.eventData;
    var timestamp = new Date(event.ts.seconds * 1000);
    var dateOptions = { weekday: 'short', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return (
        <div style={{ margin: "5px" }}>
            <div style={{ display: "flex", flexWrap: "wrap" }}>
                <div style={{ float: "left" }}>
                    <img width="25" height="25" src={renderIcon(eventData.eventCategory)} />
                </div>
                <div style={{ float: "right" }}>
                    <Text small>
                        {eventData.eventText}
                    </Text>
                </div>
            </div>
            <div>
                <Text small type="secondary">
                    {timestamp.toLocaleDateString("en-US", dateOptions)}
                </Text>
            </div>
        </div>
    );
}

export default EventWidget;