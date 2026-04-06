const bcrypt = require('bcryptjs');
const password = 'adminforma_feijoada';
const salt = bcrypt.genSaltSync(12);
const hash = bcrypt.hashSync(password, salt);
console.log('--- ADMIN_PASSWORD_HASH ---');
console.log(hash);
