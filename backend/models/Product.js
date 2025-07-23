const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: String,
  brand: String,
  type: String,
  shelf: String,
  quantity: { type: Number, required: true },
  minQuantity: { type: Number, default: 0 },
  buyPrice: Number,
  sellPrice: Number,
  codes: [String],
  description: String,
  createdAt: { type: Date, default: Date.now },
  sales: [saleSchema]
});

module.exports = mongoose.model("Product", productSchema);
