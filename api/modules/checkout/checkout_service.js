    const { query, queryInsert, pool } = require("../../config/db");
const nodemailer = require("nodemailer");

// ─── CAPTURE PAYLOAD ──────────────────────────────────────────────────────────
exports.capture_payload = async (body) => {
    return {
        payload: {
            nama:     body?.nama     || '',
            no_wa:    body?.no_wa    || '',
            alamat:   body?.alamat   || '',
            email:    body?.email    || '',
            password: body?.password || '',
            product:  body?.product  || '',
            quantity: body?.quantity || 1,
            payment:  body?.payment  || '',
            user_id:  body?.user_id  || null,
        },
        code:    200,
        status:  "success",
        message: "success",
        data:    {}
    };
};

// ─── VALIDASI CHECKOUT ────────────────────────────────────────────────────────
exports.checkout_validasi = async (dt) => {
    if (!dt.payload.no_wa) {
        dt.code = 400; dt.status = "failed";
        dt.message = "No WhatsApp wajib diisi"; return dt;
    }
    if (!dt.payload.product) {
        dt.code = 400; dt.status = "failed";
        dt.message = "Product wajib diisi"; return dt;
    }
    if (!dt.payload.email) {
        dt.code = 400; dt.status = "failed";
        dt.message = "Email wajib diisi"; return dt;
    }
    return dt;
};

// ─── AMBIL HARGA PRODUCT ──────────────────────────────────────────────────────
exports.checkout_get_harga = async (dt) => {
    if (dt.status === "failed") return dt;

    const rows = await query(
        "SELECT * FROM product WHERE name = ?",
        [dt.payload.product]
    );

    if (rows.length === 0) {
        dt.code = 404; dt.status = "failed";
        dt.message = "Product Not Found"; return dt;
    }

    dt.payload.harga = rows[0].price;
    dt.payload.total = rows[0].price * dt.payload.quantity;
    return dt;
};

// ─── AMBIL USER DARI SESSION ──────────────────────────────────────────────────
exports.checkout_get_user = async (dt) => {
    if (dt.status === "failed") return dt;

    if (dt.payload.user_id) {
        dt.data.user_id = dt.payload.user_id;
        return dt;
    }

    if (dt.payload.email) {
        const users = await query(
            "SELECT id FROM \"user\" WHERE email = ? LIMIT 1",
            [dt.payload.email]
        );
        if (users.length > 0) {
            dt.data.user_id = users[0].id;
            return dt;
        }
    }

    dt.code = 401; dt.status = "failed";
    dt.message = "User tidak ditemukan, silakan login ulang";
    return dt;
};

// ─── RESPONSE ─────────────────────────────────────────────────────────────────
exports.checkout_response = async (dt) => {
    return dt;
};

// ─── BEGIN TRANSACTION ────────────────────────────────────────────────────────
// CATATAN: Untuk PostgreSQL, transaksi harus pakai CLIENT tunggal, bukan pool.query
// Kita simpan client di dt.data._client agar bisa dipakai di step berikutnya
exports.checkout_begin_transaction = async (dt) => {
    if (dt.status === "failed") return dt;
    try {
        const client = await pool.connect();
        await client.query("BEGIN");
        dt.data._client = client;
        dt.data.transaction_started = true;
        console.log("Transaction started");
        return dt;
    } catch (error) {
        console.error("Failed to start transaction:", error);
        dt.status = "failed"; dt.code = 500;
        dt.message = "Gagal memulai transaksi";
        return dt;
    }
};

// Helper: jalankan query dalam transaksi menggunakan client yang sama
const txQuery = async (client, sql, params = []) => {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const result = await client.query(pgSql, params);
    return result.rows;
};

// ─── CREATE ORDER ─────────────────────────────────────────────────────────────
exports.checkout_create_order = async (dt) => {
    if (dt.status === "failed") return dt;
    try {
        const client = dt.data._client;
        const total = parseInt(dt.payload.harga) * parseInt(dt.payload.quantity);
        dt.payload.total = total;

        // PostgreSQL: gunakan RETURNING id untuk mendapatkan id yang baru dibuat
        const rows = await txQuery(
            client,
            `INSERT INTO "order" (user_id, total, payment_method, status)
             VALUES (?, ?, ?, ?) RETURNING id`,
            [dt.data.user_id, total, dt.payload.payment, 'pending']
        );

        dt.data.order_id = rows[0].id;
        console.log("Order created with ID:", dt.data.order_id);
        return dt;
    } catch (error) {
        console.error("Failed to create order:", error);
        dt.status = "failed"; dt.code = 500;
        dt.message = "Gagal membuat order: " + error.message;
        return dt;
    }
};

