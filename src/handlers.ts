import { FastifyReply, FastifyRequest, HookHandlerDoneFunction, RouteHandlerMethod } from "fastify";
import { Argument, Debate, PrismaClient, User } from '@prisma/client'
import { Mixpanel } from "mixpanel";
import { v4 as uuidv4 } from 'uuid';

export async function mixpanelLogger(mixpanel: Mixpanel) {
    return (async (req: FastifyRequest, res: FastifyReply, done: HookHandlerDoneFunction) => {
        console.log(req)

        mixpanel.track('request', {
            distinct_id: uuidv4(),
            ip: req.ip,
        })

        done()
    })
}

type NewUserRequest = FastifyRequest<{
    Body: {
        username: string
    }
}>

export function newUserHandler(prisma: PrismaClient) {
    return (async (req: NewUserRequest, res: FastifyReply) => {

        try {
            const queryUser = prisma.user.findUnique({
                where: {
                    username: req.body.username
                }
            })

            if (queryUser != null) {
                res.code(409).send({
                    error: 'Conflict',
                    message: 'User already exists'
                })

                return
            }

        } catch (e) {
            console.log("Error querying user: ", e)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error querying user'
            })

            return
        }

        try {
            const user = prisma.user.create({
                data: {
                    username: req.body.username,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    email: '',
                }
            })

            res.code(201).send({
                data:
                {
                    id: req.body.username,
                }
            })

            return
        } catch (e) {
            console.log("Error creating user: ", e)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error creating user'
            })

            return
        }
    })
}

type GetUserRequest = FastifyRequest<{
    Params: {
        username: string
    }
}>

export function getUserHandler(prisma: PrismaClient) {
    return (async (req: GetUserRequest, res: FastifyReply) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    username: req.params.username
                }
            })

            if (user == null) {
                res.code(404).send('User not found')

                return
            }

            res.code(200).send({
                data: {
                    user: user
                }
            })

            return

        } catch (e) {
            console.log("Error querying user: ", e)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error querying user'
            })

            return
        }
    })
}

type NewPrivateDebateRequest = FastifyRequest<{
    Params: {
        id: string,
        title: string,
        opponent: string,
    }
}>

export function newPrivateDebateHandler(prisma: PrismaClient) {
    return (async (req: NewPrivateDebateRequest, res: FastifyReply) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    username: req.params.id
                }
            })

            if (user == null) {
                res.code(404).send({
                    error: 'Not found',
                    message: 'User not found'
                })

                return
            }

            const opponent = await prisma.user.findUnique({
                where: {
                    username: req.params.opponent
                }
            })

            if (opponent == null) {
                res.code(404).send({
                    error: 'Not found',
                    message: 'Opponent not found'
                })

                return
            }

            const debate = await prisma.debate.create({
                data: {
                    title: 'title',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authorId: user.id,
                    debateType: "PRIVATE",
                    participants: {
                        connect: [
                            {
                                id: user.id,
                            },
                            {
                                id: opponent.id,
                            }
                        ]
                    },
                }
            })

            res.code(201).send({
                data: {
                    debate: debate
                }
            })

            return

        } catch {
            console.log("Error creating debate")

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error creating debate'
            })

            return
        }
    })
}

type GetPrivateDebateRequest = FastifyRequest<{
    Params: {
        id: string
    }
}>

export function getPrivateDebateHandler(prisma: PrismaClient) {
    return (async (req: GetPrivateDebateRequest, res: FastifyReply) => {
        try {
            const debate = await prisma.debate.findUnique({
                where: {
                    id: parseInt(req.params.id)
                },
                include: {
                    arguments: true,
                    participants: true,
                }
            })

            if (debate == null) {
                res.code(404).send({
                    error: 'Not found',
                    message: 'Debate not found'
                })

                return
            }

            res.code(200).send({
                data: {
                    debate: debate
                }
            })

            return

        } catch (e) {
            console.log("Error querying debate: ", e)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error querying debate'
            })

            return
        }
    })
}

type PostPrivateDebateArgumentRequest = FastifyRequest<{
    Params: {
        id: string
    },
    Body: {
        argument: {
            content: string,
            authorId: number,
        },
    }
}>

