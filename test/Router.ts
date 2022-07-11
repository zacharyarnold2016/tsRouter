import {HTTPMethod, Router} from '../src/Router';
import * as sinon from 'sinon';
import * as sinonChai from 'sinon-chai';
import * as chai from 'chai';
import * as http from 'http';

chai.use(sinonChai.default);

const { expect } = chai;

describe('Router', () => {
    let router: Router;
    let jsonString = '{}';
    const mockRequest = sinon.createStubInstance(http.IncomingMessage) as any;
    const mockResponse = sinon.createStubInstance(http.ServerResponse) as unknown as http.ServerResponse;
    const stub = sinon.stub();

    mockRequest[Symbol.asyncIterator] = () => {
        let bFirst = false;

        return {
            next(...args) {
                if (!bFirst) {
                    bFirst = true;

                    return Promise.resolve({
                        done: false,
                        value: jsonString
                    });
                }

                return Promise.resolve({
                    done: true,
                    value: '',
                })
            }
        } as AsyncIterableIterator<any>
    }

    // @ts-ignore
    mockRequest.on.callsFake((eventName, listener) => {
        if (eventName === 'data') {
            listener(jsonString);
        }

        if (eventName === 'end') {
            listener('');
        }
    });

    // @ts-ignore
    mockRequest.once.callsFake((eventName, listener) => {
        if (eventName === 'end') {
            listener('');
        }
    });

    beforeEach(() => {
        router = new Router();

        sinon.resetHistory();
    })

    it('should throw an error in case we already have a handler', () => {
        expect(() => router.get('/', stub)).not.throw();
        expect(() => router.get('/', stub)).throw(Error);

        expect(() => router.post('/', stub)).not.throw();
        expect(() => router.post('/', stub)).throw(Error);

        expect(() => router.put('/', stub)).not.throw();
        expect(() => router.put('/', stub)).throw(Error);

        expect(() => router.delete('/', stub)).not.throw();
        expect(() => router.delete('/', stub)).throw(Error);
    });

    it('should set a statusCode to 404, if the handler for endpoint was not specified', async() => {
        const handler = router.getHandler();

        mockRequest.method = HTTPMethod.GET;
        mockRequest.url = '/data'

        await handler(mockRequest, mockResponse);

        expect(mockResponse.statusCode).to.be.equal(404);
        expect(mockResponse.end).to.be.calledOnce;
    });

    it('should set a statusCode to 500, if the handler for endpoint throws and error', async() => {
        const handler = router.getHandler();

        mockRequest.method = HTTPMethod.POST;
        mockRequest.url = '/create';

        stub.throws(new Error('Some error'));

        router.post('/create', stub);

        await handler(mockRequest, mockResponse);

        expect(mockResponse.statusCode).to.be.equal(500);
        expect(mockResponse.end).to.be.calledOnce;
    });

    it('should call specified handler for each specified endpoint', async () => {
       const getUsersStub = sinon.stub();
       const postUsersStub = sinon.stub();
       const deleteUsersStub = sinon.stub();
       const putUsersStub = sinon.stub();

       router.get('/users', getUsersStub);
       router.post('/users', postUsersStub);
       router.delete('/users', deleteUsersStub);
       router.put('/users', putUsersStub);

       const handler = router.getHandler();

       // Check GET

       mockRequest.method = HTTPMethod.GET;
       mockRequest.url = '/users';

       await handler(mockRequest, mockResponse);

        expect(getUsersStub, 'Get Users handler should  be called if request is for GET /users').to.be.calledOnce;
        expect(postUsersStub, 'Post Users handler should not be called if request is not for POST /users').to.not.calledOnce;
        expect(deleteUsersStub, 'Delete Users handler should not be called if request is not for DELETE /users').to.not.calledOnce;
        expect(putUsersStub, 'Put Users handler should not be called if request is not for PUT /users').to.not.calledOnce;


       sinon.resetHistory();

       // Check POST

       mockRequest.method = HTTPMethod.POST;
       mockRequest.url = '/users';

       await handler(mockRequest, mockResponse);

        expect(getUsersStub, 'Get Users handler should not be called if request is not for GET /users').to.not.calledOnce;
        expect(postUsersStub, 'Post Users handler should  be called if request is for POST /users').to.be.calledOnce;
        expect(deleteUsersStub, 'Delete Users handler should not be called if request is not for DELETE /users').to.not.calledOnce;
        expect(putUsersStub, 'Put Users handler should not be called if request is not for PUT /users').to.not.calledOnce;

       sinon.resetHistory();

        // Check DELETE

        mockRequest.method = HTTPMethod.DELETE;
        mockRequest.url = '/users';

        await handler(mockRequest, mockResponse);

        expect(getUsersStub, 'Get Users handler should not be called if request is not for GET /users').to.not.calledOnce;
        expect(postUsersStub, 'Post Users handler should not be called if request is not for POST /users').to.not.calledOnce;
        expect(deleteUsersStub, 'Delete Users handler should  be called if request is for DELETE /users').to.be.calledOnce;
        expect(putUsersStub, 'Put Users handler should not be called if request is not for PUT /users').to.not.calledOnce;

        sinon.resetHistory();

        // Check PUT

        mockRequest.method = HTTPMethod.PUT;
        mockRequest.url = '/users';

        await handler(mockRequest, mockResponse);

        expect(getUsersStub, 'Get Users handler should not be called if request is not for GET /users').to.not.calledOnce;
        expect(postUsersStub, 'Post Users handler should not be called if request is not for POST /users').to.not.calledOnce;
        expect(deleteUsersStub, 'Delete Users handler should not be called if request is not for DELETE /users').to.not.calledOnce;
        expect(putUsersStub, 'Put Users handler should  be called if request is for PUT /users').to.be.calledOnce;

        sinon.resetHistory();
    });

    it('should parse the body of the request and put as request.body field', async () => {
        const testData1 = {
            name: 'Test',
            age: 14,
            tags: ['some tag1'],
        };

        jsonString = JSON.stringify(testData1);

        mockRequest.method = HTTPMethod.POST;
        mockRequest.url = '/test'

        const mock = sinon.stub();

        router.post('/test', mock);

        const handler = router.getHandler();

        await handler(mockRequest, mockResponse);

        expect(mock).to.be.calledOnce;
        expect(mockRequest.body).to.be.deep.equal(testData1);

        const testData2 = [12, 213, 54, 67, 19];

        jsonString = JSON.stringify(testData2);

        await handler(mockRequest, mockResponse);

        expect(mock).to.be.calledTwice;
        expect(mockRequest.body).to.be.deep.equal(testData2);
    });
});