// ─── CREATE ORDER ITEM ────────────────────────────────────────────────────────
exports.checkout_create_order_item = async (dt) => {
    if (dt.status === "failed") return dt;
    try {
        const client = dt.data._client;

        const products = await txQuery(
            client,
            "SELECT id FROM product WHERE name = ?",
            [dt.payload.product]
        );

        if (products.length === 0) {
            dt.status = "failed"; dt.code = 404;
            dt.message = "Product tidak ditemukan";
            return dt;
        }

        const product_id = products[0].id;
        const subtotal   = dt.payload.harga * dt.payload.quantity;

        const rows = await txQuery(
            client,
            `INSERT INTO order_item (order_id, product_id, quantity, subtotal)
             VALUES (?, ?, ?, ?) RETURNING id`,
            [dt.data.order_id, product_id, dt.payload.quantity, subtotal]
        );

        dt.data.order_item_id = rows[0].id;
        console.log("Order item created with ID:", dt.data.order_item_id);
        return dt;
    } catch (error) {
        console.error("Failed to create order item:", error);
        dt.status = "failed"; dt.code = 500;
        dt.message = "Gagal membuat order item: " + error.message;
        return dt;
    }
};

// ─── COMMIT / ROLLBACK ────────────────────────────────────────────────────────
exports.checkout_create_commit = async (dt) => {
    const client = dt.data._client;

    if (dt.status === "failed") {
        try {
            if (client) { await client.query("ROLLBACK"); client.release(); }
            console.log("Transaction rolled back");
        } catch (e) { console.error("Rollback failed:", e); }
        return dt;
    }

    try {
        await client.query("COMMIT");
        client.release();
        dt.data.transaction_committed = true;
        console.log("Transaction committed");
        return dt;
    } catch (error) {
        console.error("Commit failed:", error);
        try { await client.query("ROLLBACK"); client.release(); } catch (e) {}
        dt.status = "failed"; dt.code = 500;
        dt.message = "Gagal menyimpan transaksi";
        return dt;
    }
};

// ─── SEND WHATSAPP ────────────────────────────────────────────────────────────
exports.checkout_create_send_wa = async (dt) => {
    if (dt.status === "failed") return dt;

    const ADMIN_WA_NUMBER = process.env.WA_NUMBER || '6287727747526';

    dt.payload.pesan = `Halo ${dt.payload.nama}, terima kasih telah melakukan checkout.

Produk: ${dt.payload.product}
Quantity: ${dt.payload.quantity}
Total: Rp ${dt.payload.total ? dt.payload.total.toLocaleString('id-ID') : 0}

Silahkan lakukan pembayaran sebelum 24 jam setelah pesanan dibuat.
Setelah melakukan pembayaran, silahkan konfirmasi ke nomor WhatsApp berikut: ${ADMIN_WA_NUMBER}

Terima kasih.`;

    try {
        const wa = require('../whatsapp/whatsapp_controller');
        const waResult = await wa.send_wa(dt);
        if (waResult && waResult.status === "success") {
            dt.data.wa_sent      = true;
            dt.data.wa_response  = waResult.data?.wa_response;
            dt.message           = "Checkout berhasil, notifikasi WhatsApp terkirim";
        } else {
            dt.data.wa_sent    = false;
            dt.data.wa_warning = waResult.message;
            dt.message         = "Checkout berhasil, tapi WhatsApp gagal terkirim";
        }
    } catch (error) {
        dt.data.wa_sent    = false;
        dt.data.wa_warning = 'WhatsApp notification failed: ' + error.message;
    }

    dt.status = "success";
    dt.code   = 200;
    return dt;
};

// ─── CREATE / GET AKUN (fallback tanpa session) ───────────────────────────────
const bcrypt = require('bcrypt');

exports.checkout_create_akun = async (dt) => {
    if (dt.status === "failed") return dt;
    if (!dt.payload.email) {
        dt.code = 400; dt.status = "failed";
        dt.message = "Email wajib diisi"; return dt;
    }

    const users = await query(
        "SELECT id FROM \"user\" WHERE email = ?",
        [dt.payload.email]
    );
    if (users.length > 0) {
        dt.data.user_id = users[0].id;
        return dt;
    }

    const hashedPassword = await bcrypt.hash(dt.payload.password, 10);

    const result = await queryInsert(
        `INSERT INTO "user" (nama, email, password, no_wa, alamat)
         VALUES (?, ?, ?, ?, ?) RETURNING id`,
        [dt.payload.nama, dt.payload.email, hashedPassword, dt.payload.no_wa, dt.payload.alamat]
    );
    dt.data.user_id = result.insertId;
    return dt;
};

