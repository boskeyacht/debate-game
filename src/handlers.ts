import { FastifyReply, FastifyRequest, HookHandlerDoneFunction, RouteHandlerMethod } from "fastify";
import { PrismaClient } from '@prisma/client'
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

type NewUserRequest = FastifyRequest<{ Body: { username: string } }>

export function newUserHandler(prisma: PrismaClient) {
    return (async (req: NewUserRequest, res: FastifyReply) => {

        try {
            const queryUser = prisma.user.findUnique({
                where: {
                    username: req.body.username
                }
            })

            if (queryUser != null) {
                res.code(409).send('User already exists')
            }

        } catch {
            res.code(500).send('Error querying user')
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

            res.code(201).send(req.body.username)
        } catch {
            res.code(500).send('Error creating user')
        }
    })
}

type GetUserRequest = FastifyRequest<{ Params: { username: string } }>

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
            }

            res.code(200).send(user)

        } catch {
            res.code(500).send('Error querying user')
        }
    })
}

interface Argument {
    id: number,
    title: string,
    createdAt: string,
    updatedAt: string,
    author: User,
    authorId: number,
    debate: Debate,
    debateId: number,
}

interface User {
    id: number,
    email: string,
    username: string,
    createdAt: string,
    updatedAt: string,
    debates: Debate[],
    authoredDebates: Debate[],
    arguments: {}[],
}

interface Debate {
    id: number,
    title: string,
    createdAt: string,
    updatedAt: string,
    author: User | undefined,
    authorId: number,
    participants: User[] | undefined,
    arguments: Argument[] | undefined,
}


type UpdateUserRequest = FastifyRequest<{
    Params: { username: string },
    Body: {
        debate: Debate,
        authoredDebate: Debate,
        argument: Argument
    }
}>
//TODO: fix this
export function updateUserHandler(prisma: PrismaClient) {
    return (async (req: UpdateUserRequest, res: FastifyReply) => {
        try {
            const user = await prisma.user.findUnique({
                where: {
                    username: req.params.username
                }
            });

            if (!user) {
                throw new Error("User not found");
            }

            const debate = await prisma.debate.create({
                data: {
                    title: req.body.debate.title,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    authorId: user.id,
                    participants: {
                        connect: {
                            id: user.id,
                        },
                    },
                }
            });

            await prisma.user.update({
                where: {
                    username: req.params.username
                },
                data: {
                    updatedAt: new Date().toISOString(),
                }
            });

            res.send(debate);

        } catch (error) {
            console.log("Error creating debate: ", error)

            res.code(500).send(`Internal server error`)
        }
    })
}


type SearchUserRequest = FastifyRequest<{ Params: { id: string } }>

export function searchUserHandler(prisma: PrismaClient) {
    return (async (req: FastifyRequest, res: FastifyReply) => { })
}

type GetDebateRequest = FastifyRequest<{ Params: { id: string } }>

export function getDebateHandler(prisma: PrismaClient) {
    return (async (req: FastifyRequest, res: FastifyReply) => { })
}

type NewDebateRequest = FastifyRequest<{ Params: { id: string } }>

export function newDebateHandler(prisma: PrismaClient) {
    return (async (req: FastifyRequest, res: FastifyReply) => { })
}

type UpdateDebateRequest = FastifyRequest<{ Params: { id: string } }>

export function updateDebateHandler(prisma: PrismaClient) {
    return (async (req: FastifyRequest, res: FastifyReply) => { })
}

type SearchDebateRequest = FastifyRequest<{ Querystring: { username: string } }>

export function searchDebateHandler(prisma: PrismaClient) {
    return (async (req: SearchDebateRequest, res: FastifyReply) => { })
}

type GetTrendingDebateRequest = FastifyRequest<{ Querystring: { limit: number } }>

export function getTrendingDebatesHandler(prisma: PrismaClient) {
    return (async (req: GetTrendingDebateRequest, res: FastifyReply) => { })
}

type NewArgumentRequest = FastifyRequest<{ Params: { author: string, content: string } }>

export function newArgumentHandler(prisma: PrismaClient) {
    return (async (req: NewArgumentRequest, res: FastifyReply) => { })
}