export function postPrivateDebateArgumentHandler(prisma: PrismaClient) {
    return (async (req: PostPrivateDebateArgumentRequest, res: FastifyReply) => {
        var debate: Debate & { arguments: Argument[]; participants: User[]; } | null;

        try {
            debate = await prisma.debate.findUnique({
                where: {
                    id: parseInt(req.params.id)
                },
                include: {
                    arguments: true,
                    participants: true,
                }
            })

            if (debate == null) {
                console.log(`Debate ${req.params.id} not found`)

                res.code(404).send({
                    error: 'Not found',
                    message: 'Debate not found'
                })

                return
            }

            if (debate.turnId != req.body.argument.authorId) {
                console.log(`It is not ${req.body.argument.authorId}'s turn to post an argument`)

                res.code(403).send({
                    error: 'Forbidden',
                    message: 'User is not allowed to post an argument'
                })

                return
            }

        } catch (e) {
            console.log("Error querying debate: ", e)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error querying debate'
            })

            return
        }

        try {
            const argument = await prisma.argument.create({
                data: {
                    content: req.body.argument.content,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authorId: req.body.argument.authorId,
                    debateId: parseInt(req.params.id),
                }
            });

            try {
                await prisma.debate.update({
                    where: {
                        id: parseInt(req.params.id)
                    },
                    data: {
                        arguments: {
                            connect: {
                                id: argument.id
                            }
                        }
                    }
                });

            } catch (e) {
                console.log("Error connecting argument to debate: ", e)

                res.code(500).send({
                    error: 'Internal server error',
                    message: 'Error connecting argument to debate'
                })

                return
            }

            try {
                await prisma.user.update({
                    where: {
                        id: req.body.argument.authorId
                    },
                    data: {
                        arguments: {
                            connect: {
                                id: argument.id
                            }
                        }
                    }
                });

            } catch (e) {
                console.log("Error connecting argument to user: ", e)

                res.code(500).send({
                    error: 'Internal server error',
                    message: 'Error connecting argument to user'
                })

                return
            }

            try {
                if (debate !== null) {
                    await prisma.debate.update({
                        where: {
                            id: debate.id
                        },
                        data: {
                            turnId: debate.participants.find((participant) => participant.id !== debate?.turnId)?.id

                        }
                    });
                } else {
                    console.log("Error updating debate")

                    res.code(500).send({
                        error: 'Internal server error',
                        message: 'Error updating debate'
                    })

                    return
                }


                res.code(201).send({
                    data: {
                        argument: argument
                    }
                });

                return

            } catch (e) {
                console.log("Error creating argument: ", e)

                res.code(500).send({
                    error: 'Internal server error',
                    message: 'Error creating argument'
                })

                return
            }

        } catch (e) {
            console.log("Error creating argument: ", e)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error creating argument'
            })

            return
        }
    })
}


type NewPublicDebateRequest = FastifyRequest<{
    Params: {
        title: string,
        authorId: number,
    }
}>

export function newPublicDebateHandler(prisma: PrismaClient) {
    return (async (req: NewPublicDebateRequest, res: FastifyReply) => {
        try {
            const debate = await prisma.debate.create({
                data: {
                    title: req.params.title,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authorId: req.params.authorId,
                    debateType: "PUBLIC",
                    participants: {
                        connect: {
                            id: req.params.authorId,
                        },
                    },
                }
            });

            try {
                await prisma.user.update({
                    where: {
                        id: req.params.authorId
                    },
                    data: {
                        debates: {
                            connect: {
                                id: debate.id,
                            },
                        },
                    }
                });

            } catch (e) {
                console.log("Error connecting debate to user: ", e)

                res.code(500).send({
                    error: 'Internal server error',
                    message: 'Error connecting debate to user'
                })

                return
            }

            res.code(201).send({
                data: {
                    debate: debate
                }
            });

            return

        } catch (e) {
            console.log("Error creating debate: ", e)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error creating debate'
            })

            return
        }
    })
}

type GetPublicDebateRequest = FastifyRequest<{
    Params: {
        id: string
    }
}>

export function getPublicDebateHandler(prisma: PrismaClient) {
    return (async (req: GetPublicDebateRequest, res: FastifyReply) => {
        try {
            const debate = await prisma.debate.findUnique({
                where: {
                    id: parseInt(req.params.id)
                },
                include: {
                    arguments: true,
                    participants: true,
                }
            });

            if (!debate) {
                console.log('Debate ${req.params.id} not found')

                res.code(404).send({
                    error: 'Bad request',
                    message: 'Debate ${req.params.id} not found'
                })

                return
            }

            res.code(200).send({
                data: {
                    debate: debate
                }
            });

            return

        } catch (e) {
            console.log("Error creating debate: ", e)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error creating debate'
            })

            return
        }
    })
}

