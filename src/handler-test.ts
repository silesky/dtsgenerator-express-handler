import { RequestHandler } from './types';
import { Paths } from '../fixtures/todo-openapi';

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
