const pool = require('../config/dBConfig');
exports.findUserByEmail = async (email) => {
     console.log('📣 REGISTER route HIT');

const result = await pool.query(
    'SELECT * FROM users WHERE email = $1', [email]
);
console.log("This is find email response", result);
return result.rows[0];
};
exports.createUser = async (email, password) =>{
     console.log('📣 REGISTER route HIT');
    await pool.query(
        'INSERT INTO users (email,password) VALUES ($1, $2)', [email,password]
    );
};