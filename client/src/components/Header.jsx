import React, { useEffect, useState } from 'react'
import { IoMdLogOut } from "react-icons/io";
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AllContext'
import Swal from "sweetalert2";
import { GiHamburgerMenu } from "react-icons/gi";
import axios from 'axios';
import { decodeJWT } from '../pages/helper';
import { toast } from 'react-toastify';
import { RiShareFill } from "react-icons/ri";

const Header = () => {

    const { RidemateLogo, userBackendUrl, logout, toggleSidebar, notificationCount, Authorization } = useAuth();
    const [isChecked, setIsChecked] = useState(false);
    const [currentUserId, setCurrentUserId] = useState('');

    const handleToggle = () => {
        setIsChecked(!isChecked)
    }

    const handleLogout = () => {
        Swal.fire({
            title: "Are you sure?",
            text: "You will be logged out!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#76091F",
            showCloseButton: true,
            cancelButtonColor: "#99a1af",
            confirmButtonText: "Yes, log out!"
        }).then((result) => {
            if (result.isConfirmed) logout()
        });
    }

    const navigationLinks = [
        {
            text: 'HOME',
            link: '/'
        },
        {
            text: 'PROFILE',
            link: '/profile'
        },
        {
            text: 'NOTIFICATONS',
            link: '/notification',
            count: notificationCount || 0
        },
        {
            text: 'CHAT',
            link: '/chat'
        },
    ]

    const sendMessageToRN = (data) => {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
            window.ReactNativeWebView.postMessage(JSON.stringify(data));
        } else {
            console.log("Not inside React Native WebView");
        }
    }

    const checkUserVisibility = async () => {
        try {
            const response = await axios.get(`${userBackendUrl}/api/user/checkVisibility/${currentUserId}`, { headers: { Authorization } });

            if (response.data.status) {
                setIsChecked(response.data.visibility)
            }
        } catch (error) {
            console.log(error?.message);
        }
    }

    const toggleUserVisibility = async () => {
        try {

            const params = {
                userId: currentUserId,
                state: !isChecked
            }

            const response = await axios.get(`${userBackendUrl}/api/user/toggleUserVisibility`, { headers: { Authorization }, params });

            if (response.data.status) {
                toast.success(response.data.message)
                setIsChecked(!isChecked);
            }
        } catch (error) {
            error?.response && toast.error(error?.response?.data?.message);
        }
    }

    useEffect(() => {
        const decoded = decodeJWT(Authorization)
        const userId = decoded?._id || ''

        setCurrentUserId(userId)
    }, []);

    useEffect(() => {
        if (currentUserId) {
            checkUserVisibility();
        }
    }, [currentUserId])

    return (
        <>
            <div className='w-screen h-18 flex justify-between items-center border-b border-b-gray-200 shadow p-3'>
                <NavLink to={"/"} className={"w-32 sm:w-40"}>
                    <img src={RidemateLogo} alt="Ridemate logo" className='w-full h-auto' />
                </NavLink>
                <nav className='hidden md:flex justify-center items-center gap-6 uppercase font-medium mainHeader'>
                    {
                        navigationLinks?.map((nav, index) => {
                            return (
                                <NavLink to={nav.link} className={`flex justify-center items-center gap-2 text-sm hover:text-[#76091F] relative`} key={index}>
                                    <span>{nav.text}</span>
                                    {nav.count ? <p className='w-2 h-2 rounded-full bg-[#76091f] text-white absolute -top-1 -right-1'></p> : null}
                                </NavLink>
                            )
                        })
                    }
                    <button
                        onClick={toggleUserVisibility}
                        className={`relative flex items-center cursor-pointer rounded-full w-14 h-7 transition-all duration-300 ease-in-out ${isChecked ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                        <span
                            className={`absolute left-1 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out w-5 h-5 bg-white rounded-full ${isChecked ? 'translate-x-7' : ''}`}
                        ></span>
                    </button>
                </nav>
                <div className='flex items-center gap-3 md:hidden'>
                    <button onClick={() => sendMessageToRN({ type: "SHARE", status: true })}><RiShareFill fontSize={24} /></button>
                    <div
                        onClick={toggleUserVisibility}
                        className={`relative flex items-center cursor-pointer rounded-full w-14 h-7 transition-all duration-300 ease-in-out ${isChecked ? 'bg-green-500' : 'bg-red-500'}`}
                    >
                        <span
                            className={`absolute left-1 top-1/2 -translate-y-1/2 transition-all duration-300 ease-in-out w-5 h-5 bg-white rounded-full ${isChecked ? 'translate-x-7' : ''}`}
                        ></span>
                    </div>
                    <button className='md:hidden' onClick={toggleSidebar}><GiHamburgerMenu fontSize={24} /></button>
                </div>
                <div className='hidden md:flex items-center gap-5'>
                    <button onClick={() => sendMessageToRN({ type: "SHARE", status: true })}><RiShareFill fontSize={24} /></button>
                    <button onClick={handleLogout} className='hidden md:flex justify-center items-center gap-3 text-white bg-[#76091F] hover:bg-[#76091F]/90 px-6 py-3 rounded-lg cursor-pointer'>
                        <IoMdLogOut fontSize={24} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </>
    )
}

export default Header