// api/config/db.js
// Migrated from MySQL to PostgreSQL

const { Pool } = require('pg');

const pool = new Pool({
    host:     process.env.DB_HOST     || '127.0.0.1',
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || '140625',
    database: process.env.DB_NAME     || 'tampilan-checkout',
    port:     parseInt(process.env.DB_PORT || '5432'),
});

// Test koneksi saat startup
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Gagal koneksi ke PostgreSQL:', err.message);
    } else {
        console.log('✅ Terhubung ke PostgreSQL');
        release();
    }
});

const query = (sql, params = []) => {
    // Konversi MySQL placeholder (?) ke PostgreSQL ($1, $2, ...)
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    return pool.query(pgSql, params).then(result => result.rows);
};

// Untuk mendapatkan insertId (PostgreSQL pakai RETURNING)
const queryInsert = (sql, params = []) => {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    return pool.query(pgSql, params).then(result => ({
        insertId: result.rows[0]?.id || null,
        rows: result.rows
    }));
};

module.exports = { query, queryInsert, pool };