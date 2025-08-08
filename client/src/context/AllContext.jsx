import { useContext, createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import axios from 'axios';
import { decodeJWT } from "../pages/helper";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {

    const navigate = useNavigate();

    const [token, setToken] = useState(JSON.parse(localStorage.getItem("token")) || "");
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [notificationCount, setNotificationCount] = useState(0);

    const userBackendUrl = import.meta.env.VITE_USER_BACKEND_URL
    const olaMapApi = import.meta.env.VITE_OLA_MAP_API
    const olaMapApiKey = import.meta.env.VITE_OLA_MAPS_API_KEY

    const Authorization = token;
    const isLoggedIn = !!token;

    const storeTokenInLs = (token) => {
        localStorage.setItem("token", JSON.stringify(token));
        setToken(token);
    };

    const toggleSidebar = () => {
        setSidebarOpen(!sidebarOpen);
    }

    const logout = () => {
        localStorage.clear();
        setToken('');
        navigate("/");
        setSidebarOpen(false)
        toast.success("User logged out successfully.")
    }

    const fetchNotificationCounts = async () => {
        try {
            const decoded = decodeJWT(Authorization)
            const userId = decoded?._id || ''
            const response = await axios.get(`${userBackendUrl}/api/user/getNotificationsCounts?userId=${userId}`, { headers: { Authorization } });

            if (response.data.status) {
                const count = response.data.count || 0
                setNotificationCount(count);
            }
        } catch (error) {
            console.log(error?.message);
        }
    }

    const values = {
        Authorization,
        isLoggedIn,
        userBackendUrl,
        storeTokenInLs,
        logout,
        sidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        olaMapApiKey,
        olaMapApi,
        notificationCount,
        fetchNotificationCounts
    }

    const handleResize = () => {
        if (window.innerWidth >= 768) {
            setSidebarOpen(false);
        }
    };

    useEffect(() => {

        window.addEventListener('resize', handleResize);

        handleResize();

        if (token) {
            fetchNotificationCounts();
        }

        return () => window.removeEventListener('resize', handleResize);
    }, [])

    return (
        <AuthContext.Provider value={values}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    return useContext(AuthContext)
}