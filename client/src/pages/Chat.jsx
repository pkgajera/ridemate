import { useEffect, useRef, useState } from "react";
import { GiHamburgerMenu } from "react-icons/gi";
import { IoSearch } from "react-icons/io5";
import { LuSendHorizontal } from "react-icons/lu";
import { useAuth } from "../context/AllContext";
import { decodeJWT } from "./helper";
import axios from "axios";
import moment from 'moment';
import { FaChevronDown } from "react-icons/fa6";
import LoadingSpinner from "../components/LoadingSpinner";

const UserListContent = ({ users, selectedUser, setSelectedUser, isMobileMenuOpen, setIsMobileMenuOpen, searchQuery, setSearchQuery, userBackendUrl, loading }) => {
    const filteredUsers = users.filter((user) =>
        user.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return (
        <div className="w-full h-full bg-white flex flex-col z-[1000] md:border md:border-gray-200 md:rounded-lg">
            <div className="w-full p-2 py-4 border-b border-gray-300 flex flex-col gap-3">
                <div className="w-full flex justify-between items-center">
                    <h1 className="text-lg sm:text-xl font-bold">Messages</h1>
                </div>
                <div className="w-full relative">
                    <IoSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        value={searchQuery}
                        disabled={!users?.length}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex w-full rounded-md border border-gray-400 bg-background px-3 py-2 pl-10 text-sm outline-none"
                    />
                </div>
            </div>
            <div className="w-full overflow-y-auto">
                <div className="w-full p-2 flex flex-col gap-2">
                    {
                        loading ? <LoadingSpinner /> :
                            filteredUsers && filteredUsers?.length ?
                                filteredUsers.map((user, index) => (
                                    <div
                                        key={index}
                                        onClick={() => {
                                            setSelectedUser(user);
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className={`w-full p-3 rounded-lg cursor-pointer transition-all duration-200 hover:text-white hover:bg-[#76091f] group ${selectedUser._id === user._id ? "bg-[#76091f] text-white" : ""
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="relative">
                                                <div className="h-10 w-10 sm:h-12 sm:w-12 relative flex shrink-0 overflow-hidden rounded-full">
                                                    <img
                                                        src={`${userBackendUrl}/images/${user.avatar}`}
                                                        alt={user.name}
                                                        className="aspect-square h-full w-full object-cover"
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = "none";
                                                            const fallback = e.currentTarget.nextElementSibling;
                                                            if (fallback) fallback.style.display = "flex";
                                                        }}
                                                    />
                                                    <div
                                                        className={`flex h-full w-full items-center justify-center rounded-full bg-gray-100 text-[#76091f] font-semibold text-xs sm:text-sm`}
                                                        style={{ display: "none" }}
                                                    >
                                                        {user.name.split(" ").map((n) => n[0]).join("")}
                                                    </div>
                                                </div>
                                                {user.online && (
                                                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-500 rounded-full"></div>
                                                )}
                                            </div>
                                            <div className="w-full flex flex-col gap-1">
                                                <div className="w-full flex items-center justify-between">
                                                    <h3 className="font-semibold text-sm truncate">{user.name}</h3>
                                                    <p className="text-xs">{moment(user.timestamp).format('LT')}</p>
                                                </div>
                                                <div className="w-full flex justify-between items-center">
                                                    <p className={`text-xs md:text-sm group-hover:text-white/80 ${selectedUser._id === user._id ? "text-white/80" : "text-gray-500"} truncate`}>{user.lastMessage}</p>
                                                    {user.unread > 0 && (
                                                        <div className={`${selectedUser._id === user._id ? "bg-white text-[#76091f]" : "bg-[#76091f] text-white"
                                                            } group-hover:text-[#76091f] group-hover:bg-white text-[10px] rounded-full flex items-center justify-center w-4 h-4`}>
                                                            {user.unread}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )) : <p className="w-full text-center">No conversations found.</p>
                    }
                </div>
            </div>
        </div>
    )
}

const Chat = () => {

    const { Authorization, userBackendUrl } = useAuth();

    const [users, setUsers] = useState([])
    const [selectedUser, setSelectedUser] = useState({});
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [socket, setSocket] = useState(null);
    const [currentUserId, setCurrentUserId] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        socket.send(
            JSON.stringify({
                type: "MESSAGE",
                toUserId: selectedUser?._id,
                text: newMessage,
            })
        );
        setMessages((prev) => [
            ...prev,
            { from: currentUserId, to: selectedUser._id, text: newMessage, createdAt: new Date() },
        ]);
        setNewMessage("");
    };

    const fetchConversations = async () => {
        try {
            setLoading(true)
            const response = await axios.get(`${userBackendUrl}/api/user/getConversations/${currentUserId}`, { headers: { Authorization } });

            if (response.data.status) {
                setUsers(response.data.data)
                setLoading(false)
            }

        } catch (error) {
            setLoading(false)
            setUsers([]);
            console.log(error?.message);
        }
    }

    const fetchMessages = async (before = null) => {
        try {
            setLoadingMessages(true);

            const params = {
                user1: currentUserId,
                user2: selectedUser?._id,
            }

            if (before) {
                params.before = before
            }

            const response = await axios.get(`${userBackendUrl}/api/user/getMessages`, { headers: { Authorization }, params });

            if (response.data.status) {
                setLoadingMessages(false)
                const newMessages = response.data.data;
                setMessages(prev => [...newMessages, ...prev]);

                if (newMessages.length < 20) {
                    setHasMore(false); // No more messages to fetch
                }
                socket.send(
                    JSON.stringify({
                        type: "MARK_READ",
                        fromUserId: selectedUser?._id,
                    })
                );

                const temp = [...users];
                const filtered = temp?.map((val) => {
                    if (val?._id === selectedUser?._id) {
                        return { ...val, unread: 0 }
                    } else {
                        return val;
                    }
                })
                setUsers(filtered)
            }
        } catch (error) {
            sendMessage([])
            setLoadingMessages(false)
            console.log(error?.message);
        }
    };

    useEffect(() => {
        const decoded = decodeJWT(Authorization);
        setCurrentUserId(decoded._id);

        const container = messagesContainerRef.current;

        const handleScroll = () => {
            if (!container) return;

            const isAtBottom = container.scrollHeight - container.scrollTop <= container.clientHeight + 10;

            setShowScrollButton(!isAtBottom);

            if (container.scrollTop === 0 && hasMore) {
                const oldestMessage = messages[0];
                if (oldestMessage) {
                    fetchMessages(oldestMessage.createdAt);
                }
            }
        };

        container?.addEventListener('scroll', handleScroll);

        const Socket = new WebSocket(import.meta.env.VITE_SOCKET_URL, Authorization);

        Socket.onopen = () => {
            setSocket(Socket);
        };

        Socket.onmessage = (event) => {
            const message = JSON.parse(event.data);

            if (message.type === "CONNECTED") {
                const subscribeMessage = { type: "SUBSCRIBE" };
                Socket.send(JSON.stringify(subscribeMessage));
            } else if (message.type === 'PING') {
                Socket.send(JSON.stringify({ type: 'PONG' }));
            } else if (message.type === 'MESSAGE') {
                setMessages((prev) => [...prev, message.message]);

                setUsers((prevConversations) => {
                    const index = prevConversations.findIndex(c => c._id === message.message.from || c._id === message.message.to);
                    let updated = [...prevConversations];

                    if (index !== -1) {
                        const conv = { ...updated[index] };
                        conv.lastMessage = message.message.text;
                        conv.timestamp = message.message.timestamp;
                        conv.unread = conv.unread + 1;
                        updated.splice(index, 1);
                        updated.unshift(conv);
                    }

                    return updated;
                });
            }
        };

        return () => {
            container?.removeEventListener('scroll', handleScroll);

            if (Socket && Socket.readyState === WebSocket.OPEN) {
                const unSubscribeMessage = { type: "UNSUBSCRIBE" };

                Socket.send(JSON.stringify(unSubscribeMessage));
                Socket.close();
            }
        };
    }, []);

    useEffect(() => {
        if (currentUserId) {
            fetchConversations();
        }
    }, [currentUserId])

    useEffect(() => {
        if (Object.values(selectedUser).length) {
            fetchMessages();
        }
    }, [selectedUser])

    const messagesEndRef = useRef(null);
    const messagesContainerRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    return (
        <div className="w-full h-full max-w-6xl mx-auto flex bg-background gap-3 md:p-3">
            <div className="hidden md:block w-80 md:w-96 h-full">
                <UserListContent users={users}
                    selectedUser={selectedUser}
                    setSelectedUser={setSelectedUser}
                    isMobileMenuOpen={isMobileMenuOpen}
                    setIsMobileMenuOpen={setIsMobileMenuOpen}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    userBackendUrl={userBackendUrl}
                    loading={loading}
                />
            </div>

            {(!Object.values(selectedUser).length || isMobileMenuOpen) && (
                <div className="fixed inset-0 z-50 md:hidden w-full mt-18" style={{ height: 'calc(100vh - 72px)' }}>
                    <div className="w-full h-full z-1000">
                        <UserListContent
                            users={users}
                            selectedUser={selectedUser}
                            setSelectedUser={setSelectedUser}
                            isMobileMenuOpen={isMobileMenuOpen}
                            setIsMobileMenuOpen={setIsMobileMenuOpen}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            userBackendUrl={userBackendUrl}
                            loading={loading}
                        />
                    </div>
                </div>
            )}

            <div className="w-full h-full flex flex-col justify-center items-center rounded-lg border border-gray-200 relative">
                {
                    Object.values(selectedUser).length ?
                        <>
                            <div className="w-full p-3 border-b border-gray-300 bg-card">
                                <div className="w-full flex items-center gap-3">
                                    <button
                                        className="lg:hidden rounded-md hover:bg-accent"
                                        onClick={() => setIsMobileMenuOpen(true)}
                                    >
                                        <GiHamburgerMenu fontSize={22} />
                                    </button>
                                    <div className="flex gap-3 items-center">
                                        <div className="relative">
                                            <div className="h-10 w-10 sm:h-12 sm:w-12 relative flex shrink-0 overflow-hidden rounded-full">
                                                <img
                                                    src={`${userBackendUrl}/images/${selectedUser.avatar}`}
                                                    alt={selectedUser.name}
                                                    className="aspect-square h-full w-full object-cover"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = "none";
                                                        const fallback = e.currentTarget.nextElementSibling;
                                                        if (fallback) fallback.style.display = "flex";
                                                    }}
                                                />
                                                <div
                                                    className="flex h-full w-full items-center justify-center rounded-full bg-gray-200 text-primary font-semibold text-xs sm:text-sm"
                                                    style={{ display: "none" }}
                                                >
                                                    {selectedUser.name.split(" ").map((n) => n[0]).join("")}
                                                </div>
                                            </div>
                                            {selectedUser.online && (
                                                <div className="absolute bottom-0.5 right-0.5 w-2 h-2 bg-green-500 rounded-full"></div>
                                            )}
                                        </div>
                                        <div className="min-w-0">
                                            <h2 className="font-semibold text-lg truncate">{selectedUser.name}</h2>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                className="w-full h-full p-2 pb-0 overflow-y-auto flex flex-col gap-3 bg-gray-100"
                                ref={messagesContainerRef}
                                style={{ scrollbarWidth: "none" }}
                            >
                                {
                                    loadingMessages ? <LoadingSpinner /> :
                                        messages?.map((message, index) => (
                                            <div
                                                key={index}
                                                className={`flex items-center gap-1 group ${message.from === currentUserId ? "justify-end" : "justify-start"
                                                    }`}
                                            >
                                                <div
                                                    className={`max-w-[85%] sm:max-w-[60%] rounded-lg p-2 px-4 ${message.from === currentUserId ? "bg-gray-200 order-2" : "bg-gray-300 order-1"
                                                        }`}
                                                >
                                                    <p className="text-sm leading-relaxed">{message.text}</p>
                                                </div>
                                                <p
                                                    className={`text-xs hidden group-hover:block ${message.from === currentUserId ? "order-1" : "order-2"
                                                        }`}
                                                >
                                                    {moment(message.createdAt).format("LT")}
                                                </p>
                                            </div>
                                        ))
                                }
                                <div ref={messagesEndRef} />
                            </div>

                            {showScrollButton && (
                                <button
                                    onClick={scrollToBottom}
                                    className="absolute bottom-22 right-4 z-10 bg-gray-200 text-gray-500 border border-gray-400 rounded-full shadow-md hover:bg-gray-300 cursor-pointer transition p-2"
                                >
                                    <FaChevronDown />
                                </button>
                            )}

                            <div className="w-full p-3 sm:p-4 border-t border-gray-300">
                                <form className="flex items-center gap-2" onSubmit={sendMessage}>
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="w-full rounded-md border border-gray-400 outline-none p-2 text-sm sm:text-base"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="h-9 w-9 sm:h-10 sm:w-10 disabled:bg-[#76091f]/70 bg-[#76091f] not-disabled:hover:bg-[#76091f]/70 rounded-md flex items-center justify-center not-disabled:cursor-pointer"
                                    >
                                        <LuSendHorizontal fontSize={20} color="white" />
                                    </button>
                                </form>
                            </div>
                        </> : <p className="text-xl text-center">Select chat to continue.</p>
                }
            </div>
        </div>
    );
};

export default Chat;