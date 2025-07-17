const mongoose = require("mongoose");

const saleSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  price: { type: Number, required: true },   // ✅ Sayı tipinde
  quantity: { type: Number, required: true }
});

const productSchema = new mongoose.Schema({
  name: String,
  category: String,
  brand: String,
  type: String,
  shelf: String,
  quantity: Number,
  buyPrice: Number,
  sellPrice: Number,
  codes: [String],
  description: String,
  createdAt: { type: Date, default: Date.now },
  sales: [saleSchema] // ✅ Satışlar
});

module.exports = mongoose.model("Product", productSchema);
