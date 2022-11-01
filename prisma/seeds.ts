import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query'],
})

async function main() {
  const user = await prisma.user.create({
    data: {
      name: 'John Dow',
      email: 'john.doe@gmail.com',
      avatarURL: 'https://github.com/faelst.png',
    },
  })

  const pool = await prisma.pool.create({
    data: {
      title: 'Example Pool',
      code: 'POOL_123',
      ownerId: user.id,

      participants: {
        create: {
          userId: user.id,
        },
      },
    },
  })

  await prisma.game.create({
    data: {
      date: new Date().toISOString(),
      firstTeamCountryCode: 'DE',
      secondTeamCountryCode: 'BR',
    },
  })

  await prisma.game.create({
    data: {
      date: new Date().toISOString(),
      firstTeamCountryCode: 'AR',
      secondTeamCountryCode: 'BR',
      guesses: {
        create: {
          firstTeamPoints: 2,
          secondTeamPoints: 1,
          participant: {
            connect: {
              userId_poolId: {
                userId: user.id,
                poolId: pool.id,
              },
            },
          },
        },
      },
    },
  })
}

main()
