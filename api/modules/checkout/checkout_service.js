const mysql = require("mysql");

// === MOCK QUERY (sementara) ===
// kalau kamu sudah punya koneksi DB sendiri, ganti bagian ini
const query = async (sql, params) => {
    // simulasi data product
    if (params[0] === "Paket Premium") {
        return [[{
            id: 1,
            slug: "Paket Premium",
            harga: 150000
        }]];
    }
    return [[]];
};

// ===============================
// 1️⃣ CAPTURE PAYLOAD
// ===============================
exports.capture_payload = async (body) => {
    let dt = {
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

    return dt;
};

// ===============================
// 2️⃣ VALIDASI CHECKOUT (INI YANG HILANG)
// ===============================
exports.checkout_validasi = async (dt) => {
    if (!dt.payload.no_wa) {
        dt.status = "failed";
        dt.code = 400;
        dt.message = "No WhatsApp wajib diisi";
        return dt;
    }

    if (!dt.payload.product) {
        dt.status = "failed";
        dt.code = 400;
        dt.message = "Product wajib diisi";
        return dt;
    }

    if (dt.payload.quantity <= 0) {
        dt.status = "failed";
        dt.code = 400;
        dt.message = "Quantity tidak valid";
        return dt;
    }

    return dt;
};

// ===============================
// 3️⃣ AMBIL HARGA PRODUCT
// ===============================
exports.checkout_get_harga = async (dt) => {
    if (dt.status === "failed") {
        return dt;
    }

    const [rows] = await query(
        "SELECT * FROM product WHERE slug = ?",
        [dt.payload.product]
    );

    console.log("checkout_get_harga", rows);

    if (rows.length === 0) {
        dt.status = "failed";
        dt.message = "Product Not Found";
        dt.code = 404;
        return dt;
    }

    dt.payload.harga = rows[0].harga;
    dt.payload.total = rows[0].harga * dt.payload.quantity;

    return dt;
};
