const service = require('./product_service');

exports.getProduct = async (req, res) => {
  let dt = await service.get_product(req, res);
  res.status(dt.code).json(dt);
};

