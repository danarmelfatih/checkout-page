const checkoutService = require('./checkout_service');

// Tampilkan halaman checkout (GET)
exports.index = async (req, res) => {
    try {
        res.render('checkout/index', {
            user: {
                nama:  req.session.nama  || '',
                email: req.session.email || '',
                no_wa: req.session.no_wa || ''
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan');
    }
};

// Tampilkan halaman sukses (GET)
exports.success = async (req, res) => {
    try {
        res.render('checkout/success', {
            user: {
                nama: req.session.nama || ''
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).send('Terjadi kesalahan');
    }
};

// Proses checkout (POST)
exports.checkout = async (req, res) => {
    try {
        req.body.user_id = req.session?.userId || req.session?.user_id || null;
        req.body.email   = req.body.email || req.session?.email || '';
        req.body.no_wa   = req.body.no_wa  || req.session?.no_wa  || '';
        req.body.nama    = req.body.nama   || req.session?.nama   || '';

        let dt = await checkoutService.capture_payload(req.body);
        dt = await checkoutService.checkout_validasi(dt);
        dt = await checkoutService.checkout_get_harga(dt);
        dt = await checkoutService.checkout_get_user(dt);
        dt = await checkoutService.checkout_begin_transaction(dt);
        dt = await checkoutService.checkout_create_order(dt);
        dt = await checkoutService.checkout_create_order_item(dt);
        dt = await checkoutService.checkout_create_invoice(dt);
        dt = await checkoutService.checkout_add_queue(dt);
        dt = await checkoutService.checkout_create_commit(dt);
        // dt = await checkoutService.checkout_create_send_wa(dt);
        // dt = await checkoutService.checkout_create_send_email(dt);

        // ── Bersihkan data internal sebelum dikirim ke client ──
        delete dt.data._client;
        delete dt.payload.password;

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