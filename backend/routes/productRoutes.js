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

router.get("/", protect, getProducts);
router.post("/", protect, addProduct);
router.put("/:id", protect, updateProduct);
router.delete("/:id", protect, deleteProduct);
router.post("/:id/sell", protect, sellProduct);
router.get("/sales-report", protect, salesReport);

module.exports = router;
