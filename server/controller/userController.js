const User = require('../model/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const moment = require('moment');
const Chat = require('../model/Chat');

exports.login = async (req, res) => {
    try {
        const { userEmailMobile, password } = req.body;

        if (!userEmailMobile || !password) {
            return res.status(400).json({ message: "Required missing fields : user mobile/email or password" })
        }

        const isEmail = userEmailMobile.includes('@');

        const user = await User.findOne({ [isEmail ? 'userEmail' : 'userMobile']: userEmailMobile });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, message: "Invalid Credentials" })
        }

        const token = jwt.sign({ _id: user._id, userEmail: user.userEmail, userMobile: user.userMobile }, process.env.JWT_KEY);

        return res.status(200).json({ status: true, message: "User Logged In Successfully.", user: { _id: user._id }, token });
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message })
    }
}

exports.register = async (req, res) => {
    try {
        const { firstName, lastName, userEmail, userMobile, password } = req.body;

        if (!firstName || !lastName || !userEmail || !userMobile || !password) {
            return res.status(400).json({ status: false, message: "Required missing fields : firstName, lastName, userEmail, userMobile or password" });
        }

        if (userMobile?.length < 10) {
            return res.status(400).json({ status: false, message: "Please enter valid mobile number" })
        }

        const userExists = await User.findOne({ $or: [{ userEmail: userEmail?.toLowerCase() }, { userMobile }] });
        if (userExists) {
            return res.status(400).json({ status: false, message: "User already exists. Try again with different mobile or email." });
        }

        const hashed = await bcrypt.hash(password, 10);

        await User.create({ firstName, lastName, userEmail: userEmail?.toLowerCase(), userMobile, password: hashed });

        return res.status(200).json({ status: true, message: "User registered successfully. Login to continue ..." })
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message });
    }
}

const validateCustomer = (user) => {
    const missingFields = [];

    const requiredFields = {
        firstName: 'First Name',
        lastName: 'Last Name',
        userEmail: 'Email',
        userMobile: 'Phone',
        gender: 'Gender',
        profilePic: '',
        homeStreetAddress: 'Home Street Address',
        homeCity: 'Home City',
        homeState: 'Home State',
        officeTime: 'Home Leave Time',
        officeWayTime: 'Office Way Time',
        workplaceStreetAddress: 'Workplace Street Address',
        workplaceCity: 'Workplace City',
        workplaceState: 'Workplace State',
        workplaceLeaveTime: 'Workplace Leave Time',
    };

    // Check flat fields
    for (const [key, label] of Object.entries(requiredFields)) {
        if (!user[key] || user[key].toString().trim() === '') {
            missingFields.push({ key, label });
        }
    }

    const homeLocation = user.homeLocation?.coordinates;
    if (!Array.isArray(homeLocation) || homeLocation.length !== 2 || !homeLocation[0] || !homeLocation[1]) {
        missingFields.push({ key: 'homeLatitude', label: 'Home Latitude' });
        missingFields.push({ key: 'homeLongitude', label: 'Home Longitude' });
    }

    const workLocation = user.workplaceLocation?.coordinates;
    if (!Array.isArray(workLocation) || workLocation.length !== 2 || !workLocation[0] || !workLocation[1]) {
        missingFields.push({ key: 'workPlaceLatitude', label: 'Workplace Latitude' });
        missingFields.push({ key: 'workPlaceLongitude', label: 'Workplace Longitude' });
    }

    if (user.isVehicle) {
        const vehicleFields = {
            vehicleType: 'Vehicle Type',
            make: 'Make',
            model: 'Model',
            color: 'Color',
            seatingCapacity: 'Seating Capacity',
        };

        for (const [key, label] of Object.entries(vehicleFields)) {
            if (!user[key] || user[key].toString().trim() === '') {
                missingFields.push({ key, label });
            }
        }
    }

    return missingFields;
};

