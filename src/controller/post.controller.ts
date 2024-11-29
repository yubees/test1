import { Request, Response } from "express";
import db from "../db";
import { PostTable, UserTable } from "../schema/schema";
import { eq } from "drizzle-orm";
import jwt, { JwtPayload } from "jsonwebtoken";

interface JwtPayloadWithUserId extends JwtPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET!;

const getAllPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const posts = await db.select().from(PostTable);

    res.status(200).json(posts);
  } catch (error) {
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    
  }
};

const getUserPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id;

    const userPost = await db
      .select()
      .from(PostTable)
      .where(eq(PostTable.authorId, parseInt(id)));

    res.status(200).json(userPost);
  } catch (error) {
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    
  }
};

const createPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const post = await req.body;
    const id = req.params.id;

    const jwTtoken = jwt.verify(id, JWT_SECRET!) as JwtPayloadWithUserId;
    if (!post.title || !post.content) {
      res.status(400).json({ msg: "All fields are required!" });
    }

    const userName = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.id, parseInt(jwTtoken.userId)));

    const user = userName[0];

    if (user) {
      const [insertedPost] = await db
        .insert(PostTable)
        .values({
          title: post.title,
          content: post.content,
          image: post.image,
          authorId: user.id,
          authorName: user.fullName,
          authorAvatar: user.avatarLink,
          isUpdated: false,
        })
        .returning({ insertedId: PostTable.id });

      res
        .status(200)
        .json({ msg: "Post added Sucessfully!", post: insertedPost });
    }
  } catch (error) {
    if (error instanceof Error) {
        res.status(500).json({ message: error.message });
      } else {
        res.status(500).json({ message: "An unknown error occurred" });
      }
    
  }
};

const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    await db.delete(PostTable).where(eq(PostTable.id, id));

    res.status(200).json({ message: `Post deleted` });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

const updatePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const id = parseInt(req.params.id);

    const post = await req.body;

    await db
      .update(PostTable)
      .set({
        title: post.title,
        content: post.content,
        isUpdated: true,
      })
      .where(eq(PostTable.id, id));

    res.status(200).json({ message: `Post updated` });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

export { getAllPost, getUserPost, createPost, deletePost, updatePost };
