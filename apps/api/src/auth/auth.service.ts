import { Injectable } from '@nestjs/common';
import { AuthUser, UsersService } from 'src/users/users.service';
import bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { stores } from 'src/database/schema';

@Injectable()
export class AuthService {
  constructor(
    private userServices: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userServices.findByEmail(email);
    const verify = await bcrypt.compare(password, user?.password as string);

    if (user) {
      if (verify) {
        const { password, ...result } = user;
        return result;
      }
      console.error('Invalid Password');
      return null;
    }
    return null;
  }

  async login(user: AuthUser) {
    const payload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      storeId: user.storeId,
    };
    const access_token = await this.jwtService.signAsync(payload);
    return { message: 'Login successful', access_token };
  }
}
