import { FastifyBaseLogger as Logger, FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { Argument, Debate, PrismaClient, User } from '@prisma/client'
import { Mixpanel } from "mixpanel";
import path from 'path';
import fs from 'fs';
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

export function newUserHandler(prisma: PrismaClient, logger: Logger) {
    return (async (req: NewUserRequest, res: FastifyReply) => {
        try {
            const queryUser = await prisma.user.findUnique({
                where: {
                    username: req.body.username
                }
            })

            if (queryUser != null) {
                logger.error(`User ${req.body.username} already exists`)

                res.code(409).send({
                    error: 'Conflict',
                    message: 'User already exists'
                })

                return
            }

        } catch (e) {
            logger.error(`Error querying user: ${e}`)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error querying user'
            })

            return
        }

        try {
            const user = await prisma.user.create({
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
                    username: req.body.username,
                }
            })

            return
        } catch (e) {
            logger.error(`Error creating user: ${e}`)

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

export function getUserHandler(prisma: PrismaClient, logger: Logger) {
    return (async (req: GetUserRequest, res: FastifyReply) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    username: req.params.username
                }
            })

            if (user == null) {
                logger.error(`User ${req.params.username} not found`)

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
            logger.error(`Error querying user: ${e}`)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error querying user'
            })

            return
        }
    })
}

type NewPrivateDebateRequest = FastifyRequest<{
    Body: {
        title: string,
        opponent: string,
        authorUsername: string,
    }
}>

export function newPrivateDebateHandler(prisma: PrismaClient, logger: Logger) {
    return (async (req: NewPrivateDebateRequest, res: FastifyReply) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    username: req.body.authorUsername
                }
            })

            if (user == null) {
                logger.error(`User ${req.body.authorUsername} not found`)

                res.code(404).send({
                    error: 'Bad request',
                    message: 'User not found'
                })

                return
            }

            const opponent = await prisma.user.findUnique({
                where: {
                    username: req.body.opponent
                }
            })

            if (opponent == null) {
                logger.error(`Opponent ${req.body.opponent} not found`)

                res.code(404).send({
                    error: 'Bad request',
                    message: 'Opponent not found'
                })

                return
            }

            const debate = await prisma.debate.create({
                data: {
                    title: 'title',
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authorUsername: user.username,
                    turnUsername: user.username,
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
            logger.error(`Error creating debate`)

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

export function getPrivateDebateHandler(prisma: PrismaClient, logger: Logger) {
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
                logger.error(`Debate ${req.params.id} not found`)

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
            logger.error(`Error querying debate: ${e}`)

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
            authorUsername: string,
        },
    }
}>

export function postPrivateDebateArgumentHandler(prisma: PrismaClient, logger: Logger) {
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
                logger.error(`Debate ${req.params.id} not found`)

                res.code(404).send({
                    error: 'Not found',
                    message: 'Debate not found'
                })

                return
            }

            if (debate.turnUsername != req.body.argument.authorUsername) {
                logger.error(`It is not ${req.body.argument.authorUsername}'s turn to post an argument`)

                res.code(403).send({
                    error: 'Forbidden',
                    message: 'User is not allowed to post an argument'
                })

                return
            }

        } catch (e) {
            logger.error(`Error querying debate: ${e}`)

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
                    authorUsername: req.body.argument.authorUsername,
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
                logger.error(`Error connecting argument to debate: ${e}`)

                res.code(500).send({
                    error: 'Internal server error',
                    message: 'Error connecting argument to debate'
                })

                return
            }

            try {
                await prisma.user.update({
                    where: {
                        username: req.body.argument.authorUsername
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
                logger.error(`Error connecting argument to user: ${e}`)

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
                            turnUsername: debate.participants.find((participant) => participant.username !== debate?.turnUsername)?.username

                        }
                    });
                } else {
                    logger.error(`Error updating debate ${req.params.id}`)

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
                logger.error(`Error creating argument: ${e}`)

                res.code(500).send({
                    error: 'Internal server error',
                    message: 'Error creating argument'
                })

                return
            }

        } catch (e) {
            logger.error(`Error creating argument: ${e}`)

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
        authorUsername: string,
    }
}>

