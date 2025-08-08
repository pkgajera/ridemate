import React from 'react';
import { IoClose, IoHome } from 'react-icons/io5';
import { useAuth } from '../context/AllContext';
import Swal from 'sweetalert2';
import { IoMdLogOut } from 'react-icons/io';
import { NavLink } from 'react-router-dom';
import { CgProfile } from "react-icons/cg";
import { IoMdNotifications } from 'react-icons/io';
import { HiMiniChatBubbleLeftRight } from "react-icons/hi2";

export default function Sidebar({ isOpen, toggleSidebar }) {

    const { setSidebarOpen, logout, notificationCount } = useAuth();

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
            icon: IoHome,
            text: 'HOME',
            link: '/'
        },
        {
            icon: CgProfile,
            text: 'PROFILE',
            link: '/profile'
        },
        {
            icon: IoMdNotifications,
            text: 'NOTIFICATONS',
            link: '/notification',
            count: notificationCount || 0
        },
        {
            icon: HiMiniChatBubbleLeftRight,
            text: 'CHAT',
            link: '/chat'
        },
    ]

    return (
        <>
            <div className={`fixed inset-0 bg-black/50 bg-opacity-50 z-[1000] md:hidden transition-opacity duration-300 ${isOpen ? 'block' : 'hidden'}`} onClick={toggleSidebar} />
            <div className={`fixed z-[1000] inset-y-0 left-0 top-0 min-w-[90%] max-w-68 flex flex-col bg-white shadow-md transform transition-transform duration-300 ease-in-out overflow-y-auto ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="w-full flex justify-between items-center p-4 border-b">
                    <h2 className='text-[#76091F] text-2xl font-semibold'>LOGO</h2>
                    <button className='cursor-pointer' onClick={() => setSidebarOpen(false)}><IoClose fontSize={24} /></button>
                </div>
                <nav className="p-2 w-full flex flex-col gap-2 sidebarMenu">
                    {
                        navigationLinks?.map((nav, index) => {
                            const IconComponent = nav.icon;
                            return (
                                <NavLink
                                    key={index}
                                    onClick={toggleSidebar}
                                    to={nav.link}
                                    className={({ isActive }) => {
                                        const baseClasses =
                                            'w-full flex justify-start items-center gap-2 p-4 px-3 rounded-lg hover:bg-[#76091f] hover:text-white';
                                        const activeClasses = isActive ? 'bg-[#76091f] text-white' : '';
                                        return `${baseClasses} ${activeClasses}`;
                                    }}
                                >
                                    {({ isActive }) => (
                                        <>
                                            <IconComponent fontSize={20} />
                                            <div className='flex justify-start items-center gap-2'>
                                                <span>{nav.text}</span>
                                                {nav.count ? (
                                                    <p className={`p-1 rounded-full ${isActive ? 'bg-white text-[#76091f]' : 'bg-[#76091f] text-white'}`}></p>
                                                ) : null}
                                            </div>
                                        </>
                                    )}
                                </NavLink>
                            )
                        })
                    }
                </nav>
                <div className='w-full p-2 mt-auto'>
                    <button onClick={handleLogout} className='w-full flex justify-center items-center gap-3 text-white bg-[#76091F] hover:bg-[#76091F]/90 px-6 py-3 rounded-lg cursor-pointer'>
                        <IoMdLogOut fontSize={24} />
                        <span>Logout</span>
                    </button>
                </div>
            </div>
        </>
    );
}