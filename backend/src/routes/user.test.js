const { handleMe, getUserRoutes } = require("./user.js");
const { firebase } = require('../firebase-init.js');
const express = require('express');

describe("Test handleMe", () => {
    const req = {
        locals: {
            user: {
                email: "test_email"
            }
        }
    };
    const res = {
        text: '',
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 404 if user does not exist', async () => {
        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValueOnce({exists: false, data: jest.fn().mockReturnValue()}),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        await handleMe(req, res);

        expect(firestoreMock.collection).toBeCalledWith('user_metadata');
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.get).toBeCalled();
        expect(firestoreMock.collection).toBeCalledTimes(1);
        expect(firestoreMock.doc).toBeCalledTimes(1);
        expect(firestoreMock.get).toBeCalledTimes(1);

        expect(res.status).toBeCalledWith(404);
        expect(res.send).toBeCalledWith('User not found');
    })
    
    it('should return 200 and return proper userData and userEntries', async () => {
        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn()
                    .mockResolvedValueOnce({exists: true, data: jest.fn().mockReturnValue('user')})
                    .mockResolvedValueOnce([
                        { data: jest.fn().mockReturnValue('entry') }
                    ]),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        await handleMe(req, res);

        expect(firestoreMock.collection).toBeCalledWith('user_metadata');
        expect(firestoreMock.collection).toBeCalledWith('event_entries');
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.get).toBeCalled();
        expect(firestoreMock.orderBy).toBeCalledWith('ts', 'desc');
        expect(firestoreMock.limit).toBeCalledWith(10);
        expect(firestoreMock.collection).toBeCalledTimes(3);
        expect(firestoreMock.doc).toBeCalledTimes(2);
        expect(firestoreMock.get).toBeCalledTimes(2);
        expect(firestoreMock.orderBy).toBeCalledTimes(1);
        expect(firestoreMock.limit).toBeCalledTimes(1);

        expect(res.status).toBeCalledWith(200);
        expect(res.send).toBeCalledWith({
            userData: 'user',
            userEntries: ['entry']
        });
    });

    it('should return 200 and return proper userData and empty userEntries if null entries', async () => {
        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn()
                    .mockResolvedValueOnce({exists: true, data: jest.fn().mockReturnValue('user')})
                    .mockResolvedValueOnce(null),
            orderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        await handleMe(req, res);

        expect(firestoreMock.collection).toBeCalledWith('user_metadata');
        expect(firestoreMock.collection).toBeCalledWith('event_entries');
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.get).toBeCalled();
        expect(firestoreMock.orderBy).toBeCalledWith('ts', 'desc');
        expect(firestoreMock.limit).toBeCalledWith(10);
        expect(firestoreMock.collection).toBeCalledTimes(3);
        expect(firestoreMock.doc).toBeCalledTimes(2);
        expect(firestoreMock.get).toBeCalledTimes(2);
        expect(firestoreMock.orderBy).toBeCalledTimes(1);
        expect(firestoreMock.limit).toBeCalledTimes(1);

        expect(res.status).toBeCalledWith(200);
        expect(res.send).toBeCalledWith({
            userData: 'user',
            userEntries: []
        });
    });
});

describe("Test getUserRoutes", () => {
    it('should return router with user routes', () => {
        const expressMock = {
            get: jest.fn().mockReturnThis()
        };
        
        jest.spyOn(express, 'Router').mockImplementation(() => expressMock);

        getUserRoutes();

        expect(expressMock.get).toBeCalledWith('/me', handleMe);
    });
});
