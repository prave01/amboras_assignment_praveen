import { Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { db } from "src/database/db";
import { type User, users } from "src/database/schema";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  password: string;
};

@Injectable()
export class UsersService {
  async findByEmail(email: string): Promise<AuthUser | undefined> {
    try {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      return user
        ? {
          id: user.id as string,
          name: user?.name as string,
          email: user?.email as string,
          password: user?.password as string,
        }
        : undefined;
    } catch (err) {
      console.error("Error while finding the user:", err);
    }
  }
}
