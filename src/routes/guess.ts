import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'

export async function guessRoutes(fastify: FastifyInstance) {
  fastify.get('/guesses/count', async () => {
    const count = await prisma.guess.count()
    return { count }
  })

  fastify.post(
    '/polls/:pollId/games/:gameId/guesses',
    {
      onRequest: [authenticate],
    },
    async (req, rep) => {
      const createGuessParams = z.object({
        pollId: z.string(),
        gameId: z.string(),
      })

      const createGuessBody = z.object({
        firstTeamPoints: z.number(),
        secondTeamPoints: z.number(),
      })

      const { gameId, pollId } = createGuessParams.parse(req.params)
      const { firstTeamPoints, secondTeamPoints } = createGuessBody.parse(
        req.body,
      )

      const participant = await prisma.participant.findUnique({
        where: {
          userId_poolId: {
            poolId: pollId,
            userId: req.user.sub,
          },
        },
      })

      if (!participant) {
        return rep.status(400).send({
          message: 'You are not allowed to create a guess inside this pool.',
        })
      }

      const guess = await prisma.guess.findUnique({
        where: {
          participantId_gameId: {
            participantId: participant.id,
            gameId,
          },
        },
      })

      if (guess) {
        return rep.status(400).send({
          message: 'already sent a guess to this game on this poll.',
        })
      }

      const game = await prisma.game.findUnique({
        where: {
          id: gameId,
        },
      })

      if (!game) {
        return rep.status(400).send({
          message: 'Game not found.',
        })
      }

      if (game.date < new Date()) {
        return rep.status(400).send({
          message: 'Jogo ja realizado.',
        })
      }

      const guessCreated = await prisma.guess.create({
        data: {
          gameId,
          participantId: participant.id,
          firstTeamPoints,
          secondTeamPoints,
        },
      })

      return rep.status(201).send(guessCreated)
    },
  )
}
