const checkoutService = require('./checkout_service');

exports.checkout = async (req, res) => {
    try {
        console.log('checkout', req.body);

        let dt = await checkoutService.capture_payload(req.body);
        dt = await checkoutService.checkout_validasi(dt);
        dt = await checkoutService.checkout_get_harga(dt);
        // dt = await checkoutService.checkout_create_akun(dt);
        // dt = await checkoutService.checkout_create_order(dt);
        // dt = await checkoutService.checkout_create_payment(dt);
        // dt = await checkoutService.checkout_send_wa(dt);

        return res.status(dt.code).json(dt);

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            code: 500,
            status: "error",
            message: err.message
        });
    }
};

