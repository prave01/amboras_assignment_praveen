import { Expose, plainToInstance } from "class-transformer";
import { IsNotEmpty } from "class-validator";
import { type AuthUser } from "src/users/users.service";

export class ReqDto {
  @Expose()
  @IsNotEmpty()
  user: AuthUser;
}
