import {
    NextFunction,
    Response,
    Request,
    Query,
} from 'express-serve-static-core';

declare module 'express-serve-static-core' {
    // added by https://github.com/pinojs/express-pino-logger
    interface Request {
        log: {
            error: Console['error'];
            info: Console['info'];
        };
    }
}

interface RequestHandlerRequest<
    P extends Record<string, any>,
    ResponseBody,
    RequestBody,
    QueryParams extends Query
> extends Request<P, ResponseBody, RequestBody> {
    query: QueryParams;
}

export type RequestHandler<
    Params = any,
    ResponseBody = any,
    RequestBody = any,
    QueryParams extends Query = any
> = (
    request: RequestHandlerRequest<
        Params,
        ResponseBody,
        RequestBody,
        QueryParams
    >,
    response: Response<ResponseBody>,
    next: NextFunction
) => void;
