import { useEffect, useState } from "react";
import { Button, ButtonGroup, Grid, Card, Textarea, Select, useToasts } from "@geist-ui/react";
import { useAuth } from "../auth/authContext";
import axios from "axios";

const EventPost = () => {
    const BASE_URL = process.env.REACT_APP_API_BASE_URL;
    const { getTokens } = useAuth();

    const [eventText, setEventText] = useState(null);
    const [eventCategory, setEventCategory] = useState(null);
    const [toasts, setToast] = useToasts();

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
                    setToast({text: `Shared event successfully! Refresh map to see updates`})
                }).catch((e) => {
                    setToast({text: `Something went wrong. Please try again.`})
                })
        });

        setEventText("");
        setEventCategory(null);
    }

    return (
        <Card width="100%">
            <h4>What's happening?</h4>
            <Grid.Container>
                <Grid xs={24} style={{ marginBottom: '15px' }}>
                    <Textarea
                        placeholder="What's happening near you?"
                        onChange={e => setEventText(e.target.value)}
                        width="100%"
                        value={eventText}
                    />
                </Grid>
                <Grid>
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
                </Grid>
            </Grid.Container>
            
            <Card.Footer>
                <Grid>
                    <ButtonGroup>
                        <Button onClick={postEvent} disabled={!eventText || eventText.length === 0}>Share</Button>
                    </ButtonGroup>
                </Grid>
            </Card.Footer>
        </Card>
    );
}

export default EventPost;
