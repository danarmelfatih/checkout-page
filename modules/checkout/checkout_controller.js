const path = require("path");

exports.index = (req, res) => {
  res.render("checkout/checkout-page");
};

exports.success = (req, res) => {
  const product = req.query.product || 'Produk';
  const quantity = req.query.quantity || 1;
  const name = req.query.name || 'Customer';
  const email = req.query.email || 'email@example.com';
  const phone = req.query.phone || '628xxx';
  const payment = req.query.payment || 'virtual-account';
  const total = req.query.total || '148.000';
  
  const invoiceNumber = 'INV-' + Date.now();
  
  let bankName = 'BCA Virtual Account';
  let accountNumber = '8808012345678901';
  
  if (payment === 'transfer-bank') {
    bankName = 'Bank BCA';
    accountNumber = '1234567890';
  } else if (payment === 'virtual-account') {
    bankName = 'BCA Virtual Account';
    accountNumber = '8808' + Date.now().toString().slice(-10);
  }
  
  const deadlineDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const paymentDeadline = deadlineDate.toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
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

// ← TAMBAHAN BARU DI SINI
exports.checkout = async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:4000/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nama:     req.session.nama  || req.body.nama,
        email:    req.session.email || req.body.email,
        no_wa:    req.session.no_wa || req.body.no_wa,
        user_id:  req.session.userId,
        product:  req.body.product,
        quantity: req.body.quantity || 1,
        payment:  req.body.payment,
        alamat:   req.body.alamat || ''
      })
    });

    const data = await response.json();

    if (data.status === 'success') {
      res.redirect(`/checkout/success?product=${encodeURIComponent(req.body.product)}&name=${encodeURIComponent(req.session.nama)}&email=${encodeURIComponent(req.session.email)}&phone=${encodeURIComponent(req.session.no_wa)}&payment=${req.body.payment}&total=${data.data?.total || ''}`);
    } else {
      res.status(400).json(data);
    }

  } catch (err) {
    console.error(err);
    res.status(500).send('Terjadi kesalahan saat checkout');
  }
};