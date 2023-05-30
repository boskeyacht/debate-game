import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http'
import swagger from '@fastify/swagger'
import {
    newUserHandler,
    getUserHandler,
    updateUserHandler,
    searchUserHandler,
    getDebateHandler,
    newDebateHandler,
    updateDebateHandler,
    searchDebateHandler,
    getTrendingDebatesHandler,
    newArgumentHandler,
} from './handlers'

async function main() {
    const server: FastifyInstance = Fastify({
        logger: true
    })

    await server.register(swagger, {
        swagger: {
            info: {
                title: 'Debate Game API',
                description: 'API for the Debate Game',
                version: '0.1.0'
            },
            externalDocs: {
                url: 'https://swagger.io',
                description: 'Find more info here'
            },
            host: 'localhost',
            schemes: ['http'],
            consumes: ['application/json'],
            produces: ['application/json'],
            tags: [
                { name: 'users', description: 'Users related end-points' },
                { name: 'debates', description: 'Debates related end-points' }
            ],
            definitions: {
                User: {
                    type: 'object',
                    required: ['id', 'email'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        email: { type: 'string', format: 'email' }
                    }
                }
            },
            securityDefinitions: {
                apiKey: {
                    type: 'apiKey',
                    name: 'apiKey',
                    in: 'header'
                }
            }
        }
    })

    server.post('/users', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, newUserHandler())

    server.get('/users/:id', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, getUserHandler())

    server.post('/users/:id', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, updateUserHandler())

    server.get('/users/search', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, searchUserHandler())

    server.get('/debates/:id', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, getDebateHandler())

    server.post('/debates', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, newDebateHandler())

    server.post('/debates/:id/', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, updateDebateHandler())

    server.get('/debates/search', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, searchDebateHandler())

    server.get('/debates/trending', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, getTrendingDebatesHandler())

    server.post('/debates/:id/arguments', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'user id'
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    hello: { type: 'string' },
                    obj: {
                        type: 'object',
                        properties: {
                            some: { type: 'string' }
                        }
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        hello: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        foo: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, newArgumentHandler())

    require('fs').writeFileSync('./docs/swagger.yml', server.swagger({ yaml: true }))

    const start = async () => {
        try {
            await server.listen({ port: 3333 })
        } catch (err) {
            server.log.error(err)
            process.exit(1)
        }
    }


    await start()
}