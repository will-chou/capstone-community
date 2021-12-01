const {
    firebaseAuthMiddleware,
    twilioAuthMiddleware,
    validatePhoneForRegistrationMiddleware,
    handleRegister,
    handleInit2facSession,
    handle2FactorAuthentication,
} = require("./auth.js");
const { firebase, admin } = require('../firebase-init.js');
const { uuid } = require('uuidv4');
const client = require('../twilio-init.js');

jest.mock('uuidv4');
uuid.mockImplementation(() => 'mock_uuid');

jest.mock('../twilio-init.js');

describe("Test firebaseAuthMiddleware", () => {
    const res = {
        text: '',
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };

    const next = jest.fn().mockReturnThis();

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 401 if login token is null/does not exist', async () => {
        const req = {
            headers: {
                login_token: null,
            }
        };

        await firebaseAuthMiddleware(req, res, next);

        expect(res.status).toBeCalledWith(401);
        expect(res.send).toBeCalledWith({error: 'Unauthorized'});
    })

    it('should return 401 if verifyIdToken fails', async () => {
        const req = {
            headers: {
                login_token: 'mock_token',
            }
        };
        const adminAuthMock = {
            verifyIdToken: jest.fn().mockRejectedValue(),
        };

        jest.spyOn(admin, 'auth').mockImplementation(() => adminAuthMock);

        await firebaseAuthMiddleware(req, res, next);

        expect(adminAuthMock.verifyIdToken).toBeCalledWith('mock_token', true);
        expect(adminAuthMock.verifyIdToken).toBeCalledTimes(1);

        expect(res.status).toBeCalledWith(401);
        expect(res.send).toBeCalledWith({error: 'Unauthorized'});
    })
    
    it('should return next if login token is verified', async () => {
        const req = {
            headers: {
                login_token: 'mock_token',
            }
        };
        const adminAuthMock = {
            verifyIdToken: jest.fn().mockResolvedValue(),
        };

        jest.spyOn(admin, 'auth').mockImplementation(() => adminAuthMock);

        await firebaseAuthMiddleware(req, res, next);

        expect(adminAuthMock.verifyIdToken).toBeCalledWith('mock_token', true);
        expect(adminAuthMock.verifyIdToken).toBeCalledTimes(1);

        expect(next).toBeCalledTimes(1);
    });
});

describe("Test twilioAuthMiddleware", () => {
    const res = {
        text: '',
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };

    const next = jest.fn().mockReturnThis();

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 401 if two fac token is null/does not exist', async () => {
        const req = {
            headers: {
                two_fac_token: null,
            }
        };

        await twilioAuthMiddleware(req, res, next);

        expect(res.status).toBeCalledWith(401);
        expect(res.send).toBeCalledWith({error: 'Unauthorized'});
    })

    it('should return 401 if two fac tokens do not match', async () => {
        const req = {
            headers: {
                two_fac_token: 'mock_token',
            },
            locals: {
                user: {
                    email: "test_email"
                }
            }
        };
        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValueOnce({
                data: jest.fn().mockReturnValue({
                    token: 'mock_token_2',
                })
            }),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        await twilioAuthMiddleware(req, res, next);

        expect(firestoreMock.collection).toBeCalledWith('2_fac');
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.get).toBeCalled();

        expect(res.status).toBeCalledWith(401);
        expect(res.send).toBeCalledWith({error: 'Unauthorized'});
    })
    
    it('should return next if two fac tokens match', async () => {
        const req = {
            headers: {
                two_fac_token: 'mock_token',
            },
            locals: {
                user: {
                    email: "test_email"
                }
            }
        };
        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValueOnce({
                data: jest.fn().mockReturnValue({
                    token: 'mock_token',
                })
            }),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        await twilioAuthMiddleware(req, res, next);

        expect(firestoreMock.collection).toBeCalledWith('2_fac');
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.get).toBeCalled();
        expect(next).toBeCalledTimes(1);
    });
});

describe("Test validatePhoneForRegistrationMiddleware", () => {
    const res = {
        text: '',
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };

    const next = jest.fn().mockReturnThis();

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 400 if null phone number in request', async () => {
        const req = {
            body: {
                phone: null,
            },
            locals: {
                user: {
                    uid: 'mock_id',
                }
            }
        };
        const adminAuthMock = {
            deleteUser: jest.fn().mockResolvedValue(),
        };

        jest.spyOn(admin, 'auth').mockImplementation(() => adminAuthMock);

        await validatePhoneForRegistrationMiddleware(req, res, next);

        expect(adminAuthMock.deleteUser).toBeCalledWith('mock_id');
        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith({error: 'Invalid phone number'});
    })

    it('should return 400 if invalid phone number in request', async () => {
        const req = {
            body: {
                phone: 'invalid_phone_number',
            },
            locals: {
                user: {
                    uid: 'mock_id',
                }
            }
        };
        const adminAuthMock = {
            deleteUser: jest.fn().mockResolvedValue(),
        };

        jest.spyOn(admin, 'auth').mockImplementation(() => adminAuthMock);

        await validatePhoneForRegistrationMiddleware(req, res, next);

        expect(adminAuthMock.deleteUser).toBeCalledWith('mock_id');
        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith({error: 'Invalid phone number'});
    })

    it('should return next if valid phone number in request', async () => {
        const req = {
            body: {
                phone: '3108254321',
            },
            locals: {
                user: {
                    uid: 'mock_id',
                }
            }
        };

        await validatePhoneForRegistrationMiddleware(req, res, next);

        expect(next).toBeCalledTimes(1);
    });
});

