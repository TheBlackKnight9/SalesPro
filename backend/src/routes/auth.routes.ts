import { Router } from "express";
import { AuthController } from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();
const ctrl = new AuthController();

// Public
router.post("/login", ctrl.login.bind(ctrl));
router.post("/signup", ctrl.signup.bind(ctrl));
router.post("/register", ctrl.signup.bind(ctrl));

// Protected
router.get("/profile", authenticate, ctrl.getProfile.bind(ctrl));
router.put("/profile", authenticate, ctrl.updateProfile.bind(ctrl));
router.put("/change-password", authenticate, ctrl.changePassword.bind(ctrl));

export default router;
