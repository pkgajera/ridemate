const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const url = process.env.MONGO_URL;

        if (!url) {
            return console.log("Define mongo db url.")
        }

        await mongoose.connect(url);
        return console.log("MongoDB connected successfully.");
    } catch (error) {
        return console.log("Error in db connection : ", error);
    }
}

module.exports = connectDB;