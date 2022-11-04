import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'

export async function gameRoute(fastify: FastifyInstance) {
  fastify.get(
    '/polls/:id/games',
    {
      onRequest: [authenticate],
    },
    async (req, rep) => {
      const getPollParams = z.object({
        id: z.string(),
      })

      const { id } = getPollParams.parse(req.params)

      const games = await prisma.game.findMany({
        orderBy: {
          date: 'desc',
        },
        include: {
          guesses: {
            where: {
              participant: {
                userId: req.user.sub,
                poolId: id,
              },
            },
          },
        },
      })

      return {
        games: games.map((game) => ({
          ...game,
          guess: game.guesses.length ? game.guesses[0] : null,
          guesses: undefined,
        })),
      }
    },
  )
}
