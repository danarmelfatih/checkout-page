const checkoutService = require('./checkout_service');

exports.checkout = async (req, res) => {
    try {

        let dt = await checkoutService.capture_payload(req.body);
        dt = await checkoutService.checkout_validasi(dt);
        dt = await checkoutService.checkout_get_harga(dt);
        dt = await checkoutService.checkout_create_akun(dt);
        dt = await checkoutService.checkout_response(dt);
        dt = await checkoutService.checkout_begin_transaction(dt);
        dt = await checkoutService.checkout_create_order(dt);
        dt = await checkoutService.checkout_create_order_item(dt);
        // dt = await checkoutService.checkout_create_invoice(dt);
        // dt = await checkoutService.checkout_create_invoice_order(dt);
        dt = await checkoutService.checkout_create_commit(dt);
        dt = await checkoutService.checkout_create_send_wa(dt);
        // dt = await checkoutService.checkout_create_send_email(dt);
       

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

