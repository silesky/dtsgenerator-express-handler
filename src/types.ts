import {
    NextFunction,
    Response,
    Request,
    Query,
    ParamsArray,
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

// prevents mismatch from dtsgen, and also computes type
type Compute<T> = {
    [K in keyof T]: T[K];
    // eslint-disable-next-line @typescript-eslint/ban-types
} & {};

export type RequestHandler<
    Params extends Record<string, any> = any,
    ResponseBody = any,
    RequestBody = any,
    QueryParams extends Record<string, any> = any
> = (
    request: Request<
        Compute<Params>,
        ResponseBody,
        RequestBody,
        Compute<QueryParams>
    >,
    response: Response<ResponseBody>,
    next: NextFunction
) => void;
