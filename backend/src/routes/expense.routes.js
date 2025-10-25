import { Router } from "express";
import {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpenseStats,
    importExpenses
} from "../controllers/expense.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// Apply verifyJWT middleware to all routes in this file
router.use(verifyJWT);

router.route("/").get(getAllExpenses).post(createExpense)
router.route("/import").post(importExpenses)
router.route("/stats").get(getExpenseStats)
router.route("/:expenseId").get(getExpenseById).patch(updateExpense).delete(deleteExpense)

export default router