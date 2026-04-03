import { Controller, Get, Post, UseGuards, Request, Res } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LocalAuthGuard } from './passport/local-auth.guard'
import type { Response } from 'express'
import { JwtAuthGuard } from './passport/jwt.guard'
import { db } from 'src/database/db'
import { eq } from 'drizzle-orm'
import { stores } from 'src/database/schema'

const AUTH_COOKIE_NAME = 'access_token'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user)
    const isProduction = process.env.NODE_ENV === 'production'

    res.cookie(AUTH_COOKIE_NAME, result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 4 * 60 * 60 * 1000,
      path: '/',
    })

    return result
  }

  @Post('logout')
  logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === 'production'

    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      path: '/',
    })

    return { message: 'Logout successful' }
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(
    @Request()
    req: {
      user?: { id?: string; name?: string; email?: string; storeId?: string }
    }
  ) {
    const storeId = req.user?.storeId

    if (!storeId) {
      return {
        ownerName: req.user?.name ?? 'Unknown owner',
        ownerEmail: req.user?.email ?? '',
        storeName: 'Unknown store',
        storeId: null,
      }
    }

    const store = await db.query.stores.findFirst({
      where: eq(stores.id, storeId),
    })

    return {
      ownerName: req.user?.name ?? 'Unknown owner',
      ownerEmail: req.user?.email ?? '',
      storeName: store?.name ?? 'Unknown store',
      storeId,
    }
  }
}
