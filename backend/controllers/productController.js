const Product = require("../models/Product");

exports.getProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};

exports.addProduct = async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ message: "Ürün adı zorunlu" });

  const existing = await Product.findOne({ name: new RegExp(`^${name}$`, 'i') });
  if (existing) return res.status(400).json({ message: "Bu ürün zaten kayıtlı" });

  const product = new Product(req.body);
  await product.save();
  res.status(201).json(product);
  req.app.get("io").emit("update");
};


exports.updateProduct = async (req, res) => {
  const updated = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
  req.app.get("io").emit("update");
};

exports.deleteProduct = async (req, res) => {
  await Product.findByIdAndDelete(req.params.id);
  res.json({ message: "Ürün silindi" });
  req.app.get("io").emit("update");
};

exports.sellProduct = async (req, res) => {
  let { quantity, price } = req.body;
  
  quantity = parseInt(quantity);
  price = parseFloat(price);
  
  const product = await Product.findById(req.params.id);
  if (!product) return res.status(404).json({ message: "Ürün bulunamadı" });

  if (isNaN(quantity) || isNaN(price)) {
    return res.status(400).json({ message: "Geçersiz satış verisi" });
  }

  if (product.quantity < quantity) {
    return res.status(400).json({ message: "Yetersiz stok" });
  }

  product.quantity -= quantity;
  product.sales.push({ quantity, price, date: new Date() });
  await product.save();

  res.json(product);
  req.app.get("io")?.emit("update");
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
    p.sales.forEach(s => {
      const d = new Date(s.date);
      if (d >= start && d <= end) {
        const cost = s.quantity * p.buyPrice;
        const revenue = s.quantity * s.price;
        report.totalRevenue += revenue;
        report.totalCost += cost;
        report.totalSales += s.quantity;
        report.details.push({
          name: p.name,
          quantity: s.quantity,
          salePrice: s.price,
          buyPrice: p.buyPrice,
          totalCost: cost,
          totalRevenue: revenue,
          profit: revenue - cost,
          date: d
        });
      }
    });
  });

  report.totalProfit = report.totalRevenue - report.totalCost;
  res.json(report);
};
