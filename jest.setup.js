import '@testing-library/jest-dom';
import { expect, jest } from '@jest/globals';

// Mock Request and Response for API tests
global.Request = class Request {
  constructor(url, init) {
    this.url = url;
    this._init = init || {};
    this.method = init?.method || 'GET';
    this._body = init?.body;
  }

  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }
};

global.Response = class Response {
  constructor(body, init) {
    this._body = body;
    this._init = init || {};
    this.status = init?.status || 200;
  }

  async json() {
    return typeof this._body === 'string' ? JSON.parse(this._body) : this._body;
  }
};

// Mock the transform context globally
jest.mock('react-zoom-pan-pinch', () => ({
  useTransformContext: () => ({
    transformState: {
      scale: 1,
      positionX: 0,
      positionY: 0
    }
  })
})); 