declare global {
  namespace Express {
    interface Request {
      user?: {
        user_id: number;
        role: "admin" | "staff" | "student";
      };
    }
  }
}

export {};