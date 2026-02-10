const mysql = require("mysql");

const pool = mysql.createPool({
    host: "127.0.0.1",
    user: "root",
    password: "",
    database: "tampilan-checkout",
    port: 3307
});

const query = (sql, params = []) => {
    return new Promise((resolve, reject) => {
        pool.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
        });
    });
};

module.exports = { query };
