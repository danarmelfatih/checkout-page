// api/modules/product/product_service.js
// Migrated from MySQL to PostgreSQL

const { query } = require("../../config/db");

exports.get_product = async (req, res) => {
    try {
        const slug = req.params.slug_or_id;
        const where = isNaN(slug) ? "slug = ?" : "id = ?";
        const sql = `SELECT * FROM product WHERE ${where}`;

        console.log('Query:', sql, 'Param:', slug);

        const rows = await query(sql, [slug]);

        if (rows.length === 0) {
            return { code: 404, status: "failed", message: "Product Not Found", data: null };
        }

        return { code: 200, status: "success", message: "Product Found", data: rows[0] };

    } catch (err) {
        console.error('Database Error:', err.message);
        return { code: 500, status: "error", message: err.message, data: null };
    }
};