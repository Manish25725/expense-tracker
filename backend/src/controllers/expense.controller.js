import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { Expense } from "../models/expense.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import mongoose from "mongoose";

const createExpense = asyncHandler(async (req, res) => {
    const { name, amount, expenseDate, category, paymentType, comment } = req.body

    if ([name, amount, category, paymentType].some((field) => field?.toString().trim() === "")) {
        throw new ApiError(400, "Name, amount, category, and payment type are required")
    }

    if (amount <= 0) {
        throw new ApiError(400, "Amount must be greater than 0")
    }

    const expense = await Expense.create({
        name: name.trim(),
        amount,
        expenseDate: expenseDate ? new Date(expenseDate) : new Date(),
        category: category.trim(),
        paymentType: paymentType.trim(),
        comment: comment?.trim() || "",
        owner: req.user._id
    })

    // Update user's expense count
    await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { expenseLogged: 1 } }
    )

    const createdExpense = await Expense.findById(expense._id).populate("owner", "name username email")

    return res.status(201).json(
        new ApiResponse(200, createdExpense, "Expense created successfully")
    )
})

const getAllExpenses = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, category, startDate, endDate, sortBy = 'expenseDate', sortType = 'desc' } = req.query

    const matchConditions = { owner: req.user._id }

    if (category) {
        matchConditions.category = category
    }

    if (startDate || endDate) {
        matchConditions.expenseDate = {}
        if (startDate) {
            matchConditions.expenseDate.$gte = new Date(startDate)
        }
        if (endDate) {
            matchConditions.expenseDate.$lte = new Date(endDate)
        }
    }

    const sortDirection = sortType === 'desc' ? -1 : 1
    const sortOptions = { [sortBy]: sortDirection }

    const expenses = await Expense.aggregate([
        { $match: matchConditions },
        { $sort: sortOptions },
        { $skip: (page - 1) * parseInt(limit) },
        { $limit: parseInt(limit) },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            name: 1,
                            username: 1,
                            email: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: { $first: "$owner" }
            }
        }
    ])

    const totalExpenses = await Expense.countDocuments(matchConditions)
    const totalAmount = await Expense.aggregate([
        { $match: matchConditions },
        { $group: { _id: null, total: { $sum: "$amount" } } }
    ])

    return res.status(200).json(
        new ApiResponse(
            200, 
            {
                expenses,
                totalExpenses,
                totalAmount: totalAmount[0]?.total || 0,
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalExpenses / limit)
            },
            "Expenses fetched successfully"
        )
    )
})

const getExpenseById = asyncHandler(async (req, res) => {
    const { expenseId } = req.params

    if (!mongoose.isValidObjectId(expenseId)) {
        throw new ApiError(400, "Invalid expense ID")
    }

    const expense = await Expense.findOne({
        _id: expenseId,
        owner: req.user._id
    }).populate("owner", "name username email")

    if (!expense) {
        throw new ApiError(404, "Expense not found")
    }

    return res.status(200).json(
        new ApiResponse(200, expense, "Expense fetched successfully")
    )
})

const updateExpense = asyncHandler(async (req, res) => {
    const { expenseId } = req.params
    const { name, amount, expenseDate, category, paymentType, comment } = req.body

    if (!mongoose.isValidObjectId(expenseId)) {
        throw new ApiError(400, "Invalid expense ID")
    }

    const expense = await Expense.findOne({
        _id: expenseId,
        owner: req.user._id
    })

    if (!expense) {
        throw new ApiError(404, "Expense not found")
    }

    // Update fields if provided
    if (name !== undefined) expense.name = name.trim()
    if (amount !== undefined) {
        if (amount <= 0) {
            throw new ApiError(400, "Amount must be greater than 0")
        }
        expense.amount = amount
    }
    if (expenseDate !== undefined) expense.expenseDate = new Date(expenseDate)
    if (category !== undefined) expense.category = category.trim()
    if (paymentType !== undefined) expense.paymentType = paymentType.trim()
    if (comment !== undefined) expense.comment = comment.trim()

    await expense.save()

    const updatedExpense = await Expense.findById(expense._id).populate("owner", "name username email")

    return res.status(200).json(
        new ApiResponse(200, updatedExpense, "Expense updated successfully")
    )
})

const deleteExpense = asyncHandler(async (req, res) => {
    const { expenseId } = req.params

    if (!mongoose.isValidObjectId(expenseId)) {
        throw new ApiError(400, "Invalid expense ID")
    }

    const expense = await Expense.findOneAndDelete({
        _id: expenseId,
        owner: req.user._id
    })

    if (!expense) {
        throw new ApiError(404, "Expense not found")
    }

    // Update user's expense count
    await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { expenseLogged: -1 } }
    )

    return res.status(200).json(
        new ApiResponse(200, {}, "Expense deleted successfully")
    )
})

const getExpenseStats = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query

    const matchConditions = { owner: req.user._id }

    if (startDate || endDate) {
        matchConditions.expenseDate = {}
        if (startDate) {
            matchConditions.expenseDate.$gte = new Date(startDate)
        }
        if (endDate) {
            matchConditions.expenseDate.$lte = new Date(endDate)
        }
    }

    const stats = await Expense.aggregate([
        { $match: matchConditions },
        {
            $group: {
                _id: "$category",
                totalAmount: { $sum: "$amount" },
                count: { $sum: 1 },
                avgAmount: { $avg: "$amount" }
            }
        },
        { $sort: { totalAmount: -1 } }
    ])

    const overallStats = await Expense.aggregate([
        { $match: matchConditions },
        {
            $group: {
                _id: null,
                totalExpenses: { $sum: 1 },
                totalAmount: { $sum: "$amount" },
                avgAmount: { $avg: "$amount" },
                maxAmount: { $max: "$amount" },
                minAmount: { $min: "$amount" }
            }
        }
    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                categoryStats: stats,
                overallStats: overallStats[0] || {}
            },
            "Expense statistics fetched successfully"
        )
    )
})

const importExpenses = asyncHandler(async (req, res) => {
    const { expenses } = req.body

    if (!Array.isArray(expenses) || expenses.length === 0) {
        throw new ApiError(400, "Expenses array is required")
    }

    const validatedExpenses = expenses.map(expense => {
        if (!expense.name || !expense.amount || !expense.category || !expense.paymentType) {
            throw new ApiError(400, "Each expense must have name, amount, category, and payment type")
        }

        if (expense.amount <= 0) {
            throw new ApiError(400, "Amount must be greater than 0")
        }

        return {
            name: expense.name.trim(),
            amount: expense.amount,
            expenseDate: expense.expenseDate ? new Date(expense.expenseDate) : new Date(),
            category: expense.category.trim(),
            paymentType: expense.paymentType.trim(),
            comment: expense.comment?.trim() || "",
            owner: req.user._id
        }
    })

    const createdExpenses = await Expense.insertMany(validatedExpenses)

    // Update user's expense count
    await User.findByIdAndUpdate(
        req.user._id,
        { $inc: { expenseLogged: createdExpenses.length } }
    )

    return res.status(201).json(
        new ApiResponse(200, { count: createdExpenses.length }, "Expenses imported successfully")
    )
})

export {
    createExpense,
    getAllExpenses,
    getExpenseById,
    updateExpense,
    deleteExpense,
    getExpenseStats,
    importExpenses
}