const { Schema, model } = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const userSchema = new Schema({
    _id: { type: String, default: uuidv4 },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    userEmail: { type: String, required: true, unique: true },
    userMobile: { type: String, required: true, unique: true },
    profilePic: { type: String },
    password: { type: String, required: true },
    gender: { type: String },
    isVehicle: { type: Boolean, default: false },
    vehicleType: { type: String },
    make: { type: String },
    model: { type: String },
    year: { type: String },
    color: { type: String },
    seatingCapacity: { type: String },
    homeStreetAddress: { type: String },
    homeCity: { type: String },
    homeState: { type: String },
    officeTime: { type: String },
    homeLocation: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
        },
    },
    officeWayTime: { type: String },
    workplaceStreetAddress: { type: String },
    workplaceCity: { type: String },
    workplaceState: { type: String },
    workplaceLeaveTime: { type: String },
    workplaceLocation: {
        type: {
            type: String,
            enum: ['Point']
        },
        coordinates: {
            type: [Number],
        },
    },
    connectionRequests: {
        type: [
            {
                _id: { type: String, default: uuidv4 },
                from: { type: String, ref: 'User' },
                status: { type: String, enum: ['pending', 'accepted'], default: 'pending' },
                createdAt: { type: Date, default: Date.now }
            }
        ],
        default: []
    },
    connections: {
        type: [{ type: String, ref: 'User' }],
        default: []
    },
    isVisible: {
        type: Boolean, default: true
    }
}, { timestamps: true })

userSchema.index({ homeLocation: '2dsphere' });
userSchema.index({ workplaceLocation: '2dsphere' });

module.exports = model("User", userSchema)