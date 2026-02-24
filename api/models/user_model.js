const { query } = require("../config/db");

class User {

    // Cari user berdasarkan kondisi (username, email, no_hp, dll)
    static async findOne(criteria) {
        try {
            let sql = "SELECT * FROM user WHERE ";
            let params = [];

            if (criteria.$or) {
                // Untuk login: cari berdasarkan username ATAU no_hp
                const conditions = criteria.$or.map(condition => {
                    const key = Object.keys(condition)[0];
                    params.push(condition[key]);
                    return `${key} = ?`;
                }).join(" OR ");
                sql += conditions;
            } else {
                // Untuk cek satu field saja (email, username, no_hp)
                const key = Object.keys(criteria)[0];
                sql += `${key} = ?`;
                params.push(criteria[key]);
            }

            sql += " LIMIT 1";

            const results = await query(sql, params);
            return results.length > 0 ? results[0] : null;

        } catch (error) {
            console.error("Error in User.findOne:", error);
            throw error;
        }
    }

    // Buat user baru
    static async create(userData) {
        try {
            const result = await query(
                `INSERT INTO user (nama, username, email, no_hp, password, alamat, created_at) 
                 VALUES (?, ?, ?, ?, ?, ?, NOW())`,
                [
                    userData.nama,
                    userData.username || null,
                    userData.email,
                    userData.no_hp,
                    userData.password,
                    userData.alamat || null
                ]
            );

            return {
                id: result.insertId,
                ...userData
            };

        } catch (error) {
            console.error("Error in User.create:", error);
            throw error;
        }
    }

    // Cari user berdasarkan ID
    static async findById(id) {
        try {
            const results = await query("SELECT * FROM user WHERE id = ? LIMIT 1", [id]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            console.error("Error in User.findById:", error);
            throw error;
        }
    }
}

module.exports = User;