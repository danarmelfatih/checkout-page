const mysql = require("mysql");

// BUAT POOL (INI YANG TADI HILANG)
const pool = mysql.createPool({
    connectionLimit: 10,
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "tampilan-checkout",
    port: 3307
});

exports.get_product = (req, res) => {
    return new Promise((resolve, reject) => {

        let slug = req.params.slug_or_id;

        let where = isNaN(slug) ? "slug = ?" : "id = ?";

        const query = `SELECT * FROM product WHERE ${where}`;

        console.log('Query:', query, 'Param:', slug); // Debug log

        pool.query(query, [slug], (err, rows) => {
            if (err) {
                console.error('Database Error:', err.message); // Error log
                return resolve({ // Ubah reject jadi resolve
                    code: 500,
                    status: "error",
                    message: err.message,
                    data: null
                });
            }

            let msg = "Product Not Found";
            let status = "failed";
            let code = 404;

            if (rows.length > 0) {
                msg = "Product Found";
                status = "success";
                code = 200;
            }

            console.log('Result:', JSON.stringify({code, status, msg, dataLength: rows.length})); // Debug log

            resolve({
                code: code,
                status: status,
                message: msg,
                data: rows[0] || null
            });
        });

    });
};