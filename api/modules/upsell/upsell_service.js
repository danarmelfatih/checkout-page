const mysql = require("mysql");

const pool = mysql.createPool({
    connectionLimit: 10,
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "tampilan-checkout",
    port: 3307
});

// Get upsell products berdasarkan product ID atau slug
exports.get_upsell = (req, res) => {
    return new Promise((resolve, reject) => {
        let slug = req.params.slug_or_id;

        // Cari product utama dulu
        let where = isNaN(slug) ? "slug = ?" : "id = ?";
        const queryMain = `SELECT * FROM product WHERE ${where}`;

        pool.query(queryMain, [slug], (err, mainProduct) => {
            if (err) {
                console.error('Database Error:', err.message);
                return resolve({
                    code: 500,
                    status: "error",
                    message: err.message,
                    data: null
                });
            }

            if (mainProduct.length === 0) {
                return resolve({
                    code: 404,
                    status: "failed",
                    message: "Product Not Found",
                    data: null
                });
            }

            // Ambil upsell IDs dari kolom upsell (format: "2,3,4")
            const upsellIds = mainProduct[0].upsell;

            if (!upsellIds || upsellIds.trim() === '') {
                return resolve({
                    code: 200,
                    status: "success",
                    message: "No Upsell Products",
                    data: {
                        main_product: mainProduct[0],
                        upsell_products: []
                    }
                });
            }

            // Query upsell products
            const queryUpsell = `SELECT * FROM product WHERE id IN (${upsellIds})`;

            pool.query(queryUpsell, (err, upsellProducts) => {
                if (err) {
                    console.error('Database Error:', err.message);
                    return resolve({
                        code: 500,
                        status: "error",
                        message: err.message,
                        data: null
                    });
                }

                resolve({
                    code: 200,
                    status: "success",
                    message: "Upsell Products Found",
                    data: {
                        main_product: mainProduct[0],
                        upsell_products: upsellProducts
                    }
                });
            });
        });
    });
};