exports.checkProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." })
        }

        const missingFields = validateCustomer(user);

        if (missingFields.length > 0) {
            return res.status(200).json({
                status: false,
                message: "Missing some fields",
                missingFields,
                existingData: {
                    ...user._doc,
                    homeLongitude: user.homeLocation.coordinates?.length ? user.homeLocation.coordinates[0] : '',
                    homeLatitude: user.homeLocation.coordinates?.length ? user.homeLocation.coordinates[1] : '',
                    workplaceLongitude: user.workplaceLocation.coordinates?.length ? user.workplaceLocation.coordinates[0] : '',
                    workplaceLatitude: user.workplaceLocation.coordinates?.length ? user.workplaceLocation.coordinates[1] : ''
                },
            });
        }

        return res.status(200).json({
            status: true,
            message: "All fields completed."
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({ status: true, message: error?.message })
    }
}

exports.updateMissingDetails = async (req, res) => {
    try {
        const { userId } = req.params;
        const userDetails = { ...req.body };

        const safeParseJSON = (val) => {
            if (typeof val === 'string') {
                try {
                    return JSON.parse(val);
                } catch {
                    return val;
                }
            }
            return val;
        };

        // Only parse known fields that might be sent as JSON strings
        ['connectionRequests', 'connections'].forEach(field => {
            if (userDetails[field]) {
                userDetails[field] = safeParseJSON(userDetails[field]);
                if (!Array.isArray(userDetails[field])) {
                    delete userDetails[field]; // Prevent invalid updates
                }
            }
        });

        const {
            homeLatitude,
            homeLongitude,
            workplaceLatitude,
            workplaceLongitude,
            existingProfilePic
        } = userDetails;

        const profilePic = req.file ? req.file.filename : existingProfilePic || null;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." });
        }

        await User.updateOne(
            { _id: userId },
            {
                $set: {
                    ...userDetails,
                    profilePic,
                    homeLocation: {
                        type: 'Point',
                        coordinates: [parseFloat(homeLongitude), parseFloat(homeLatitude)],
                    },
                    workplaceLocation: {
                        type: 'Point',
                        coordinates: [parseFloat(workplaceLongitude), parseFloat(workplaceLatitude)],
                    },
                }
            }
        );

        return res.status(200).json({ status: true, message: "Profile details updated successfully." });
    } catch (error) {
        console.log("Update error : ", error);
        return res.status(500).json({ status: false, message: error?.message });
    }
};

exports.getUser = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." })
        }

        return res.status(200).json({ status: true, message: "User detail fetched successfully.", data: user })
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message })
    }
}

exports.getAllUSers = async (req, res) => {
    try {
        const users = await User.find().select("_id firstName lastName homeLatitude homeLongitude officeTime officeWayTime profilePic");

        return res.status(200).json({
            status: true,
            message: "All users fetched successfully.",
            data: users?.length ? users : []
        })
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message })
    }
}