// ─── CREATE INVOICE ───────────────────────────────────────────────────────────
exports.checkout_create_invoice = async (dt) => {
    if (dt.status === "failed") return dt; // ← tambah guard
    try {
        const now = new Date();
        const YY  = String(now.getFullYear()).slice(-2);
        const MM  = String(now.getMonth() + 1).padStart(2, '0');
        const DD  = String(now.getDate()).padStart(2, '0');
        const H   = String(now.getHours()).padStart(2, '0');
        const I   = String(now.getMinutes()).padStart(2, '0');
        const no_invoice = `INV-${YY}${MM}${DD}${H}${I}`;

        const max_hari    = 3;
        const jatuh_tempo = new Date(now.getTime() + max_hari * 24 * 60 * 60 * 1000);

        // fix: pakai txQuery + dt.data._client, bukan dt.con.query
        const client = dt.data._client;
        const result = await txQuery(
            client,
            `INSERT INTO tagihan (order_id, pelanggan_id, no_invoice, created_at, jatuh_tempo, subtotal, kode_unik, diskon, total)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
            [
                dt.data.order_id,
                dt.data.user_id,
                no_invoice,
                now,
                jatuh_tempo,
                dt.data.subtotal  ?? dt.payload.total,
                dt.data.kode_unik ?? 0,
                dt.data.diskon    ?? 0,
                dt.data.total     ?? dt.payload.total
            ]
        );

        dt.data.invoice_id = result[0].id;
        dt.data.no_invoice = no_invoice;
        dt.data.jatuh_tempo = jatuh_tempo.toLocaleDateString('id-ID', {
            day: '2-digit', month: 'long', year: 'numeric'
        });
        console.log("Invoice created:", no_invoice, "| ID:", dt.data.invoice_id);
        return dt;

    } catch (error) {
        console.error("Failed to create invoice:", error);
        dt.status  = "failed";
        dt.code    = 500;
        dt.message = "Gagal membuat invoice: " + error.message;
        return dt;
    }
};


// ─── SEND EMAIL ───────────────────────────────────────────────────────────────
exports.checkout_create_send_email = async (dt) => {
    if (dt.status === "failed") return dt;

    try {
        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_SENDER,
                pass: process.env.GMAIL_APP_PASSWORD
            }
        });

        await transporter.sendMail({
            from: `"Billing-Checkout" <${process.env.GMAIL_SENDER}>`,
            to: dt.payload.email,
            subject: "Checkout Berhasil",
            html: `
                <h2>Halo ${dt.payload.nama}</h2>
                <p>Terima kasih telah melakukan checkout.</p>

                <p><b>Produk:</b> ${dt.payload.product}</p>
                <p><b>Quantity:</b> ${dt.payload.quantity}</p>
                <p><b>Total:</b> Rp ${dt.payload.total?.toLocaleString('id-ID')}</p>

                <br/>
                <p>Silakan lakukan pembayaran sebelum 24 jam.</p>
                <p>Terima kasih 🙏</p>
            `
        });

        dt.data.email_sent = true;
        console.log("Email sent successfully");

    } catch (error) {
        dt.data.email_sent = false;
        dt.data.email_error = error.message;
        console.log("Email failed:", error.message);
    }

    return dt;
};


// ─── ADD QUEUE ────────────────────────────────────────────────────────────────
exports.checkout_add_queue = async (dt) => {
    if (dt.status === "failed") return dt;
    try {
        const client = dt.data._client;
        const p = dt.payload;

        const pesanEmail = `Halo ${p.nama}, terima kasih telah melakukan checkout.\n\n` +
            `Produk: ${p.product}\nQuantity: ${p.quantity}\n` +
            `Total: Rp ${Number(p.total).toLocaleString('id-ID')}\n` +
            `No. Invoice: ${dt.data.no_invoice || '-'}\n` +
            `Jatuh Tempo: ${dt.data.jatuh_tempo || '-'}\n\n` +
            `Silakan lakukan pembayaran sebelum jatuh tempo. Terima kasih.`;

        const pesanWa = pesanEmail;

        // insert queue email
        await txQuery(
            client,
            `INSERT INTO queue (order_id, type, destination, pesan, status)
             VALUES (?, 'email', ?, ?, 'pending')`,
            [dt.data.order_id, p.email, pesanEmail]
        );

        // insert queue wa
        await txQuery(
            client,
            `INSERT INTO queue (order_id, type, destination, pesan, status)
             VALUES (?, 'wa', ?, ?, 'pending')`,
            [dt.data.order_id, p.no_wa, pesanWa]
        );

        dt.data.queue_added = true;
        console.log("Queue email & WA added for order:", dt.data.order_id);
        return dt;

    } catch (error) {
        dt.data.queue_added   = false;
        dt.data.queue_warning = "Gagal menambah queue: " + error.message;
        console.error("Failed to add queue:", error);
        return dt;
    }
};