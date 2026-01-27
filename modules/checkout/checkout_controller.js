const path = require("path");

exports.index = (req, res) => {
  res.render("checkout/checkout-page");
};

exports.success = (req, res) => {
  // Ambil data dari query parameters
  const product = req.query.product || 'Produk';
  const quantity = req.query.quantity || 1;
  const name = req.query.name || 'Customer';
  const email = req.query.email || 'email@example.com';
  const phone = req.query.phone || '628xxx';
  const payment = req.query.payment || 'virtual-account';
  const total = req.query.total || '148.000';
  
  // Generate invoice number
  const invoiceNumber = 'INV-' + Date.now();
  
  // Set bank details berdasarkan payment method
  let bankName = 'BCA Virtual Account';
  let accountNumber = '8808012345678901';
  
  if (payment === 'transfer-bank') {
    bankName = 'Bank BCA';
    accountNumber = '1234567890';
  } else if (payment === 'virtual-account') {
    bankName = 'BCA Virtual Account';
    accountNumber = '8808' + Date.now().toString().slice(-10);
  }
  
  // Batas waktu pembayaran (24 jam dari sekarang)
  const deadlineDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const paymentDeadline = deadlineDate.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  // Data yang akan dikirim ke halaman success
  const orderData = {
    invoiceNumber: invoiceNumber,
    productName: product,
    quantity: quantity,
    totalAmount: total,
    paymentMethod: payment,
    customerName: name,
    customerEmail: email,
    customerPhone: phone,
    paymentDeadline: paymentDeadline,
    accountNumber: accountNumber,
    bankName: bankName,
    qrisCode: 'QRIS-' + Date.now()
  };
  
  console.log('Rendering success page with data:', orderData);
  
  res.render("checkout/checkout-success", { order: orderData });
};