exports.fetchNearbyUsers = async (req, res) => {
    try {
        const { longitude, latitude, userId } = req.query;

        if (!longitude || !latitude || !userId) {
            return res.status(400).json({ status: false, message: 'Missing coordinates or userId' });
        }

        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ status: false, message: "User not found." });
        }

        const officeTime = currentUser.officeTime;
        const officeWayTime = parseInt(currentUser.officeWayTime);
        const workplaceLeaveTime = currentUser.workplaceLeaveTime;

        if (!officeTime || isNaN(officeWayTime) || !workplaceLeaveTime) {
            return res.status(400).json({ status: false, message: 'Invalid or missing user time data.' });
        }

        // Current user leave-home window
        const currentLeaveTime = moment(officeTime, 'HH:mm').subtract(officeWayTime, 'minutes');
        const currentLeaveStart = currentLeaveTime.clone().subtract(30, 'minutes');
        const currentLeaveEnd = currentLeaveTime;

        // Current user workplace leave window
        const currentWorkLeave = moment(workplaceLeaveTime, 'HH:mm');
        const currentWorkLeaveEnd = currentWorkLeave.clone().add(30, 'minutes');

        // Find users near home
        // const currentUser = await User.findById(userId).select('homeLocation workplaceLocation');

        if (!currentUser?.homeLocation?.coordinates || !currentUser?.workplaceLocation?.coordinates) {
            return res.status(404).json({ status: false, message: "Your location details not found." })
        }

        const [refHomeLng, refHomeLat] = currentUser.homeLocation.coordinates;
        const [refWorkLng, refWorkLat] = currentUser.workplaceLocation.coordinates;

        // Step 2: Find users near provided coordinates (not reference user)
        const nearbyUsers = await User.find({
            _id: { $ne: userId },
            officeTime: { $exists: true },
            officeWayTime: { $exists: true },
            workplaceLeaveTime: { $exists: true },
            isVisible: true,
            homeLocation: {
                $near: {
                    $geometry: {
                        type: 'Point',
                        coordinates: [parseFloat(longitude), parseFloat(latitude)],
                    },
                    $maxDistance: 500, // in meters
                },
            },
        }).select('_id homeLocation workplaceLocation firstName lastName email');

        const nearbyUserIds = nearbyUsers.map((user) => user._id);

        if (nearbyUserIds.length === 0) {
            return res.status(200).json({
                status: true,
                message: "Nearby users matching both commute windows found.",
                data: []
            });
        }

        // Step 3: Compute distances using aggregation
        let usersWithDistances = await User.aggregate([
            {
                $match: {
                    _id: { $in: nearbyUserIds },
                },
            },
            {
                $addFields: {
                    homeDistance: {
                        $sqrt: {
                            $add: [
                                {
                                    $pow: [
                                        {
                                            $subtract: [
                                                { $arrayElemAt: ['$homeLocation.coordinates', 0] },
                                                refHomeLng,
                                            ],
                                        },
                                        2,
                                    ],
                                },
                                {
                                    $pow: [
                                        {
                                            $subtract: [
                                                { $arrayElemAt: ['$homeLocation.coordinates', 1] },
                                                refHomeLat,
                                            ],
                                        },
                                        2,
                                    ],
                                },
                            ],
                        },
                    },
                    officeDistance: {
                        $sqrt: {
                            $add: [
                                {
                                    $pow: [
                                        {
                                            $subtract: [
                                                { $arrayElemAt: ['$workplaceLocation.coordinates', 0] },
                                                refWorkLng,
                                            ],
                                        },
                                        2,
                                    ],
                                },
                                {
                                    $pow: [
                                        {
                                            $subtract: [
                                                { $arrayElemAt: ['$workplaceLocation.coordinates', 1] },
                                                refWorkLat,
                                            ],
                                        },
                                        2,
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
            {
                $project: {
                    firstName: 1,
                    lastName: 1,
                    email: 1,
                    homeDistance: 1,
                    officeDistance: 1,
                    homeLocation: 1,
                    workplaceLocation: 1,
                    officeTime: 1,
                    officeWayTime: 1,
                    workplaceLeaveTime: 1,
                    profilePic: 1,
                    connections: 1,
                    connectionRequests: 1
                },
            },
        ]);

        const DEGREE_TO_METER = 111120;

        usersWithDistances = usersWithDistances.map((user) => ({
            ...user,
            homeDistanceInMeters: user.homeDistance * DEGREE_TO_METER,
            officeDistanceInMeters: user.officeDistance * DEGREE_TO_METER,
        }));

        const matchingUsers = usersWithDistances.filter(user => {
            const theirOfficeTime = user.officeTime;
            const theirWayTime = parseInt(user.officeWayTime);
            const theirWorkLeaveTime = user.workplaceLeaveTime;

            if (!theirOfficeTime || isNaN(theirWayTime) || !theirWorkLeaveTime) return false;

            // Morning leave time and window
            const theirLeaveTime = moment(theirOfficeTime, 'HH:mm').subtract(theirWayTime, 'minutes');
            const theirLeaveStart = theirLeaveTime.clone().subtract(30, 'minutes');
            const theirLeaveEnd = theirLeaveTime;

            // Evening work leave window
            const theirWorkLeave = moment(theirWorkLeaveTime, 'HH:mm');
            const theirWorkLeaveEnd = theirWorkLeave.clone().add(30, 'minutes');

            // Condition: BOTH windows must overlap
            const morningOverlap =
                currentLeaveStart.isBefore(theirLeaveEnd) &&
                theirLeaveStart.isBefore(currentLeaveEnd);

            const eveningOverlap =
                currentWorkLeave.isBefore(theirWorkLeaveEnd) &&
                theirWorkLeave.isBefore(currentWorkLeaveEnd);

            // ✅ Must match both windows
            return morningOverlap && eveningOverlap;
        }).map(user => addConnectionStatus(user, currentUser));

        return res.status(200).json({
            status: true,
            message: "Nearby users matching both commute windows found.",
            data: matchingUsers
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ status: false, message: error?.message });
    }
};

function addConnectionStatus(user, currentUser) {
    const userIdStr = user._id.toString();
    const currentUserIdStr = currentUser._id.toString();

    const isConnected = currentUser.connections.includes(userIdStr);
    const isRequestedByCurrentUser = user.connectionRequests.some(
        (req) => req.from === currentUserIdStr && req.status === 'pending'
    );
    const isRequestedByNearbyUser = currentUser.connectionRequests.some(
        (req) => req.from === userIdStr && req.status === 'pending'
    );

    let connectionStatus = 'none';
    if (isConnected) {
        connectionStatus = 'connected';
    } else if (isRequestedByCurrentUser || isRequestedByNearbyUser) {
        connectionStatus = 'requested';
    }

    return {
        ...user,
        connectionStatus
    };
}

exports.sendConnectionRequest = async (req, res) => {
    try {
        const { fromUserId, targetUserId } = req.query;

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) return res.status(404).json({ status: false, message: "User not found" });

        const alreadyRequested = targetUser.connectionRequests.some(req =>
            req.from.toString() === fromUserId && req.status === 'pending'
        );

        if (alreadyRequested) {
            return res.status(400).json({ status: false, message: "Already requested" });
        }

        targetUser.connectionRequests.push({ from: fromUserId });
        await targetUser.save();

        return res.status(200).json({ status: true, message: "Connection request sent" });
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message })
    }
};

exports.acceptConnection = async (req, res) => {
    try {
        const { toUserId, fromUserId, status } = req.query;

        if (!['accepted', 'declined'].includes(status)) {
            return res.status(400).json({ status: false, message: "Invalid status value. Must be 'accepted' or 'declined'." });
        }

        const user = await User.findById(toUserId);
        if (!user) return res.status(404).json({ status: false, message: "User not found." });

        const requestIndex = user.connectionRequests.findIndex(
            r => r.from.toString() === fromUserId && r.status === 'pending'
        );

        if (requestIndex === -1) {
            return res.status(404).json({ status: false, message: "No pending request found." });
        }

        if (status === 'accepted') {
            user.connectionRequests[requestIndex].status = 'accepted';

            await user.save();

            await Promise.all([
                User.findByIdAndUpdate(toUserId, { $addToSet: { connections: fromUserId } }),
                User.findByIdAndUpdate(fromUserId, { $addToSet: { connections: toUserId } })
            ]);

            return res.status(200).json({ status: true, message: "Connection request accepted." });
        }

        if (status === 'declined') {
            user.connectionRequests.splice(requestIndex, 1);
            await user.save();

            return res.status(200).json({ status: true, message: "Connection request declined." });
        }

    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message });
    }
}

