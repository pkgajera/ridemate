const express = require('express');
const app = express();
const path = require('path');
require('dotenv').config();
const cors = require('cors');
const connectDB = require('./db/db');
const port = process.env.PORT || 8001;

const userRouter = require('./routes/userRoutes');
const setUpSocket = require('./socket');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, './public')));

connectDB();

setUpSocket();

app.use('/api/user', userRouter)

app.get('/', (req, res) => res.status(200).send('<h1>User Connect Server Running</h1><p>Welcome to the user connect server!</p>'))

app.use((err, req, res, next) => res.status(500).json({ message: "Something went wrong" }))

app.listen(port, () => {
    console.log(`Ridemate server running on http://localhost:${port}`);
});