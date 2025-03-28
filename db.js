const mongoose = require('mongoose');
require('dotenv').config();

const mongoURL = process.env.MONGODB_URL_LOCAL;        // running mongodb locally

mongoose.connect(mongoURL, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true
})

const db = mongoose.connection;

// event listener
db.on('connected', ()=> {
    console.log('Connected to MongoDB server');
})
db.on('error', (err)=> {
    console.log('MongoDB connection error: ', err);
})
db.on('disconnected', ()=> {
    console.log('MongoDB disconnnected');
})


// export the database connection
module.exports = db;
