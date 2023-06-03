import fs from 'fs'
import Fastify, { FastifyInstance, RouteShorthandOptions } from 'fastify'
import { Server, IncomingMessage, ServerResponse } from 'http'
import swagger from '@fastify/swagger'
import { PrismaClient } from '@prisma/client'
import Mixpanel from 'mixpanel';
import dotenv from 'dotenv'
import {
    newUserHandler,
    getUserHandler,
    getPrivateDebateHandler,
    newPrivateDebateHandler,
    postPrivateDebateArgumentHandler,
    getPublicDebateHandler,
    newPublicDebateHandler,
    postPublicDebateArgumentHandler,
    mixpanelLogger
} from './handlers.js'
import { collapseTextChangeRangesAcrossMultipleVersions } from 'typescript'

dotenv.config()


// TODO: handle empty mixpanel token case in middleware
async function main() {
    const server: FastifyInstance = Fastify({
        logger: true
    })

    const prisma = new PrismaClient()
    var mixpanel = Mixpanel.init(process.env.MIXPANEL_TOKEN ?? '');

    await server.register(swagger, {
        openapi: {
            info: {
                title: 'Test swagger',
                description: 'testing the fastify swagger api',
                version: '0.1.0'
            },
            servers: [{
                url: 'http://localhost'
            }],
            components: {
                securitySchemes: {
                    apiKey: {
                        type: 'apiKey',
                        name: 'apiKey',
                        in: 'header'
                    }
                }
            }
        },
        hideUntagged: true,
    })

    server.addHook('onRequest', await mixpanelLogger(mixpanel))

    server.addSchema({
        $id: 'user',
        type: 'object',
        properties: {
            id: {
                type: 'integer',
                description: 'user id'
            },
            username: {
                type: 'string',
                description: 'username'
            },
            email: {
                type: 'string',
                description: 'email'
            },
            password: {
                type: 'string',
                description: 'password'
            },
            createdAt: {
                type: 'string',
                description: 'date of creation'
            },
            updatedAt: {
                type: 'string',
                description: 'date of last update'
            },
            debates: {
                type: 'array',
                items: {
                    $ref: 'debate#'
                },
                description: 'debates'
            },
            arguments: {
                type: 'array',
                items: {
                    $ref: 'argument#'
                },
                description: 'arguments'
            }
        }
    })

    server.addSchema({
        $id: 'debate',
        type: 'object',
        properties: {
            id: {
                type: 'itneger',
                description: 'user id'
            },
            title: {
                type: 'string',
                description: 'debate title'
            },
            debateType: {
                type: 'string',
                description: 'debate type'
            },
            createdAt: {
                type: 'string',
                description: 'date of creation'
            },
            updatedAt: {
                type: 'string',
                description: 'date of last update'
            },
            author: {
                $ref: 'user#',
                description: 'author'
            },
            authorId: {
                type: 'integer',
                description: 'author id'
            },
            turnId: {
                type: 'integer',
                description: 'turn id'
            },
            arguments: {
                type: 'array',
                items: {
                    $ref: 'argument#',
                    description: 'arguments'
                },
                description: 'arguments'
            },
            participants: {
                type: 'array',
                items: {
                    $ref: 'user#',
                    description: 'participants'
                },

            }
        }
    })

    server.addSchema({
        $id: 'argument',
        type: 'object',
        properties: {
            id: {
                type: 'integer',
                description: 'user id'
            },
            content: {
                type: 'string',
                description: 'argument content'
            },
            createdAt: {
                type: 'string',
                description: 'date of creation'
            },
            updatedAt: {
                type: 'string',
                description: 'date of last update'
            },
            author: {
                $ref: 'user#',
                description: 'author'
            },
            authorId: {
                type: 'integer',
                description: 'author id'
            },
            debate: {
                $ref: 'debate#',
                description: 'debate'
            },
            debateId: {
                type: 'integer',
                description: 'debate id'
            },
        }
    })

    server.post('/users', {
        schema: {
            description: 'post some data',
            tags: ['users'],
            summary: 'qwerty',
            body: {
                type: 'object',
                properties: {
                    username: { type: 'string' },
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        username: { type: 'string' }
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, newUserHandler(prisma))

    server.get('/users/:username', {
        schema: {
            description: 'post some data',
            tags: ['users'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    username: {
                        type: 'string',
                        description: 'user username'
                    }
                }
            },
            response: {
                200: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        $ref: 'user#'
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, getUserHandler(prisma))

    // server.post('/users/:username', {
    //     schema: {
    //         description: 'post some data',
    //         tags: ['users',],
    //         summary: 'qwerty',
    //         params: {
    //             type: 'object',
    //             properties: {
    //                 username: {
    //                     type: 'string',
    //                     description: 'user username'
    //                 }
    //             }
    //         },
    //         body: {
    //             type: 'object',
    //             properties: {
    //                 $ref: 'user#'
    //             }
    //         },
    //         response: {
    //             200: {
    //                 description: 'Successful response',
    //                 type: 'object',
    //                 properties: {
    //                     id: { type: 'string' }
    //                 }
    //             },
    //             default: {
    //                 description: 'Default response',
    //                 type: 'object',
    //                 properties: {
    //                     message: { type: 'string' }
    //                 }
    //             }
    //         },
    //         security: [
    //             {
    //                 "apiKey": []
    //             }
    //         ]
    //     }
    // }, updateUserHandler(prisma))

    // server.get('/users/search', {
    //     schema: {
    //         description: 'post some data',
    //         tags: ['user', 'code'],
    //         summary: 'qwerty',
    //         params: {
    //             type: 'object',
    //             properties: {
    //                 id: {
    //                     type: 'string',
    //                     description: 'user id'
    //                 }
    //             }
    //         },
    //         body: {
    //             type: 'object',
    //             properties: {
    //                 hello: { type: 'string' },
    //                 obj: {
    //                     type: 'object',
    //                     properties: {
    //                         some: { type: 'string' }
    //                     }
    //                 }
    //             }
    //         },
    //         querystring: {
    //             type: 'object',
    //             properties: {
    //                 hello: { type: 'string' },
    //                 obj: {
    //                     type: 'object',
    //                     properties: {
    //                         some: { type: 'string' }
    //                     }
    //                 }
    //             }
    //         },
    //         response: {
    //             201: {
    //                 description: 'Successful response',
    //                 type: 'object',
    //                 properties: {
    //                     hello: { type: 'string' }
    //                 }
    //             },
    //             default: {
    //                 description: 'Default response',
    //                 type: 'object',
    //                 properties: {
    //                     foo: { type: 'string' }
    //                 }
    //             }
    //         },
    //         security: [
    //             {
    //                 "apiKey": []
    //             }
    //         ]
    //     }
    // }, searchUserHandler(prisma))

    server.post('/debates/private', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            body: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    authorUsername: { type: 'string' },
                    opponent: { type: 'string' },
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        $ref: 'debate#'
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, newPrivateDebateHandler(prisma))

    server.get('/debates/:id/private', {
        schema: {
            description: 'post some data',
            tags: ['debates'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'debate id'
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        $ref: 'debate#'
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        message: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, getPrivateDebateHandler(prisma))

    server.post('/debates/:id/arguments/private', {
        schema: {
            description: 'post some data',
            tags: ['debates'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'debate id',
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    argument: {
                        type: 'object',
                        properties: {
                            content: { type: 'string' },
                            authorUsername: { type: 'string' },
                        }
                    },
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        $ref: 'argument#'
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, postPrivateDebateArgumentHandler(prisma))

    server.post('/debates/public', {
        schema: {
            description: 'post some data',
            tags: ['user', 'code'],
            summary: 'qwerty',
            body: {
                type: 'object',
                properties: {
                    title: { type: 'string' },
                    authorUsername: { type: 'string' },
                    opponent: { type: 'string' },
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        $ref: 'debate#'
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, newPublicDebateHandler(prisma))

    server.get('/debates/:id/public', {
        schema: {
            description: 'post some data',
            tags: ['debates'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'debate id'
                    }
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        $ref: 'debate#'
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, getPublicDebateHandler(prisma))

    server.post('/debates/:id/arguments/public', {
        schema: {
            description: 'post some data',
            tags: ['debates'],
            summary: 'qwerty',
            params: {
                type: 'object',
                properties: {
                    id: {
                        type: 'string',
                        description: 'debate id',
                    }
                }
            },
            body: {
                type: 'object',
                properties: {
                    argument: {
                        type: 'object',
                        properties: {
                            content: { type: 'string' },
                            authorUsername: { type: 'string' },
                        }
                    },
                }
            },
            response: {
                201: {
                    description: 'Successful response',
                    type: 'object',
                    properties: {
                        $ref: 'argument#'
                    }
                },
                default: {
                    description: 'Default response',
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            },
            security: [
                {
                    "apiKey": []
                }
            ]
        }
    }, postPublicDebateArgumentHandler(prisma))

    // server.get('/debates/search', {
    //     schema: {
    //         description: 'post some data',
    //         tags: ['user', 'code'],
    //         summary: 'qwerty',
    //         params: {
    //             type: 'object',
    //             properties: {
    //                 id: {
    //                     type: 'string',
    //                     description: 'user id'
    //                 }
    //             }
    //         },
    //         body: {
    //             type: 'object',
    //             properties: {
    //                 hello: { type: 'string' },
    //                 obj: {
    //                     type: 'object',
    //                     properties: {
    //                         some: { type: 'string' }
    //                     }
    //                 }
    //             }
    //         },
    //         response: {
    //             201: {
    //                 description: 'Successful response',
    //                 type: 'object',
    //                 properties: {
    //                     hello: { type: 'string' }
    //                 }
    //             },
    //             default: {
    //                 description: 'Default response',
    //                 type: 'object',
    //                 properties: {
    //                     foo: { type: 'string' }
    //                 }
    //             }
    //         },
    //         security: [
    //             {
    //                 "apiKey": []
    //             }
    //         ]
    //     }
    // }, searchDebateHandler(prisma))

    // server.post('/debates/:id/arguments', {
    //     schema: {
    //         description: 'post some data',
    //         tags: ['debates'],
    //         summary: 'qwerty',
    //         params: {
    //             type: 'object',
    //             properties: {
    //                 id: {
    //                     type: 'string',
    //                     description: 'debate id'
    //                 }
    //             }
    //         },
    //         body: {
    //             type: 'object',
    //             properties: {
    //                 content: { type: 'string' },
    //                 author: { type: 'string' },
    //             }
    //         },
    //         response: {
    //             201: {
    //                 description: 'Successful response',
    //                 type: 'object',
    //                 properties: {
    //                     hello: { type: 'string' }
    //                 }
    //             },
    //             default: {
    //                 description: 'Default response',
    //                 type: 'object',
    //                 properties: {
    //                     message: { type: 'string' }
    //                 }
    //             }
    //         },
    //         security: [
    //             {
    //                 "apiKey": []
    //             }
    //         ]
    //     }
    // }, newArgumentHandler(prisma))

    fs.writeFileSync('../swagger.yml', server.swagger({ yaml: true }))

    const start = async () => {
        try {
            console.log("📣 Starting server on port 3333\n")

            await server.listen({ port: 3333 })
        } catch (err) {
            server.log.error(err)

            process.exit(1)
        }
    }


    await start()
}

main()