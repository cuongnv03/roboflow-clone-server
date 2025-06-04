import { UserTokenPayload } from "../database/models/User";

declare global {
  namespace Express {
    interface Request {
      user?: UserTokenPayload;
    }
  }
}
