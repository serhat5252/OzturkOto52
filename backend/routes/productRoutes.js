const express = require("express");
const {
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  sellProduct,
  salesReport
} = require("../controllers/productController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

// Daha spesifik rotalar önce tanımlanmalı
router.get("/", protect, getProducts);
router.post("/", protect, addProduct);
router.post("/:id/sell", protect, sellProduct); // Bu rota önce gelmeli
router.get("/sales-report", protect, salesReport); // Rapor rotası da üstte kalmalı
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);

module.exports = router;
