const service = require('./upsell_service');

exports.getUpsell = async (req, res) => {
    let dt = await service.get_upsell(req, res);
    res.status(dt.code).json(dt);
};