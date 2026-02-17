const { query } = require("../../config/db");

//CAPTURE PAYLOAD
exports.capture_payload = async (body) => {
    return {
        payload: {
            nama: body?.nama || '',
            no_wa: body?.no_wa || '',
            alamat: body?.alamat || '',
            email: body?.email || '',
            password: body?.password || '',
            product: body?.product || '',
            quantity: body?.quantity || 1,
            payment: body?.payment || ''
        },
        code: 200,
        status: "success",
        message: "success",
        data: {}
    };
};

//VALIDASI CHECKOUT
exports.checkout_validasi = async (dt) => {
    if (!dt.payload.no_wa) {
        dt.code = 400;
        dt.status = "failed";
        dt.message = "No WhatsApp wajib diisi";
        return dt;
    }

    if (!dt.payload.product) {
        dt.code = 400;
        dt.status = "failed";
        dt.message = "Product wajib diisi";
        return dt;
    }

    if (!dt.payload.email) {
        dt.code = 400;
        dt.status = "failed";
        dt.message = "Email wajib diisi";
        return dt;
    }

    if (!dt.payload.no_wa){
        dt.code = 400;
        dt.status = "failed";
        dt.message = "No WhatsApp wajib diisi";
        return dt;
    }

    return dt;
};

//BEGIN TRANSACTION
exports.checkout_begin_transaction = async (dt) => {
    if (dt.status === "failed") return dt;
    
    try {
        await query("START TRANSACTION");
        console.log("Transaction started");
        dt.data.transaction_started = true;
        return dt;
    } catch (error) {
        console.error("Failed to start transaction:", error);
        dt.status = "failed";
        dt.code = 500;
        dt.message = "Gagal memulai transaksi";
        return dt;
    }
};

//COMMIT TRANSACTION
exports.checkout_create_commit = async (dt) => {
    if (dt.status === "failed") {
        try {
            await query("ROLLBACK");
            console.log("Transaction rolled back");
        } catch (error) {
            console.error("Failed to rollback:", error);
        }
        return dt;
    }
    
    try {
        await query("COMMIT");
        console.log("Transaction committed");
        dt.data.transaction_committed = true;
        return dt;
    } catch (error) {
        console.error("Failed to commit transaction:", error);
        try {
            await query("ROLLBACK");
        } catch (rollbackError) {
            console.error("Failed to rollback:", rollbackError);
        }
        dt.status = "failed";
        dt.code = 500;
        dt.message = "Gagal menyimpan transaksi";
        return dt;
    }
};

//CREATE ORDER
exports.checkout_create_order = async (dt) => {
    if (dt.status === "failed") return dt;
    
    try {
        const total = parseInt(dt.payload.harga) * parseInt(dt.payload.quantity);
        dt.payload.total = total;
        
        const result = await query(
            `INSERT INTO \`order\` (user_id, total, payment_method, status) 
             VALUES (?, ?, ?, ?)`,
            [
                dt.data.user_id,
                dt.payload.total,
                dt.payload.payment,
                'pending'
            ]
        );
        
        dt.data.order_id = result.insertId;
        console.log("Order created with ID:", dt.data.order_id);
        
        return dt;
    } catch (error) {
        console.error("Failed to create order:", error);
        dt.status = "failed";
        dt.code = 500;
        dt.message = "Gagal membuat order: " + error.message;
        return dt;
    }
};

//CREATE ORDER ITEM
exports.checkout_create_order_item = async (dt) => {
    if (dt.status === "failed") return dt;
    
    try {
        const products = await query(
            "SELECT id FROM product WHERE name = ?",
            [dt.payload.product]
        );
        
        if (products.length === 0) {
            dt.status = "failed";
            dt.code = 404;
            dt.message = "Product tidak ditemukan";
            return dt;
        }
        
        const product_id = products[0].id;
        const subtotal = dt.payload.harga * dt.payload.quantity;
        
        const result = await query(
            `INSERT INTO order_item (order_id, product_id, quantity, subtotal) 
             VALUES (?, ?, ?, ?)`,
            [
                dt.data.order_id,
                product_id,
                dt.payload.quantity,
                subtotal
            ]
        );
        
        dt.data.order_item_id = result.insertId;
        console.log("Order item created with ID:", dt.data.order_item_id);
        
        return dt;
    } catch (error) {
        console.error("Failed to create order item:", error);
        dt.status = "failed";
        dt.code = 500;
        dt.message = "Gagal membuat order item: " + error.message;
        return dt;
    }
};

// AMBIL HARGA PRODUCT
exports.checkout_get_harga = async (dt) => {
    if (dt.status === "failed") return dt;

    const rows = await query(
        "SELECT * FROM product WHERE name = ?",
        [dt.payload.product]
    );

    if (rows.length === 0) {
        dt.code = 404;
        dt.status = "failed";
        dt.message = "Product Not Found";
        return dt;
    }

    dt.payload.harga = rows[0].price;
    dt.payload.total = rows[0].price * dt.payload.quantity;

    return dt;
};

//PASSWORD DEKRIP
const bcrypt = require('bcrypt');

//CREATE / GET AKUN
exports.checkout_create_akun = async (dt) => {
    if (dt.status === "failed") return dt;

    if (!dt.payload.email) {
        dt.code = 400;
        dt.status = "failed";
        dt.message = "Email wajib diisi";
        return dt;
    }

    const users = await query("SELECT id FROM user WHERE email = ?",[dt.payload.email]);

    if (users.length > 0) {
        dt.data.user_id = users[0].id;
        return dt;
    }

    // Hash password dengan bcrypt
    const bcrypt = require('bcrypt');
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(dt.payload.password, saltRounds);

    let result;
    
    if (dt.payload.id) {
        result = await query(
            `INSERT INTO user (id, nama, email, password, no_wa, alamat) VALUES (?, ?, ?, ?, ?, ?)`,
            [dt.payload.id, dt.payload.nama, dt.payload.email, hashedPassword, dt.payload.no_wa, dt.payload.alamat]
        );
        dt.data.user_id = dt.payload.id;
    } else {
        result = await query(
            `INSERT INTO user (nama, email, password, no_wa, alamat) VALUES (?, ?, ?, ?, ?)`,
            [dt.payload.nama, dt.payload.email, hashedPassword, dt.payload.no_wa, dt.payload.alamat]
        );
        dt.data.user_id = result.insertId;
    }

    return dt;
};

//CREATE SEND WA
exports.checkout_create_send_wa = async (dt) => {
    if (dt.status === "failed") return dt;
    
    const ADMIN_WA_NUMBER = process.env.WA_NUMBER || '6281234567890';
    
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
        
        console.log('WA Result:', waResult);
        
        if (waResult.status === "success") {
            dt.data.wa_sent = true;
            dt.data.wa_response = waResult.data.wa_response;
            dt.message = "Checkout berhasil, notifikasi WhatsApp terkirim";
        } else {
            dt.data.wa_sent = false;
            dt.data.wa_warning = waResult.message;
            dt.message = "Checkout berhasil, tapi WhatsApp gagal terkirim";
        }
        
    } catch (error) {
        console.log('Error sending WA:', error.message);
        dt.data.wa_sent = false;
        dt.data.wa_warning = 'WhatsApp notification failed: ' + error.message;
    }
    
    // Checkout tetap sukses meskipun WA gagal
    dt.status = "success";
    dt.code = 200;
    
    return dt;
};


//RESPONSE
exports.checkout_response = async (dt) => {
    let res = {
        code: dt.code,
        status: dt.status,
        message: dt.message,
        data: dt.data
    }
    return dt;
};


