export const jwtConstants = {
  get secret() {
    return "secret";
  },
  get expirationTime() {
    return process.env.JWT_EXPIRESIN;
  },
};
