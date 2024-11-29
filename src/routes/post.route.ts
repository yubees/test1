import express, { Router } from "express";
import {
  createPost,
  deletePost,
  getAllPost,
  getUserPost,
  updatePost,
} from "../controller/post.controller";

const router: Router = express.Router();

router.post("/create/:id", createPost);

router.get("/getAllPost", getAllPost);
router.get("/getUserPost/:id", getUserPost);

router.delete("/deletePost/:id", deletePost);

router.put("/updatePost/:id", updatePost);

export default router;