import Fastify from 'fastify'
import jwt from '@fastify/jwt'
import cors from '@fastify/cors'
import { poolRoutes } from './routes/polls'
import { userRoutes } from './routes/users'
import { guessRoutes } from './routes/guess'
import { authRoutes } from './routes/auth'
import { gameRoute } from './routes/game'

async function bootstrap() {
  const fastify = Fastify({
    logger: true,
  })

  await fastify.register(jwt, {
    secret: 'secret-hash-test',
  })

  await fastify.register(cors, {
    origin: true,
  })

  await fastify.register(authRoutes)
  await fastify.register(poolRoutes)
  await fastify.register(userRoutes)
  await fastify.register(guessRoutes)
  await fastify.register(gameRoute)

  await fastify.listen({ port: 3333, host: '0.0.0.0' })
}

bootstrap()
