const { ensureDefaultUsers } = require('./defaultUsers');

ensureDefaultUsers().then((users) => {
  console.log('In-memory demo users are ready.');
  users.forEach((user) => {
    console.log(`${user.role}: ${user.email}`);
  });
});
