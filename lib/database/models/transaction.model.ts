import { Schema, model, models, UpdateQuery } from "mongoose";

const TransactionSchema = new Schema({
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  stripeId: {
    type: String,
    required: true,
    unique: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  plan: {
    type: String,
  },
  credits: {
    type: Number,
  },
  buyer: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

// Update the `updatedAt` field before saving
TransactionSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Update the `updatedAt` field before updating
TransactionSchema.pre('findOneAndUpdate', function (next) {
  const update = this.getUpdate() as UpdateQuery<typeof this>;
  if (update && typeof update === 'object') {
    update.updatedAt = new Date();
  }
  next();
});

const Transaction = models?.Transaction || model("Transaction", TransactionSchema);

export default Transaction;
