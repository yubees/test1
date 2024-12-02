import { Request, Response } from "express";
import db from "../db";
import { UserTable } from "../schema/schema";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { OAuth2Client } from "google-auth-library";
import "dotenv/config";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_ID!;
const client = new OAuth2Client(GOOGLE_CLIENT_ID);

const JWT_SECRET = process.env.JWT_SECRET!;

const registerOauth = async (req: Request, res: Response) => {
  try {
    const params =
      "?client_id=" +
      process.env.ID +
      "&client_secret=" +
      process.env.SE +
      "&code=" +
      req.query.code;
    const response = await fetch(
      "https://github.com/login/oauth/access_token" + params,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      }
    );
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.log(error);
  }
};

const getUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const authorizationHeader = req.get("Authorization");
    if (!authorizationHeader) {
      res.status(401).json({ error: "Authorization header is missing" });
      return;
    }
    const userResponse = await fetch("https://api.github.com/user", {
      method: "GET",
      headers: {
        Authorization: authorizationHeader,
      },
    });
    const userData = await userResponse.json();
    const response = await fetch("https://api.github.com/user/emails", {
      method: "GET",
      headers: {
        Authorization: authorizationHeader,
      },
    });
    const data = await response.json();
    const email = data.find((email: any) => email.primary).email;

    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));
    const user = users[0];
    if (users.length > 0) {
      if (user.isEmailUser) {
        await db
          .update(UserTable)
          .set({
            githubId: userData.id,
            avatarLink: userData.avatar_url,
          })
          .where(eq(UserTable.email, email));
        res.status(200).json({ msg: "User added with Github Sucessfully!" });
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET!, {
        expiresIn: "30d",
      });

      res.status(200).json({
        message: "User signed in",
        userId: token,
        user: user.fullName,
      });
      return;
    } else {
      const newUserData = {
        fullName: userData.name || userData.login, // GitHub user full name or username
        email,
        githubId: userData.id,
        password: "",
        tokenExpires: new Date(Date.now() + 3600 * 1000),
        isVerified: true,
        token: "oauth",
        avatarLink: userData.avatar_url,
      };

      const [insertedUser] = await db
        .insert(UserTable)
        .values(newUserData)
        .returning({ insertedId: UserTable.id });

      const token = jwt.sign({ userId: insertedUser.insertedId }, JWT_SECRET!, {
        expiresIn: "30d",
      });

      // Send the response with the inserted user or just the token
      res.status(200).json({
        message: "User registered successfully",
        userId: token,
        user: userData.name || userData.login,
      });
    }
  } catch (error) {
    console.log(error);
    return;
  }
};

const googleAuth = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body; // Token sent from the frontend

    // Verify the token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload?.email) {
      res.status(400).json({ error: "Email is missing in the token payload" });
      return;
    }

    if (!payload?.name) {
      res.status(400).json({ error: "Name is missing in the token payload" });
      return;
    }

    if (!payload?.picture) {
      res
        .status(400)
        .json({ error: "Picture is missing in the token payload" });
      return;
    }

    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, payload.email));
    const user = users[0];
    if (users.length > 0) {
      if (user.isEmailUser) {
        await db
          .update(UserTable)
          .set({
            avatarLink: payload?.picture,
          })
          .where(eq(UserTable.email, payload?.email));
      }

      const token = jwt.sign({ userId: user.id }, JWT_SECRET!, {
        expiresIn: "30d",
      });

      res.status(200).json({
        message: "User signed in",
        userId: token,
        user: user.fullName,
      });
      return;
    }

    const userData = {
      email: payload?.email,
      fullName: payload?.name,
      avatarLink: payload?.picture,
      password: "",
      tokenExpires: new Date(Date.now() + 3600 * 1000),
      isVerified: true,
      token: "oauth",
      githubId: "empty",
    };

    const [insertedUser] = await db
      .insert(UserTable)
      .values(userData)
      .returning({ insertedId: UserTable.id });

    const tokenValue = jwt.sign(
      { userId: insertedUser.insertedId },
      JWT_SECRET!,
      {
        expiresIn: "30d",
      }
    );

    res.status(200).json({
      message: "User registered successfully",
      userId: tokenValue,
      user: payload?.name,
    });
  } catch (error) {
    console.error("Error verifying Google token:", error);
    res.status(400).json({ error: "Invalid token" });
    return;
  }
};

export { registerOauth, getUser, googleAuth };
