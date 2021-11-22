import { useEffect, useState } from "react";
import { Button, ButtonGroup, Row, Card, Textarea, Select } from "@geist-ui/react";
import { useAuth } from "../auth/authContext";
import axios from "axios";

const EventPost = () => {
    const BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const { getTokens } = useAuth();

    const [eventText, setEventText] = useState(null);
    const [eventCategory, setEventCategory] = useState(null);

    const postEvent = async() => {
        navigator.geolocation.getCurrentPosition(async ({ coords }) => {
            const tokens = await getTokens();
            window.console.log(tokens);
            axios.post(
                `${BASE_URL}/api/events`,
                {
                    lat: coords.latitude,
                    lng: coords.longitude,
                    eventData: {
                        eventText: eventText,
                        eventCategory: eventCategory
                    },
                },
                {
                    headers: tokens
                }).then((res) => {
                    window.alert(`Posted event ${res.data}`);
                });
        });

        setEventText("");
        setEventCategory(null);
    }

    return (
        <Card width="100%">
            <h4>What's happening?</h4>
            <Row style={{ marginBottom: '15px' }}>
                <Textarea
                    placeholder="What's happening near you?"
                    onChange={e => setEventText(e.target.value)}
                    width="100%"
                    value={eventText}
                />
            </Row>
            <Row>
                <Select
                    placeholder="Choose a category (optional)"
                    onChange={val => setEventCategory(val)}
                    width="100%"
                    value={eventCategory}
                >
                    <Select.Option value="crime">Crime</Select.Option>
                    <Select.Option value="shopping">Shopping</Select.Option>
                    <Select.Option value="restaurant">Restaurants</Select.Option>
                    <Select.Option value="local_event">Local events</Select.Option>
                    <Select.Option value="other">Other</Select.Option>
                </Select>
            </Row>
            
            <Card.Footer>
                <Row justify="center">
                    <ButtonGroup>
                        <Button onClick={postEvent} disabled={!eventText || eventText.length === 0}>Share</Button>
                    </ButtonGroup>
                </Row>
            </Card.Footer>
        </Card>
    );
}

export default EventPost;