exports.getNotifications = async (req, res) => {
    try {
        const { userId } = req.query;

        const user = await User.findById(userId).populate('connectionRequests.from', 'firstName lastName profilePic');

        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." })
        }

        const pendingRequests = user.connectionRequests?.filter(
            req => req.status === 'pending'
        ) || [];

        return res.status(200).json({
            status: true,
            message: "Requests fetched successfully.",
            data: pendingRequests?.length ? pendingRequests : []
        })
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message })
    }
}

exports.getNotificationsCounts = async (req, res) => {
    try {
        const { userId } = req.query;

        const user = await User.findById(userId).populate('connectionRequests.from', 'firstName lastName profilePic');

        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." })
        }

        const pendingRequests = user.connectionRequests?.filter(
            req => req.status === 'pending'
        ) || [];

        return res.status(200).json({
            status: true,
            message: "Requests count fetched successfully.",
            count: pendingRequests?.length ? pendingRequests.length : 0
        })
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message })
    }
}

exports.getConversations = async (req, res) => {
    try {
        const { userId } = req.params;
        // 1. Get the user and their connections
        const user = await User.findById(userId).lean();
        if (!user || !user.connections || user.connections.length === 0) {
            return res.json({ status: true });
        }

        const connections = await User.find({ _id: { $in: user.connections } })
            .select('_id firstName lastName profilePic createdAt')
            .lean();

        // 2. Get last message + unread count for each connection
        const messageData = await Chat.aggregate([
            {
                $match: {
                    $or: [
                        { from: userId, to: { $in: user.connections } },
                        { to: userId, from: { $in: user.connections } },
                    ],
                },
            },
            { $sort: { createdAt: -1 } },
            {
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ['$from', userId] },
                            '$to',
                            '$from',
                        ],
                    },
                    lastMessage: { $first: '$text' },
                    createdAt: { $first: '$createdAt' },
                    unreadCount: {
                        $sum: {
                            $cond: [
                                { $and: [{ $eq: ['$to', userId] }, { $eq: ['$read', false] }] },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        // 3. Map for quick lookup
        const messageMap = {};
        messageData.forEach((msg) => {
            messageMap[msg._id] = {
                lastMessage: msg.lastMessage,
                createdAt: msg.createdAt,
                unreadCount: msg.unreadCount,
            };
        });



        // 4. Combine user + message info
        const result = connections.map((conn) => {
            const msgInfo = messageMap[conn._id] || {};
            return {
                _id: conn._id,
                name: conn.firstName + " " + conn.lastName,
                avatar: conn.profilePic,
                lastMessage: msgInfo.lastMessage || null,
                unread: msgInfo.unreadCount || 0,
                timestamp: msgInfo.createdAt || conn.createdAt, // use message time or fallback
            };
        });

        // 5. Sort by lastActivity descending
        result.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        return res.status(200).json({
            status: true,
            message: "Conversations fetched successfully.",
            data: result?.length ? result : []
        });
    } catch (err) {
        console.error('Error fetching conversations:', err);
        return res.status(500).json({ error: 'Failed to fetch conversations' });
    }
}

exports.getMessages = async (req, res) => {
    try {
        const { user1, user2, limit = 20 } = req.query;

        const query = {
            $or: [
                { from: user1, to: user2 },
                { from: user2, to: user1 },
            ],
        }

        const messages = await Chat.find(query).sort({ createdAt: -1 })

        return res.status(200).json({
            status: true,
            messages: "Messages fetched successfully.",
            data: messages?.length ? messages.reverse() : []
        })
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message })
    }
}

exports.checkVisibility = async (req, res) => {
    try {
        const { userId } = req.params;

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." })
        }

        return res.status(200).json({
            status: true,
            message: 'Visibility checked.',
            visibility: user.isVisible
        })
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message });
    }
}

