export namespace Components {
  export namespace RequestBodies {
    export type CreateTodo = Schemas.Todo;
  }
  export namespace Responses {
    export interface CreateTodo {
      /**
       * example:
       * abcdef1234565789
       */
      id?: number;
    }
    export type GenericError = Schemas.GenericError;
    export interface GetHelloV1 {
      /**
       * example:
       * Hello, jonathan
       */
      greeting?: string;
    }
    export type GetTodo = Schemas.Todo;
    export interface GetTodoList {
      todos?: Schemas.Todo[];
    }
    export interface OpenApiValidationError {
      message: string;
      errors: {
        /**
         * example:
         * .body.schedule.monday.close
         */
        path: string;
        /**
         * example:
         * request.body.schedule.monday should have required property 'close'
         */
        message: string;
        /**
         * example:
         * required.openapi.validation
         */
        errorCode: string;
      }[];
    }
  }
  export namespace Schemas {
    export interface GenericError {
      /**
       * example:
       * 404
       */
      status?: number;
      /**
       * example:
       * Todo not found
       */
      message?: string;
      errors?: {}[];
    }
    export interface Todo {
      id?: number;
      description: string;
      category: 'Shopping' | 'Home' | 'Work';
    }
  }
}
export namespace Paths {
  export namespace V1Todo {
    export namespace Get {
      export namespace Responses {
        export type $200 = Components.Responses.GetTodoList;
      }
    }
    export namespace Post {
      export type RequestBody = Components.RequestBodies.CreateTodo;
      export namespace Responses {
        export type $201 = Components.Responses.CreateTodo;
      }
    }
  }
  export namespace V1Todo$Id {
    export namespace Get {
      export namespace Parameters {
        export type Id = number;
      }
      export interface PathParameters {
        id: Parameters.Id;
      }
      export namespace Responses {
        export type $200 = Components.Responses.GetTodo;
        export type $400 = Components.Responses.OpenApiValidationError;
        export type $404 = Components.Responses.GenericError;
      }
    }
  }
  export namespace V2Hello {
    export namespace Get {
      export namespace Parameters {
        export type Foo = boolean;
      }
      export interface QueryParameters {
        foo?: Parameters.Foo;
      }
    }
  }
}
