const service = require("./whatsapp_service");

exports.cek_valid = async (req, res) => {
  let dt = {no_wa: req.params.no_wa };
  dt = await service.validasi_payload_cek_validasi(dt);
  dt = await service.hit_api_woowa_check_number(dt);
  res.status(dt.code).json(dt);
};


exports.send_wa = async (req, res) => {
 let dt = {no_wa: req.body.no_wa };
  // dt = await service.validasi_payload(dt);
  // dt = await service.cek_validasi(dt);
  // res.status(dt.code).json(dt);
};