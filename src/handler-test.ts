import { RequestHandler } from './types';
import { Paths } from '../fixtures/todo-openapi';

const methods = ['get', 'post', 'put', 'patch'];

// type Method = {
//     Parameters: Record<string, any>;
//     PathParameters: Record<string, any>;
//     QueryParameters: Record<string, any>;
//     RequestBody: any;
//     Responses: {
//         [key: string]: any;
//     };
// };

// export type RequestHandlerWithMethod<M extends Method> = RequestHandler<
//     M['PathParameters'],
//     M['Responses'],
//     M['RequestBody'],
//     M['QueryParameters']
// >;
// export type V1Todo$IdGet = RequestHandlerWithMethod<Paths.V1Todo$Id.Get>;
export const getHelloHandlerV1: RequestHandler<
  Paths.V1Todo$Id.Get.PathParameters,
  Paths.V1Hello.Get.Responses.$200,
  unknown,
  { name: boolean }
> = async (req, res) => {
  const { name } = req.query;
  const params = req.params;
  console.log(params);
  const greeting = name ? `Hi ${name}!!!!` : 'Hello!!';
  res.json({ greeting });
};
