const express = require('express');
const router = express.Router();
const { login, register, checkProfile, updateMissingDetails, getAllUSers, getUser, fetchNearbyUsers, sendConnectionRequest, acceptConnection, getNotificationsCounts, getNotifications, getConversations, getMessages, toggleUserVisibility, checkVisibility } = require('../controller/userController');
const upload = require('../fileUpload');

router.post('/login', login);
router.post('/register', register);
router.post('/check-profile/:userId', checkProfile)
router.post('/update-profile/:userId', upload.single('profilePic'), updateMissingDetails)
router.get('/getUser/:userId', getUser)
router.get('/getAllUsers', getAllUSers)
router.get('/fetchNearbyUsers', fetchNearbyUsers)

router.get('/sendConnectionRequest', sendConnectionRequest)
router.get('/acceptConnectionRequest', acceptConnection)

router.get('/getNotifications', getNotifications);
router.get('/getNotificationsCounts', getNotificationsCounts);

router.get('/getConversations/:userId', getConversations);
router.get('/getMessages', getMessages)

router.get('/checkVisibility/:userId', checkVisibility)
router.get('/toggleUserVisibility', toggleUserVisibility)

module.exports = router;