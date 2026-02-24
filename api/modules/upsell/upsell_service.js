// api/modules/upsell/upsell_service.js
// Migrated from MySQL to PostgreSQL

const { query } = require("../../config/db");

exports.get_upsell = async (req, res) => {
    try {
        const slug  = req.params.slug_or_id;
        const where = isNaN(slug) ? "slug = ?" : "id = ?";

        // Cari produk utama
        const mainProduct = await query(
            `SELECT * FROM product WHERE ${where}`,
            [slug]
        );

        if (mainProduct.length === 0) {
            return { code: 404, status: "failed", message: "Product Not Found", data: null };
        }

        const upsellIds = mainProduct[0].upsell;

        if (!upsellIds || upsellIds.trim() === '') {
            return {
                code: 200, status: "success", message: "No Upsell Products",
                data: { main_product: mainProduct[0], upsell_products: [] }
            };
        }

        // PostgreSQL: ANY(ARRAY[...]) untuk query IN dengan array dinamis
        // Kita parse manual karena format kolom adalah "1,2,3"
        const idArray = upsellIds.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

        if (idArray.length === 0) {
            return {
                code: 200, status: "success", message: "No Upsell Products",
                data: { main_product: mainProduct[0], upsell_products: [] }
            };
        }

        // PostgreSQL IN clause dengan parameterized query
        const placeholders = idArray.map((_, i) => `$${i + 1}`).join(',');
        const { Pool } = require('pg');
        // Gunakan pool dari config db
        const dbConfig = require('../../config/db');
        const upsellProducts = await dbConfig.pool.query(
            `SELECT * FROM product WHERE id IN (${placeholders})`,
            idArray
        ).then(r => r.rows);

        return {
            code: 200, status: "success", message: "Upsell Products Found",
            data: { main_product: mainProduct[0], upsell_products: upsellProducts }
        };

    } catch (err) {
        console.error('Database Error:', err.message);
        return { code: 500, status: "error", message: err.message, data: null };
    }
};