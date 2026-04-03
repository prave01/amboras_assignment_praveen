import { Controller, Post, UseGuards, Request, Res } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { LocalAuthGuard } from "./passport/local-auth.guard";
import type { Response } from "express";

const AUTH_COOKIE_NAME = "access_token";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  @UseGuards(LocalAuthGuard)
  async login(@Request() req, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(req.user);
    const isProduction = process.env.NODE_ENV === "production";

    res.cookie(AUTH_COOKIE_NAME, result.access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 4 * 60 * 60 * 1000,
      path: "/",
    });

    return result;
  }

  @Post("logout")
  logout(@Res({ passthrough: true }) res: Response) {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/",
    });

    return { message: "Logout successful" };
  }
}
