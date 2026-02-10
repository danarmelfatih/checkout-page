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

    return dt;
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


