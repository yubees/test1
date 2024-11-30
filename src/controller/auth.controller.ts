import { Request, Response } from "express";
import bcrypt from "bcrypt";
import db from "../db";
import { and, eq } from "drizzle-orm";
import jwt, { JwtPayload } from "jsonwebtoken";
import { sendMail } from "../middleware/mailer";
import generateOTP from "otp-generator-yube";
import { UserTable } from "../schema/schema";
import { PasswordTable } from "../schema/schema";

interface JwtPayloadWithUserId extends JwtPayload {
  insertedId: string;
  userName: string;
}

const JWT_SECRET = process.env.JWT_SECRET;

const tokenExpires = new Date(Date.now() + 10 * 60 * 1000);

const token = generateOTP({
  length: 8,
  digits: true,
  upperCaseAlphabets: true,
  lowerCaseAlphabets: false,
  specialChars: false,
});

const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const newUser = req.body;

    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, newUser.email));

    const hashedPassword = await bcrypt.hash(newUser.password, 5);

    if (users.length > 0) {
      const user = users[0];
      if (!user.isEmailUser) {
        await db
          .update(UserTable)
          .set({
            fullName: newUser.fullName,
            password: hashedPassword,
          })
          .where(eq(UserTable.email, newUser.email));
        res.status(200).json({ msg: "Oauth User added Sucessfully!" });
        return;
      }
      res.status(400).json({ msg: "Email is already registered" });
      return;
    }

    const newUserData = {
      fullName: newUser.fullName,
      email: newUser.email,
      password: hashedPassword,
      tokenExpires,
      token,
      isEmailUser: true,
      isVerified: false,
      githubId: "empty",
      avatarLink: "empty",
    };
    const [insertedUser] = await db
      .insert(UserTable)
      .values(newUserData)
      .returning({ insertedId: UserTable.id });

    const userId = insertedUser;

    const jwtEmailToken = jwt.sign(
      { token: token, userId: userId },
      JWT_SECRET!,
      {
        expiresIn: "10m",
      }
    );

    if (insertedUser) {
      await sendMail(
        newUser.email,
        "Welcome to Our Service",
        "Thank you for signing up!",
        `<h1>Your verification link: <a href="${process.env.API}/email?code=${jwtEmailToken}">Verify Email</a></h1>`
      );

      res
        .status(200)
        .json({ msg: "User added Sucessfully!", users: insertedUser });
    }
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Fetch user with the given email
    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));

    // Check if a user exists with the given email
    if (users.length === 0) {
      res.status(401).json({ message: "User doesn't exist!" });
      return;
    }

    const user = users[0];

    // Check if the user's email is not verified
    if (!user.isVerified) {
      const token1 = generateOTP({
        length: 8,
        digits: true,
        upperCaseAlphabets: true,
        lowerCaseAlphabets: false,
        specialChars: false,
      });

      // Generate a JWT token for email verification
      const jwtEmailToken = jwt.sign(
        { token: token1, userId: { insertedId: user.id } },
        JWT_SECRET!,
        { expiresIn: "10m" }
      );

      // Send verification email
      await sendMail(
        user.email,
        "Email Verification Required",
        "Please verify your email address.",
        `<h1>Your verification link: <a href="${process.env.API}/email?code=${jwtEmailToken}">Verify Email</a></h1>`
      );
      await db
        .update(UserTable)
        .set({ token: token1 })
        .where(eq(UserTable.id, user.id));
      res.status(401).json({
        message: "Verification email resent. Please check your inbox.",
      });
      return;
    }

    // Compare the password with the stored password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "Incorrect Password!" });
      return;
    }

    // Generate JWT token for the user
    const token = jwt.sign({ userId: user.id }, JWT_SECRET!, {
      expiresIn: "30d",
    });

    // Return the token as a response
    res.status(200).json({ token: token, user: user.fullName });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

const resendEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));

    const user = users[0];

    await db
      .update(UserTable)
      .set({ token: token })
      .where(eq(UserTable.email, email));

    const jwtEmailToken = jwt.sign(
      { token: token, userId: { insertedId: user.id } },
      JWT_SECRET!,
      {
        expiresIn: "10m",
      }
    );

    await sendMail(
      email,
      "Welcome to Our Service",
      "Thank you for signing up!",
      `<h1>Your verification link: <a href="${process.env.API}/email?code=${jwtEmailToken}">Verify Email</a></h1>`
    );

    res.status(200).json({ msg: "Email send" });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const code = req.params.code;

    const emailVerifyToken = jwt.verify(
      code,
      JWT_SECRET!
    ) as JwtPayloadWithUserId;

    const users = await db
      .select()
      .from(UserTable)
      .where(
        and(
          eq(UserTable.id, emailVerifyToken.userId.insertedId),
          eq(UserTable.token, emailVerifyToken.token)
        )
      );

    if (users.length === 0) {
      res
        .status(404)
        .json({ success: false, message: "User or code not found" });
      return;
    }

    await db
      .update(UserTable)
      .set({ isVerified: true })
      .where(eq(UserTable.id, parseInt(emailVerifyToken.userId.insertedId)));

    res.status(200).json({ message: "User verified successfully." });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    const users = await db
      .select()
      .from(UserTable)
      .where(eq(UserTable.email, email));
    const user = users[0];
    if (users.length === 0) {
      res.status(404).json({ success: false, message: "Email not found" });
      return;
    }

    const jwTtoken = jwt.sign({ userId: user.id }, JWT_SECRET!, {
      expiresIn: "10m",
    });

    if (user) {
      const passData = {
        userId: `${user.id}`,
        passwordExpires: tokenExpires,
      };

      await db.insert(PasswordTable).values(passData);
    }

    await sendMail(
      email,
      "Welcome to Forgot Password Service",
      "Change the password!",
      `<h1>Your forgot password link is : ${process.env.API}/resetPassword?code=${jwTtoken}</h1>`
    );

    res.status(200).json({ message: "Reset password link send successfully." });
  } catch (error) {
    if (error instanceof Error) {
      res.status(500).json({ message: error.message });
    } else {
      res.status(500).json({ message: "An unknown error occurred" });
    }
  }
};

const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    const userId = req.params.userId;

    const jwTtoken = jwt.verify(userId, JWT_SECRET!) as JwtPayloadWithUserId;

    const hashedPassword = await bcrypt.hash(password, 5);

    await db
      .update(UserTable)
      .set({ password: hashedPassword })
      .where(eq(UserTable.id, jwTtoken.userId));

    res.status(200).json({ message: "Passwod reset successfully." });
  } catch (error) {
    res.status(500).json(error);
  }
};

export {
  register,
  login,
  verifyEmail,
  resendEmail,
  forgotPassword,
  resetPassword,
};
