const service = require("./whatsapp_service");

exports.cek_valid = async (req, res) => {
  let dt = {no_wa: req.params.no_wa };
  dt = await service.validasi_payload_cek_validasi(dt);
  dt = await service.hit_api_woowa_check_number(dt);
  res.status(dt.code).json(dt);
};

// SEND WA - PERBAIKI FUNGSI INI
exports.send_wa = async (dt) => {
    dt = await service.capture_payload_send_wa(dt);
    dt = await service.validasi_payload_send_wa(dt);
    dt = await service.hit_api_woowa_send_wa(dt);
    return dt;
};