// api/modules/queue/queue_worker.js
const { pool } = require("../../config/db");
const nodemailer = require("nodemailer");
const axios = require("axios");

const INTERVAL_MS = 10 * 1000; // cek queue setiap 10 detik

// ── Helper query ──────────────────────────────────────────────────────────────
const dbQuery = async (sql, params = []) => {
    let i = 0;
    const pgSql = sql.replace(/\?/g, () => `$${++i}`);
    const result = await pool.query(pgSql, params);
    return result.rows;
};

// ── Proses EMAIL ──────────────────────────────────────────────────────────────
const processEmail = async (job) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    await transporter.sendMail({
        from:    `"${process.env.APP_NAME || 'Toko'}" <${process.env.SMTP_USER}>`,
        to:      job.destination,
        subject: `Konfirmasi Checkout`,
        text:    job.pesan,
    });
};

// ── Proses WA ─────────────────────────────────────────────────────────────────
const processWa = async (job) => {
    await axios.post(
        process.env.WOOWA_ENDPOINT + '/send_message',  // fix: POST + underscore
        {
            phone_no: job.destination,
            key:      process.env.WOOWA_KEY,
            message:  job.pesan,
        },
        { headers: { 'Content-Type': 'application/json' } }
    );
};

// ── Main worker ───────────────────────────────────────────────────────────────
const processQueue = async () => {
    try {
        const jobs = await dbQuery(
            `SELECT * FROM queue WHERE status = 'pending' ORDER BY id ASC LIMIT 10`
        );

        for (const job of jobs) {
            try {
                if (job.type === 'email') {
                    await processEmail(job);
                } else if (job.type === 'wa') {
                    await processWa(job);
                }

                await dbQuery(
                    `UPDATE queue SET status = 'success' WHERE id = ?`,
                    [job.id]
                );
                console.log(`[Queue] ${job.type} job #${job.id} → success`);

            } catch (err) {
                await dbQuery(
                    `UPDATE queue SET status = 'failed' WHERE id = ?`,
                    [job.id]
                );
                console.error(`[Queue] ${job.type} job #${job.id} → failed:`, err.message);
            }
        }

    } catch (err) {
        console.error("[Queue] Worker error:", err.message);
    }
};

// ── Start worker ──────────────────────────────────────────────────────────────
const startWorker = () => {
    console.log("[Queue] SMTP_USER:", process.env.SMTP_USER);
    console.log("[Queue] SMTP_PASS:", process.env.SMTP_PASS ? "✅ ada" : "❌ undefined");
    console.log("[Queue] WOOWA_ENDPOINT:", process.env.WOOWA_ENDPOINT);
    console.log("[Queue] WOOWA_KEY:", process.env.WOOWA_KEY ? "✅ ada" : "❌ undefined");
    console.log(`[Queue] Worker started, interval ${INTERVAL_MS / 1000}s`);
    processQueue();
    setInterval(processQueue, INTERVAL_MS);
};

module.exports = { startWorker };