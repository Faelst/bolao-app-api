import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../lib/prisma'
import { authenticate } from '../plugins/authenticate'

export async function authRoutes(fastify: FastifyInstance) {
  fastify.post('/users', async (req) => {
    const createUserBody = z.object({
      accessToken: z.string(),
    })

    const { accessToken } = createUserBody.parse(req.body)

    const userResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    )

    const userData = await userResponse.json()

    const userInfoSchema = z.object({
      id: z.string(),
      email: z.string().email(),
      name: z.string(),
      picture: z.string().url(),
    })

    const userInfo = userInfoSchema.parse(userData)

    let user = await prisma.user.findUnique({
      where: {
        googleId: userInfo.id,
      },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: userInfo.email,
          name: userInfo.name,
          avatarURL: userInfo.picture,
          googleId: userInfo.id,
        },
      })
    }

    const token = fastify.jwt.sign(
      {
        email: user.email,
        name: user.name,
        avatarURL: user.avatarURL,
      },
      { sub: user.id, expiresIn: '1 days' },
    )

    return {
      token,
    }
  })

  fastify.get('/me', { onRequest: [authenticate] }, async (req) => {
    return {
      user: req.user,
    }
  })
}
