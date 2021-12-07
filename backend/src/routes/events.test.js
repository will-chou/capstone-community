const { handleEvent, searchNearbyEvents, getEventRoutes } = require("./events.js");
const { firebase } = require('../firebase-init.js');
const geofire = require('geofire-common');
const express = require('express');

describe("Test handleEvent route", () => {
    const res = {
        text: '',
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 400 if lat null or not present in request', async () => {
        const req = {
            body: {
                lat: null,
                lng: 1,
                eventData: {},
            }
        };

        await handleEvent(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith('Insufficient info');
    });

    it('should return 400 if lng not present in request', async () => {
        const req = {
            body: {
                lat: 1,
                lng: null,
                eventData: {},
            }
        };

        await handleEvent(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith('Insufficient info');
    });

    it('should return 400 if eventData not present in request', async () => {
        const req = {
            body: {
                lat: 1,
                lng: 1,
                eventData: null,
            }
        };

        await handleEvent(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith('Insufficient info');
    });

    it('should return 200 and add the entries to event entries and user metadata if proper request body', async () => {
        const req = {
            body: {
                lat: 1,
                lng: 1,
                eventData: {},
            },
            locals: {
                user: {
                    email: "test_email"
                }
            }
        };

        jest.spyOn(geofire, 'geohashForLocation').mockImplementation(() => 'mock_hash');

        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            add: jest.fn().mockResolvedValueOnce({id: 'mock_id'}),
            doc: jest.fn().mockReturnThis(),
            set: jest.fn().mockResolvedValueOnce(),
        };

        const fsMock = jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);
        fsMock.FieldValue = {
            serverTimestamp: jest.fn().mockReturnValue('mock_time'),
        }

        await handleEvent(req, res);

        const expectedEventDoc = {
            eventData: {},
            locationHash: 'mock_hash',
            lat: 1,
            lng: 1,
            ts: 'mock_time',
        };

        expect(geofire.geohashForLocation).toBeCalledWith([1, 1]);
        expect(firestoreMock.collection).toBeCalledWith('eventEntries');
        expect(firestoreMock.collection).toBeCalledWith('user_metadata');
        expect(firestoreMock.add).toBeCalledWith(expectedEventDoc);
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.doc).toBeCalledWith('mock_id');
        expect(firestoreMock.set).toBeCalledWith(expectedEventDoc);
        expect(firestoreMock.collection).toBeCalledTimes(3);
        expect(firestoreMock.doc).toBeCalledTimes(2);
        expect(firestoreMock.set).toBeCalledTimes(1);

        expect(res.status).toBeCalledWith(200);
        expect(res.send).toBeCalledWith('mock_id');
    });
});

describe("Test searchNearbyEvents route", () => {
    const res = {
        text: '',
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 400 if lat null or not present in request query', async () => {
        const req = {
            query: {
                lat: null,
                lng: 1,
            }
        };

        await searchNearbyEvents(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith('Insufficient info');
    });

    it('should return 400 if lng null or not present in request query', async () => {
        const req = {
            query: {
                lat: 1,
                lng: null,
            }
        };

        await searchNearbyEvents(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith('Insufficient info');
    });

    it('should return 400 if lat/lng/radius is not a number in request query', async () => {
        const req = {
            query: {
                lat: 'test',
                lng: 1,
            }
        };

        await searchNearbyEvents(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith('Invalid location');
    });

    it('should return 400 if lat/lng/radius is not a number in request query', async () => {
        const req = {
            query: {
                lat: 1,
                lng: 1,
                radius: 'radius'
            }
        };

        await searchNearbyEvents(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith('Invalid location');
    });

    it('should return 200 if lat/lng/radius are valid', async () => {
        const req = {
            query: {
                lat: 1,
                lng: 1,
                radius: 25,
            }
        };

        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValueOnce({
                docs: [{
                    get: jest.fn().mockReturnValue(1),
                    data: jest.fn().mockReturnValue('mock_data'),
                }],
                data: jest.fn().mockReturnValue('user')
            }),
            orderBy: jest.fn().mockReturnThis(),
            startAt: jest.fn().mockReturnThis(),
            endAt: jest.fn().mockReturnThis(),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        jest.spyOn(geofire, 'geohashQueryBounds').mockImplementation(() => [[2, 2]]);
        jest.spyOn(geofire, 'distanceBetween').mockImplementation(() => 3);

        await searchNearbyEvents(req, res);

        expect(geofire.geohashQueryBounds).toBeCalledWith([1, 1], 25);
        expect(firestoreMock.collection).toBeCalledWith('eventEntries');
        expect(firestoreMock.orderBy).toBeCalledWith('locationHash');
        expect(firestoreMock.startAt).toBeCalledWith(2);
        expect(firestoreMock.endAt).toBeCalledWith(2);
        expect(firestoreMock.get).toBeCalled();
        
        expect(firestoreMock.collection).toBeCalledTimes(1);
        expect(firestoreMock.orderBy).toBeCalledTimes(1);
        expect(firestoreMock.startAt).toBeCalledTimes(1);
        expect(firestoreMock.endAt).toBeCalledTimes(1);
        expect(firestoreMock.get).toBeCalledTimes(1);

        expect(res.status).toBeCalledWith(200);
        expect(res.send).toBeCalledWith(['mock_data']);
    });

    it('should return 200 if lat/lng/radius are valid and filter out events not within radius', async () => {
        const req = {
            query: {
                lat: 1,
                lng: 1,
                radius: 25,
            }
        };

        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValueOnce({
                docs: [{
                    get: jest.fn().mockReturnValue(1),
                    data: jest.fn().mockReturnValue('mock_data'),
                }],
                data: jest.fn().mockReturnValue('user')
            }),
            orderBy: jest.fn().mockReturnThis(),
            startAt: jest.fn().mockReturnThis(),
            endAt: jest.fn().mockReturnThis(),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        jest.spyOn(geofire, 'geohashQueryBounds').mockImplementation(() => [[2, 2]]);
        jest.spyOn(geofire, 'distanceBetween').mockImplementation(() => 26);

        await searchNearbyEvents(req, res);

        expect(geofire.geohashQueryBounds).toBeCalledWith([1, 1], 25);
        expect(firestoreMock.collection).toBeCalledWith('eventEntries');
        expect(firestoreMock.orderBy).toBeCalledWith('locationHash');
        expect(firestoreMock.startAt).toBeCalledWith(2);
        expect(firestoreMock.endAt).toBeCalledWith(2);
        expect(firestoreMock.get).toBeCalled();
        
        expect(firestoreMock.collection).toBeCalledTimes(1);
        expect(firestoreMock.orderBy).toBeCalledTimes(1);
        expect(firestoreMock.startAt).toBeCalledTimes(1);
        expect(firestoreMock.endAt).toBeCalledTimes(1);
        expect(firestoreMock.get).toBeCalledTimes(1);

        expect(res.status).toBeCalledWith(200);
        expect(res.send).toBeCalledWith([]);
    });

});

describe("Test getEventRoutes", () => {
    it('should return router with event routes', () => {
        const expressMock = {
            get: jest.fn().mockReturnThis(),
            post: jest.fn().mockReturnThis(),
        };
        
        jest.spyOn(express, 'Router').mockImplementation(() => expressMock);

        getEventRoutes();

        expect(expressMock.post).toBeCalledWith('/', handleEvent);
        expect(expressMock.get).toBeCalledWith('/nearby', searchNearbyEvents);
    });
});
