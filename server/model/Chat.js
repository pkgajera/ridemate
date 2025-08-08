// models/Message.js
const { Schema, model } = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const chatSchema = new Schema({
    _id: { type: String, default: uuidv4 },
    from: { type: String, ref: "User" },
    to: { type: String, ref: "User" },
    text: String,
    read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = model('Chat', chatSchema);