type PostPublicDebateArgumentRequest = FastifyRequest<{
    Params: {
        id: string
    },
    Body: {
        argument: {
            content: string,
            authorId: number,
        }
    }
}>

export function postPublicDebateArgumentHandler(prisma: PrismaClient) {
    return (async (req: PostPublicDebateArgumentRequest, res: FastifyReply) => {
        try {
            const argument = await prisma.argument.create({
                data: {
                    content: req.body.argument.content,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authorId: req.body.argument.authorId,
                    debateId: parseInt(req.params.id),
                }
            });

            try {
                await prisma.debate.update({
                    where: {
                        id: parseInt(req.params.id)
                    },
                    data: {
                        arguments: {
                            connect: {
                                id: argument.id
                            }
                        }
                    }
                });

            } catch (e) {
                console.log("Error connecting argument to debate: ", e)

                res.code(500).send({
                    error: 'Internal server error',
                    message: 'Error connecting argument to debate'
                })

                return
            }

            try {
                await prisma.user.update({
                    where: {
                        id: req.body.argument.authorId
                    },
                    data: {
                        arguments: {
                            connect: {
                                id: argument.id
                            }
                        }
                    }
                });

            } catch (e) {
                console.log("Error connecting argument to user: ", e)

                res.code(500).send({
                    error: 'Internal server error',
                    message: 'Error connecting argument to user'
                })

                return
            }

            res.code(201).send({
                data: {
                    argument: argument
                }
            });

            return

        } catch (e) {
            console.log("Error creating debate: ", e)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error creating debate'
            })

            return
        }
    })
}

// type SearchDebateRequest = FastifyRequest<{
//     Querystring: {
//         username: string
//     }
// }>

// export function searchDebateHandler(prisma: PrismaClient) {
//     return (async (req: SearchDebateRequest, res: FastifyReply) => { })
// }


// type SearchUserRequest = FastifyRequest<{
//     Params: {
//         id: string
//     }
// }>

// export function searchUserHandler(prisma: PrismaClient) {
//     return (async (req: SearchUserRequest, res: FastifyReply) => { })
// }

// type UpdateUserRequest = FastifyRequest<{
//     Params: { username: string },
//     Body: {
//         debate: {
//             title: string,
//             debateType: string,
//             authorId: number,
//             participants: User[],
//         },
//         argument: {
//             title: string,
//             content: string,
//             authorId: number,
//             debateId: number,
//         }
//     }
// }>
// //TODO: fix this
// export function updateUserHandler(prisma: PrismaClient) {
//     return (async (req: UpdateUserRequest, res: FastifyReply) => {
//         try {
//             const user = await prisma.user.findUnique({
//                 where: {
//                     username: req.params.username
//                 }
//             });

//             if (!user) {
//                 throw new Error("User not found");
//             }
//             var debate;

//             switch (req.body.debate.debateType) {
//                 case "PUBLIC":
//                     debate = await prisma.debate.create({
//                         data: {
//                             title: req.body.debate.title,
//                             createdAt: new Date().toISOString(),
//                             updatedAt: new Date().toISOString(),
//                             authorId: user.id,
//                             debateType: "PUBLIC",
//                             participants: {
//                                 connect: {
//                                     id: user.id,
//                                 },
//                             },
//                         }
//                     });

//                     break;

//                 case "PRIVATE":
//                     debate = await prisma.debate.create({
//                         data: {
//                             title: req.body.debate.title,
//                             createdAt: new Date().toISOString(),
//                             updatedAt: new Date().toISOString(),
//                             authorId: user.id,
//                             debateType: "PRIVATE",
//                             participants: {
//                                 connect: {
//                                     id: user.id,
//                                 },
//                             },
//                         }
//                     });

//                     break;

//                 default:
//                     throw new Error("Invalid debate type");
//             }

//             await prisma.user.update({
//                 where: {
//                     username: req.params.username
//                 },
//                 data: {
//                     updatedAt: new Date().toISOString(),
//                 }
//             });

//             res.send(debate);

//         } catch (error) {
//             console.log("Error creating debate: ", error)

//             res.code(500).send('Internal server error')
//         }
//     })
// }