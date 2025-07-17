const Product = require("../models/Product");
exports.getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};
exports.addProduct = async (req, res) => {
  const product = new Product(req.body);
  await product.save();
  res.status(201).json(product);
req.app.get("io").emit("update"); // tüm kullanıcıları bilgilendir

};
exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Ürün silindi" });
req.app.get("io").emit("update"); // tüm kullanıcıları bilgilendir

};
exports.updateProduct = async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
req.app.get("io").emit("update"); // tüm kullanıcıları bilgilendir

};
exports.sellProduct = async (req, res) => {
  const { quantity, price } = req.body;
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Ürün bulunamadı" });

  if (product.quantity < quantity) {
    return res.status(400).json({ message: "Stok yetersiz" });
  }

  product.quantity -= quantity;

  product.sales.push({
    price: parseFloat(price),   // 👈 Fiyatı kesin olarak kaydet
    quantity: parseInt(quantity),
    date: new Date()
  });

  await product.save();
  res.json(product); // 👈 Güncellenmiş ürün dönülüyor
req.app.get("io").emit("update"); // tüm kullanıcıları bilgilendir

};
exports.salesReport = async (req, res) => {
  const { from, to } = req.query;

  const start = from ? new Date(from) : new Date("2000-01-01");
  const end = to ? new Date(to) : new Date();

  const products = await Product.find();

  let report = {
    totalRevenue: 0,
    totalCost: 0,
    totalProfit: 0,
    totalSales: 0,
    details: []
  };

  products.forEach(p => {
    p.sales.forEach(sale => {
      const saleDate = new Date(sale.date);
      if (saleDate >= start && saleDate <= end) {
        const cost = sale.quantity * p.buyPrice;
        const revenue = sale.quantity * sale.price;
        report.totalSales += sale.quantity;
        report.totalCost += cost;
        report.totalRevenue += revenue;
        report.details.push({
          name: p.name,
          quantity: sale.quantity,
          salePrice: sale.price,
          buyPrice: p.buyPrice,
          totalCost: cost,
          totalRevenue: revenue,
          profit: revenue - cost,
          date: saleDate
        });
      }
    });
  });

  report.totalProfit = report.totalRevenue - report.totalCost;
  res.json(report);
};


