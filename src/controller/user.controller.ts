import { Request, Response } from "express";
import db from "../db";
import { UserTable } from "../schema/schema";
import { eq } from "drizzle-orm";
import jwt, { JwtPayload } from "jsonwebtoken";

interface JwtPayloadWithUserId extends JwtPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const usersWithPostCounts = await db
    .select({
      userId: UserTable.id,
      fullName: UserTable.fullName,
      avatarLink:UserTable.avatarLink,
      postCount: sql`COUNT(${PostTable.id})`.as("postCount"), // Aggregate function
    })
    .from(UserTable)
    .leftJoin(PostTable, sql`${PostTable.authorId} = ${UserTable.id}`)
    .groupBy(UserTable.id, UserTable.fullName,UserTable.avatarLink);
    if (usersWithPostCounts.length === 0) {
      res.json({ message: "There are no users", users: [] });
      return;
    }

    res.json({ users: usersWithPostCounts });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

const deleteUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    await db.delete(UserTable).where(eq(UserTable.id, id));

    res.status(200).json({ message: `User deleted with id:${id}` });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

const getSingleUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const parsedId = req.params.id;

    const jwTtoken = jwt.verify(parsedId, JWT_SECRET!) as JwtPayloadWithUserId;

    if (!jwTtoken) {
      res.status(500).json({ message: "Token Expired!" });
      return;
    }
    const singleUser = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, parseInt(jwTtoken.userId)));

    res.status(200).json({
      msg: "User Fetched Sucessfully",
      user: singleUser,
    });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export { getUser, deleteUser, getSingleUser };
