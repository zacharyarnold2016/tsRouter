import { on } from "events";
import * as http from "http";

// TODO: Implement this class.
export class Router {
  private routes: FullRequest[];
  constructor() {
    this.routes = [];
  }
  get<T>(path: string, handler: Handler<T>): this {
    const obj: FullRequest = { url: path, handler, method: HTTPMethod.GET };
    const found = this.findRoute(HTTPMethod.GET, path);
    if (found) {
      throw new Error("Route Already Exists");
    }
    this.addRoute(obj);
    return this;
  }

  post<T>(path: string, handler: Handler<T>): this {
    const obj: FullRequest = { url: path, handler, method: HTTPMethod.POST };
    const found = this.findRoute(HTTPMethod.POST, path);
    if (found) {
      throw new Error("Route Already Exists");
    }
    this.addRoute(obj);
    return this;
  }

  put<T>(path: string, handler: Handler<T>): this {
    const obj: FullRequest = { url: path, handler, method: HTTPMethod.PUT };
    const found = this.findRoute(HTTPMethod.PUT, path);
    if (found) {
      throw new Error("Route Already Exists");
    }
    this.addRoute(obj);
    return this;
  }

  delete<T>(path: string, handler: Handler<T>): this {
    const obj: FullRequest = { url: path, handler, method: HTTPMethod.DELETE };
    const found = this.findRoute(HTTPMethod.DELETE, path);
    if (found) {
      throw new Error("Route Already Exists");
    }
    this.addRoute(obj);
    return this;
  }

  getHandler(): Function {
    return async (request: IncomingMessage, response: OutgoingMessage) => {
      const obj = Object.entries(request);
      request.on("data", (element: string) => {
        const string: string = element;
        request.body = JSON.parse(string);
      });
      const found: FullRequest | undefined = this.findRoute(
        request.method,
        request.url
      );
      if (found) {
        try {
          found.handler(request, response);
        } catch (err) {
          response.statusCode = 500;
          response.end();
        }
      } else {
        response.statusCode = 404;
        response.end();
      }
    };
  }
  addRoute(body: FullRequest): void {
    this.routes.push(body);
  }
  findRoute(method: HTTPMethod, url: string): FullRequest | undefined {
    return this.routes.find(
      (route) => route.method === method && route.url === url
    );
  }
}

export type Handler<T> = (request: IncomingMessage, response: OutgoingMessage) => void;

export enum HTTPMethod {
  GET = "GET",
  POST = "POST",
  PUT = "PUT",
  DELETE = "DELETE",
}

interface Param {
  url: string;
  handler: { req: IncomingMessage; res: OutgoingMessage };
}
interface FullRequest {
  url: string;
  handler: Handler<Param>;
  method: HTTPMethod;
}
interface IncomingMessage {
  body: Object
  method: HTTPMethod,
  url: string,
  on: Function
}
interface OutgoingMessage {
  statusCode: number
  end: Function
}