import express, { Router } from "express";
import { forgotPassword, login, register, resendEmail, resetPassword, verifyEmail } from "../controller/auth.controller";
// import { getUser, googleAuth, registerOauth } from "../controllers/oauth.controller";


const router:Router = express.Router();

router.post("/register", register);
router.post("/login",login)
router.get("/emailVerify/:code",verifyEmail)
router.post("/resendEmail",resendEmail)


router.post("/forgotPassword",forgotPassword)
router.post("/resetPassword/:userId",resetPassword)


// router.post("/google/callback",googleAuth)
// router.get("/acc", registerOauth);
// router.get("/getUser", getUser);

export default router;