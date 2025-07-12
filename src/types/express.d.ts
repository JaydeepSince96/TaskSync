// src/types/express.d.ts
declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      email: string;
      name: string;
    };
  }
}

export {};
