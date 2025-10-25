import { Router } from "express";

const router = Router()

// Health check route
router.route("/").get((req, res) => {
    res.status(200).json({
        status: "OK",
        message: "Server is running",
        timestamp: new Date().toISOString()
    })
})

export default router