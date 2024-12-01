import { Request, Response, NextFunction } from "express";
import { UserTable } from "../schema/schema";
import db from "../db";
import { eq } from "drizzle-orm";
import jwt, { JwtPayload } from "jsonwebtoken";

interface JwtPayloadWithUserId extends JwtPayload {
  userId: string; 
}

const JWT_SECRET = process.env.JWT_SECRET!;

// Middleware to check if user exists
const checkUserExists = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = req.params.id;
    const jwTtoken = jwt.verify(id, JWT_SECRET!) as JwtPayloadWithUserId;

    if (!jwTtoken) {
      res.status(500).json({ message: "Token Expired !" });
      return;
    }

    // Query the database to check if the user exists
    const user = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, parseInt(jwTtoken.userId)));

    if (user.length === 0) {
      // If no user is found, send a response and skip further processing
      res.status(400).json({ msg: "No user found" });
      return;
    }

    next(); // Move to the next middleware or route handler
  } catch (error) {
    res.status(500).json({ message: "Token Expired!" });
  }
};

export { checkUserExists };