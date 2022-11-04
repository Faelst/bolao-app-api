import z from 'zod'
import ShortUniqueId from 'short-unique-id'

import { FastifyInstance } from 'fastify'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'

export async function poolRoutes(fastify: FastifyInstance) {
  fastify.get('/polls/count', async () => {
    const count = await prisma.pool.count()
    return { count }
  })

  fastify.post('/polls', async (req, rep) => {
    const createPoolBody = z.object({
      title: z.string(),
    })

    const { title } = createPoolBody.parse(req.body)

    const generate = new ShortUniqueId({ length: 6 })

    const code = String(generate()).toUpperCase()

    let pool

    try {
      await req.jwtVerify()
      console.log('passando AQUI')
      pool = await prisma.pool.create({
        data: {
          title,
          code,
          ownerId: req.user.sub,
          participants: {
            create: {
              userId: req.user.sub,
            },
          },
        },
      })
    } catch (error) {
      pool = await prisma.pool.create({
        data: {
          title,
          code,
        },
      })
    }

    return rep.status(201).send(pool)
  })

  fastify.post(
    '/polls/join',
    { onRequest: [authenticate] },
    async (req, rep) => {
      const joinPollBody = z.object({
        code: z.string(),
      })

      const { code } = joinPollBody.parse(req.body)

      const poll = await prisma.pool.findUnique({
        where: { code },
        include: {
          participants: {
            where: {
              userId: req.user.sub,
            },
          },
        },
      })

      if (!poll) {
        return rep.status(400).send({ message: 'Poll not found.' })
      }

      if (poll.participants.length) {
        return rep.status(400).send({ message: 'User already register.' })
      }

      if (!poll.ownerId) {
        await prisma.pool.update({
          where: {
            id: poll.id,
          },
          data: {
            ownerId: req.user.sub,
          },
        })
      }

      await prisma.participant.create({
        data: {
          poolId: poll.id,
          userId: req.user.sub,
        },
      })

      return rep.status(201).send({ message: 'User register on poll.' })
    },
  )

  fastify.get('/polls', { onRequest: [authenticate] }, async (req, rep) => {
    const polls = await prisma.pool.findMany({
      where: {
        participants: {
          some: {
            userId: req.user.sub,
          },
        },
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
        participants: {
          select: {
            id: true,
            user: {
              select: {
                avatarURL: true,
              },
            },
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return {
      polls,
    }
  })

  fastify.get('/polls/:id', { onRequest: [authenticate] }, async (req, rep) => {
    const getPollParams = z.object({
      id: z.string(),
    })

    const { id } = getPollParams.parse(req.params)

    const poll = await prisma.pool.findUnique({
      where: {
        id,
      },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
        participants: {
          select: {
            id: true,
            user: {
              select: {
                avatarURL: true,
              },
            },
          },
          take: 4,
        },
        owner: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return { poll }
  })
}
