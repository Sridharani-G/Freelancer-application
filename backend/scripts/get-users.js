require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/intern')
    .then(async () => {
        const users = await User.find({}).lean();
        console.log('USERS_LIST:', JSON.stringify(users.map(u => ({ id: u._id, name: u.name, email: u.email, role: u.role }))));
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
