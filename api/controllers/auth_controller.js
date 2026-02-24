// api/controllers/auth_controller.js
// Migrated from MySQL to PostgreSQL

const bcrypt = require('bcrypt');
const { query, queryInsert } = require('../config/db');

class AuthController {

    // ===== TAMPILKAN HALAMAN LOGIN =====
    static async showLogin(req, res) {
        const redirect = req.query.redirect || '/checkout';
        res.render('auth/login', {
            error:    null,
            success:  req.query.success || null,
            redirect: redirect
        });
    }

    // ===== TAMPILKAN HALAMAN REGISTER =====
    static async showRegister(req, res) {
        const redirect = req.query.redirect || '/checkout';
        res.render('auth/register', {
            error:    null,
            redirect: redirect
        });
    }

    // ===== PROSES LOGIN =====
    static async login(req, res) {
        try {
            const { identifier, password, redirect } = req.body;
            const redirectUrl = redirect || '/checkout';

            // Cari user berdasarkan username, no_wa, atau email
            const users = await query(
                `SELECT * FROM "user" WHERE username = ? OR no_wa = ? OR email = ? LIMIT 1`,
                [identifier, identifier, identifier]
            );

            if (users.length === 0) {
                return res.render('auth/login', {
                    error:    'Username, No WhatsApp, atau Email tidak ditemukan',
                    success:  null,
                    redirect: redirectUrl
                });
            }

            const user = users[0];  
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return res.render('auth/login', {
                    error:    'Password salah',
                    success:  null,
                    redirect: redirectUrl
                });
            }

            req.session.userId     = user.id;
            req.session.username   = user.username;
            req.session.nama       = user.nama;
            req.session.email      = user.email;
            req.session.no_wa      = user.no_wa;
            req.session.isLoggedIn = true;

            res.redirect(redirectUrl);

        } catch (error) {
            console.error('Login error:', error);
            res.render('auth/login', {
                error:    'Terjadi kesalahan, silakan coba lagi',
                success:  null,
                redirect: req.body.redirect || '/checkout'
            });
        }
    }

    // ===== PROSES REGISTER =====
    static async register(req, res) {
        try {
            const { nama, no_wa, email, username, password, confirm_password, redirect } = req.body;
            const redirectUrl = redirect || '/checkout';

            if (password !== confirm_password) {
                return res.render('auth/register', {
                    error: 'Password dan konfirmasi password tidak cocok', redirect: redirectUrl
                });
            }

            if (password.length < 6) {
                return res.render('auth/register', {
                    error: 'Password minimal 6 karakter', redirect: redirectUrl
                });
            }

            if (username) {
                const existingUsername = await query(
                    `SELECT id FROM "user" WHERE username = ? LIMIT 1`, [username]
                );
                if (existingUsername.length > 0) {
                    return res.render('auth/register', {
                        error: 'Username sudah digunakan', redirect: redirectUrl
                    });
                }
            }

            const existingPhone = await query(
                `SELECT id FROM "user" WHERE no_wa = ? LIMIT 1`, [no_wa]
            );
            if (existingPhone.length > 0) {
                return res.render('auth/register', {
                    error: 'Nomor WhatsApp sudah terdaftar', redirect: redirectUrl
                });
            }

            const existingEmail = await query(
                `SELECT id FROM "user" WHERE email = ? LIMIT 1`, [email]
            );
            if (existingEmail.length > 0) {
                return res.render('auth/register', {
                    error: 'Email sudah terdaftar', redirect: redirectUrl
                });
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            await queryInsert(
                `INSERT INTO "user" (nama, username, email, no_wa, password, created_at)
                 VALUES (?, ?, ?, ?, ?, NOW()) RETURNING id`,
                [nama, username || null, email, no_wa, hashedPassword]
            );

            res.redirect(
                `/auth/login?success=Pendaftaran berhasil! Silakan login&redirect=${encodeURIComponent(redirectUrl)}`
            );

        } catch (error) {
            console.error('Register error:', error);
            res.render('auth/register', {
                error: 'Terjadi kesalahan, silakan coba lagi',
                redirect: req.body.redirect || '/checkout'
            });
        }
    }

    // ===== LOGOUT =====
    static logout(req, res) {
        req.session.destroy((err) => {
            if (err) console.error('Logout error:', err);
            res.redirect('/auth/login');
        });
    }

    // ===== MIDDLEWARE: CEK LOGIN =====
    static requireLogin(req, res, next) {
        if (req.session && req.session.isLoggedIn) {
            return next();
        }
        const redirectUrl = req.originalUrl || '/checkout';
        res.redirect(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
    }
}

module.exports = AuthController;