describe('Test handleRegister route', () => {
    const res = {
        text: '',
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 200 and set user_metadata', async () => {
        const req = {
            locals: {
                user: {
                    email: "test_email",
                    phone: "3108254321",
                    name: "test_name",
                    picture: "test_picture",
                }
            }
        };
        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnValue(),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        await handleRegister(req, res);

        expect(firestoreMock.collection).toBeCalledWith('user_metadata');
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.set).toBeCalledWith({
            phone: '3108254321',
            event_entries: [],
            name: 'test_name',
            picture: 'test_picture'
        });
        expect(res.status).toBeCalledWith(200);
        expect(res.json).toBeCalledWith({ message: 'success' });
    });
})

describe('Test handleInit2facSession route', () => {
    const res = {
        text: '',
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 400 if email is null/not present in request', async () => {
        const req = {
            locals: {
                user: {
                    email: null,
                }
            }
        };

        await handleInit2facSession(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith({ error: 'Invalid token' });
    });

    it('should return 400 if Math.floor throws exception', async () => {
        const req = {
            locals: {
                user: {
                    email: 'test_email',
                }
            }
        };

        jest.spyOn(global.Math, 'floor').mockImplementation(() => {
            throw new Error()
        });

        await handleInit2facSession(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith({ error: 'Invalid token' });
    });

    it('should return 200 and send SMS through Twilio if no exceptions', async () => {
        const req = {
            locals: {
                user: {
                    email: 'test_email',
                }
            }
        };

        jest.spyOn(global.Math, 'floor').mockImplementation(() => 0);
        jest.spyOn(global.Math, 'random').mockImplementation(() => 0);

        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            set: jest.fn().mockReturnValue(),
            get: jest.fn().mockReturnValue({data: jest.fn().mockReturnValue({phone: '3108254321'})})
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        const message = {
            create: jest.fn().mockResolvedValue({sid: 'mock_sid'})
        };
        client.messages = message;

        await handleInit2facSession(req, res);

        expect(firestoreMock.collection).toBeCalledWith('2_fac');
        expect(firestoreMock.collection).toBeCalledWith('user_metadata');
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.set).toBeCalledWith({
            sessionId: 'mock_uuid',
            code: '1000',
            token: 'mock_uuid'
        });
        expect(firestoreMock.get).toBeCalled();
        expect(client.messages.create).toBeCalledWith({
            to: '3108254321',
            from: '+18647324828',
            body: 'Your community login code: 1000',
        });

        expect(res.status).toBeCalledWith(200);
        expect(res.send).toBeCalledWith({ sessionId: 'mock_uuid' });
    });
});

describe('Test handle2FactorAuthentication', () => {
    const res = {
        text: '',
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
    };

    const next = jest.fn().mockReturnThis();

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should return 400 if session id is null/not present', async () => {
        const req = {
            body: {
                sessionId: null,
                code: 1000,
            },
            locals: {
                user: {
                    email: 'test_email',
                }
            }
        };

        await handle2FactorAuthentication(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith({error: 'Invalid request'});
    });

    it('should return 400 if code is null/not present', async () => {
        const req = {
            body: {
                sessionId: 'mock_id',
                code: null,
            },
            locals: {
                user: {
                    email: 'test_email',
                }
            }
        };

        await handle2FactorAuthentication(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith({error: 'Invalid request'});
    });

    it('should return 400 if email is null/not present', async () => {
        const req = {
            body: {
                sessionId: 'mock_id',
                code: 1000,
            },
            locals: {
                user: {
                    email: null,
                }
            }
        };

        await handle2FactorAuthentication(req, res);

        expect(res.status).toBeCalledWith(400);
        expect(res.send).toBeCalledWith({error: 'Invalid request'});
    });

    it('should return 401 if incorrect code inputted during 2 fac auth', async () => {
        const req = {
            body: {
                sessionId: 'mock_id',
                code: 1000,
            },
            locals: {
                user: {
                    email: 'test_email',
                }
            }
        };

        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValueOnce({
                data: jest.fn().mockReturnValue({
                    sessionId: 'mock_id',
                    code: 2000,
                })
            }),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        await handle2FactorAuthentication(req, res);

        expect(firestoreMock.collection).toBeCalledWith('2_fac');
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.get).toBeCalled();
        
        expect(res.status).toBeCalledWith(401);
        expect(res.send).toBeCalledWith({error: 'Incorrect code'});
    });

    it('should return 200 if successful 2 fac auth with matching code', async () => {
        const req = {
            body: {
                sessionId: 'mock_id',
                code: 1000,
            },
            locals: {
                user: {
                    email: 'test_email',
                }
            }
        };

        const firestoreMock = {
            collection: jest.fn().mockReturnThis(),
            doc: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValueOnce({
                data: jest.fn().mockReturnValue({
                    sessionId: 'mock_id',
                    code: 1000,
                    token: 'mock_token',
                })
            }),
        };

        jest.spyOn(firebase, 'firestore').mockImplementation(() => firestoreMock);

        await handle2FactorAuthentication(req, res);

        expect(firestoreMock.collection).toBeCalledWith('2_fac');
        expect(firestoreMock.doc).toBeCalledWith('test_email');
        expect(firestoreMock.get).toBeCalled();
        
        expect(res.status).toBeCalledWith(200);
        expect(res.send).toBeCalledWith({token: 'mock_token'});
    });
});