exports.toggleUserVisibility = async (req, res) => {
    try {
        const { userId, state } = req.query;

        if (!userId || !state) {
            return res.status(400).json({ status: false, message: "Required missing fields: userID or state" });
        }

        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." });
        }

        user.isVisible = state;
        await user.save();

        return res.status(200).json({ status: true, message: "Visibility changed successfully." });

    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message })
    }
}

exports.forgetPassword = async (req, res) => {
    try {
        const { emailMobile, oldPassword, newPassword, verifyNewPassword } = req.body;

        if (!emailMobile || !oldPassword || !newPassword || !verifyNewPassword) {
            return res.status(400).json({ status: false, message: "Required missing fields: emailMobile, oldPassword, newPassword or verifyNewPassword" });
        }

        if (newPassword !== verifyNewPassword) {
            return res.status(401).json({ status: false, message: "New and verify new password should be same." })
        }

        const isEmail = emailMobile.includes('@');

        const user = await User.findOne({ [isEmail ? 'userEmail' : 'userMobile']: emailMobile });
        if (!user) {
            return res.status(404).json({ status: false, message: "User not found." });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ status: false, message: "Old password is incorrect" });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedNewPassword;
        await user.save();

        return res.status(200).json({ status: true, message: "Password changed successfully" });
    } catch (error) {
        return res.status(500).json({ status: false, message: error?.message })
    }
}