import {
    boolean,
    integer,
    pgTable,
    serial,
    text,
    timestamp,
    varchar,
  } from "drizzle-orm/pg-core";
  
  export const UserTable = pgTable("user_data", {
    id: serial("id").primaryKey(),
    fullName: varchar("fullName", { length: 255 }).notNull(),
    email: varchar("email", { length: 255 }).notNull(),
    password: text("password").notNull(),
    githubId: text("githubId").notNull(),
    isEmailUser: boolean("isEmailUser").default(false),
    token: text("token").notNull(),
    isVerified: boolean("isVerified").notNull(),
    avatarLink: text("avatarLink").notNull(),
    tokenExpires: timestamp("tokenExpires").defaultNow().notNull(),
    passwordExpires: timestamp("passwordExpires"),
  });
  
  export const PasswordTable = pgTable("password_data", {
    id: serial("id").primaryKey(),
    userId: varchar("userId", { length: 255 }).notNull(),
    passwordExpires: timestamp("passwordExpires").defaultNow(),
  });
  
  export const PostTable = pgTable("post_data", {
    id: serial("post_id").primaryKey(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
    image: text("image").notNull(),
    authorId: integer("authorId").notNull(),
    authorName: text("authorName").notNull(),
    authorAvatar: text("authorAvatar").notNull(),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    isUpdated: boolean("isUpdated").notNull(),
  });