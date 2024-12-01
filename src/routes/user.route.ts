import express, { Router } from "express";
import { deleteUser, getSingleUser, getUser } from "../controller/user.controller";
import { checkUserExists } from "../middleware/user.middleware";


const router:Router = express.Router();

router.get("/allUser", getUser);
router.get("/singleUser/:id", checkUserExists, getSingleUser);
router.delete("/deleteUser/:id", checkUserExists, deleteUser);

export default router;