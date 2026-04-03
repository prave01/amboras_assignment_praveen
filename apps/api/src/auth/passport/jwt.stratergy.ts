import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { jwtConstants } from "./jwt.constants";

const AUTH_COOKIE_NAME = "access_token";

const extractJwtFromCookie = (req: { headers?: { cookie?: string } }) => {
  const cookieHeader = req?.headers?.cookie;
  if (!cookieHeader) {
    return null;
  }

  const cookie = cookieHeader
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${AUTH_COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.substring(AUTH_COOKIE_NAME.length + 1));
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        extractJwtFromCookie,
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret as string,
    });
  }

  async validate(payload: any) {
    return {
      sub: payload.sub,
      name: payload.name,
      email: payload.email,
      storeId: payload.storeId,
    };
  }
}
