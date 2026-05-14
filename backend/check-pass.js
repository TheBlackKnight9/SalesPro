const bcrypt = require('bcryptjs');
const hash = '$2b$12$psWlQj5.4ZbCqYzOhWT9veJ2YwaL1C.WOkG7aGhwZyv2GwK4t5PUa';
const password = 'password123';

bcrypt.compare(password, hash).then(res => {
  console.log('Password match:', res);
}).catch(console.error);
