// src/utils/auth-types.ts
import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
  };
}

export const getUserId = (req: Request): string | undefined => {
  return (req as any).user?.userId;
};