export function newPublicDebateHandler(prisma: PrismaClient, logger: Logger) {
    return (async (req: NewPublicDebateRequest, res: FastifyReply) => {
        try {
            const debate = await prisma.debate.create({
                data: {
                    title: req.params.title,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authorUsername: req.params.authorUsername,
                    turnUsername: req.params.authorUsername,
                    debateType: "PUBLIC",
                    participants: {
                        connect: {
                            username: req.params.authorUsername,
                        },
                    },
                }
            });

            try {
                await prisma.user.update({
                    where: {
                        username: req.params.authorUsername
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
                logger.error(`Error connecting debate to user: ${e}`)

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
            logger.error(`Error creating debate: ${e}`)

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

export function getPublicDebateHandler(prisma: PrismaClient, logger: Logger) {
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
                logger.error(`Debate ${req.params.id} not found`)

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
            logger.error(`Error creating debate: ${e}`)

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
            authorUsername: string,
        }
    }
}>

export function postPublicDebateArgumentHandler(prisma: PrismaClient, logger: Logger) {
    return (async (req: PostPublicDebateArgumentRequest, res: FastifyReply) => {
        try {
            const argument = await prisma.argument.create({
                data: {
                    content: req.body.argument.content,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authorUsername: req.body.argument.authorUsername,
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
                logger.error(`Error connecting argument to debate: ${e}`)

                res.code(500).send({
                    error: 'Internal server error',
                    message: 'Error connecting argument to debate'
                })

                return
            }

            try {
                await prisma.user.update({
                    where: {
                        username: req.body.argument.authorUsername
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
                logger.error(`Error connecting argument to user: ${e}`)

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
            logger.error(`Error creating debate: ${e}`)

            res.code(500).send({
                error: 'Internal server error',
                message: 'Error creating debate'
            })

            return
        }
    })
}

export function aiPluginHandler() {
    return (async (req: FastifyRequest, res: FastifyReply) => {
        res.code(200).send({
            schema_version: "v1",
            name_for_human: "Debate Game",
            name_for_model: "Debate Game with Judge",
            description_for_human: "Need to debate with a friend about something? Want to test your debate skills against the public? Debate with anyone about anything with Debate Game!",
            description_for_model: "Enables two different forms of debate. The first being, two users can engage in a debate in which you are the judge, users choose the topic, and are each given two chances to make their case. After each user has made their case, you can decide who made the better argument. The user with the most points at the end of the debate wins. The second form enables a public debate with a leaderboard, where anyone can post an argument to a debate with a predetermined topic. When judging the arguments, make sure to consider relevance, clarity, evidence, and persuasiveness.",
            auth: {
                type: "none"
            },
            api: {
                type: "openapi",
                url: "http://localhost:3333/openapi.yaml"
            },
            logo_url: "http://localhost:3333/logo.png",
            contact_email: "support@example.com",
            legal_info_url: "http://localhost:3333/legal"
        })

        return
    })
}

export function logoHandler(logger: Logger) {
    return (async (request: FastifyRequest, reply: FastifyReply) => {
        const imagePath = path.join(__dirname, '../../assets/debaters-2.png');

        fs.readFile(imagePath, (e, data) => {
            if (e) {
                logger.error(`Error reading image: ${e}`)

                reply.code(500).send({
                    error: "Internal server error",
                    message: e
                });

                return
            } else {
                reply.type('image/jpeg').send(data);

                return
            }
        });
    })
}

export function legalHandler() {
    return (async (request: FastifyRequest, reply: FastifyReply) => {
        reply.code(200).send(`Introduction
        This legal disclaimer applies to the usage of the "The Debate Game Plugin" (hereinafter referred to as the "Plugin") hosted on XXXXX By using the Plugin, you accept and agree to be bound by the terms and conditions set forth in this legal disclaimer.
        
        Purpose
        The Plugin is designed to provide relevant news information based on user input. It is intended for general informational purposes only and should not be considered as a substitute for personal research, preferences, or professional advice.
        
        Accuracy and Completeness
        While we strive to provide accurate, up-to-date, and complete information, we make no warranties or representations regarding the accuracy, completeness, or reliability of the information provided by the Plugin. Users are encouraged to verify the information with the respective establishments before making any decisions based on the recommendations provided by the Plugin.
        
        Limitation of Liability
        To the fullest extent permitted by law, we shall not be liable for any direct, indirect, incidental, special, consequential, or exemplary damages, including but not limited to damages for loss of profits, goodwill, use, data, or other intangible losses resulting from the use of or inability to use the Plugin, even if we have been advised of the possibility of such damages.
        
        Third-Party Content and Links
        The Plugin may provide links to third-party websites or resources. We are not responsible for the content or availability of such websites or resources and do not endorse or assume any responsibility for any content, products, or services available on or through such websites or resources. Users acknowledge and agree that we shall not be responsible or liable, directly or indirectly, for any damage or loss caused or alleged to be caused by or in connection with the use of or reliance on any such content, products, or services available on or through any such website or resource.
        
        Copyright
        All content provided by the Plugin, including but not limited to text, graphics, images, and logos, is the property of the Plugin's owner or its content providers and is protected by international copyright laws. Unauthorized use, reproduction, or distribution of this content is strictly prohibited.
        
        Changes to the Legal Disclaimer
        We reserve the right to modify this legal disclaimer at any time without prior notice. Users are responsible for regularly reviewing this legal disclaimer to stay informed about any changes. Continued use of the Plugin after any modifications to this legal disclaimer constitutes acceptance of the revised terms and conditions.
        
        Governing Law
        This legal disclaimer shall be governed by and construed in accordance with the laws of the jurisdiction in which the Plugin's owner is located. Users agree to submit to the exclusive jurisdiction of the courts of that jurisdiction for the resolution of any disputes arising from or in connection with this legal disclaimer or the use of the Plugin.
        
        Contact Information
        For any questions, concerns, or comments regarding this legal disclaimer, please contact us at jabari@pulp.chat.`);

        return

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
//             authorUsername: number,
//             participants: User[],
//         },
//         argument: {
//             title: string,
//             content: string,
//             authorUsername: number,
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
//                             authorUsername: user.id,
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
//                             authorUsername: user.id,
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