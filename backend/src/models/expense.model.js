import mongoose, { Schema } from "mongoose";

const expenseSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },
        amount: {
            type: Number,
            required: true,
            min: 0
        },
        expenseDate: {
            type: Date,
            required: true,
            default: Date.now
        },
        category: {
            type: String,
            required: true,
            trim: true
        },
        paymentType: {
            type: String,
            required: true,
            enum: ['Cash', 'Card', 'UPI', 'Net Banking', 'Other'],
            trim: true
        },
        comment: {
            type: String,
            trim: true,
            maxlength: 500
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
)

// Index for faster queries
expenseSchema.index({ owner: 1, expenseDate: -1 });
expenseSchema.index({ owner: 1, category: 1 });

export const Expense = mongoose.model("Expense", expenseSchema)