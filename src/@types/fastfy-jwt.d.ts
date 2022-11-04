import '@fastify/jwt'

declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: {
      email: string
      name: string
      avatarURL: string
      sub: string
    }
  }
}
