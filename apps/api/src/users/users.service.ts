import { Injectable, Logger } from '@nestjs/common'
import { eq } from 'drizzle-orm'
import { AnalyticsService } from '../../src/analytics/analytics.service'
import { db } from '../../src/database/db'
import { type User, users, stores } from '../../src/database/schema'

export type AuthUser = {
  id: string
  name: string
  email: string
  password: string
  storeId?: string
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(AnalyticsService.name)

  async findByEmail(email: string): Promise<AuthUser | undefined> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      })

      const getStore = await db.query.stores.findFirst({
        where: eq(stores.ownerId, user?.id as string),
      })

      return user
        ? {
            id: user.id as string,
            name: user?.name as string,
            email: user?.email as string,
            password: user?.password as string,
            storeId: getStore?.id as string,
          }
        : undefined
    } catch (err) {
      this.logger.error(`Error while finding user by email: ${email}`, err)
      console.error('Error while finding the user:', err)
    }
  }
}
