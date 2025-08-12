const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('./model/User');
const Chat = require('./model/Chat');

const wss = new WebSocket.Server({ port: process.env.SOCKET_PORT || 8002 });
const clientSubscriptions = {};

const setUpSocket = () => {
    wss.on('connection', (ws, req) => {
        ws.isAlive = true;

        const token = req.headers['sec-websocket-protocol'];
        if (!token) {
            ws.send(JSON.stringify({ message: "Validation failed." }));
            return ws.close(1008, 'Validation failed.');
        }

        jwt.verify(token, process.env.JWT_KEY, async (err, verified) => {
            if (err) {
                ws.send(JSON.stringify({ message: "Invalid token." }));
                return ws.close(1008, 'Invalid token.');
            }

            const { _id: userId, userEmail, userMobile } = verified;

            const user = await User.findOne({ _id: userId });
            if (!user) {
                ws.send(JSON.stringify({ message: "User not found." }));
                return ws.close(1008, "User not found.");
            }

            ws.userId = userId;

            ws.send(JSON.stringify({ type: "CONNECTED", message: "Connection established and authenticated." }));

            ws.on('message', async (message) => {
                try {
                    const parsed = JSON.parse(message);
                    const { type } = parsed;

                    switch (type) {
                        case 'SUBSCRIBE':
                            {
                                if (!clientSubscriptions[userId]) {
                                    clientSubscriptions[userId] = new Set();
                                }

                                if (clientSubscriptions[userId].size > 0) {
                                    return ws.send(JSON.stringify({ message: "You are already subscribed." }))
                                }

                                clientSubscriptions[userId].add(ws);

                                ws.send(JSON.stringify({ message: "subscribed successfully." }))
                            }
                            break;

                        case 'MESSAGE':
                            {
                                const { toUserId, text } = parsed;
                                const timestamp = new Date();

                                await Chat.create({
                                    from: userId,
                                    to: toUserId,
                                    text,
                                    timestamp,
                                    read: false,
                                });

                                const receivers = clientSubscriptions[toUserId];
                                if (receivers) {
                                    receivers.forEach((socket) => {
                                        if (socket.readyState === WebSocket.OPEN) {
                                            socket.send(
                                                JSON.stringify({
                                                    type: "MESSAGE",
                                                    message: {
                                                        from: userId,
                                                        text,
                                                        timestamp,
                                                    }
                                                })
                                            );
                                        }
                                    });
                                }
                            }
                            break;

                        case "MARK_READ":
                            {
                                const { fromUserId } = parsed;
                                await Chat.updateMany(
                                    { from: fromUserId, to: userId, read: false },
                                    { $set: { read: true } }
                                );
                            }
                            break;

                        case 'PONG':
                            {
                                ws.isAlive = true;
                            }
                            break;

                        case 'UNSUBSCRIBE':
                            {
                                if (clientSubscriptions[userId]) {
                                    delete clientSubscriptions[userId];
                                }
                            }
                            break;

                        default:
                            {
                                ws.send(JSON.stringify({ message: "Invalid message format." }))
                            }
                            break;
                    }
                } catch (error) {
                    console.log(error);
                    ws.send(JSON.stringify({ message: "Invalid message format." }));
                }
            });

            ws.on('close', () => {
                if (clientSubscriptions[ws.userId]) {
                    delete clientSubscriptions[ws.userId];
                }
            });
        });
    });

    setInterval(() => {
        wss.clients.forEach((ws) => {
            if (!ws.isAlive) {
                ws.send(JSON.stringify({ type: "DISCONNECTED", message: "Disconnected due to inactivity." }))
                return ws.terminate();
            }

            ws.send(JSON.stringify({ type: "PING" }));
            ws.isAlive = false;
        });
    }, 30000);
};

module.exports = setUpSocket;