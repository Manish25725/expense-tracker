import { Router } from "express";
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    deleteAccount,
    getAppVersion,
    updateUserCategories,
    updateUserProfile
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// Public routes
router.route("/register").post(registerUser)
router.route("/login").post(loginUser)
router.route("/app-version").get(getAppVersion)
router.route("/refresh-token").post(refreshAccessToken)

// Secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/delete-account").delete(verifyJWT, deleteAccount)
router.route("/update-categories").patch(verifyJWT, updateUserCategories)
router.route("/update-profile").patch(verifyJWT, updateUserProfile)

export default router