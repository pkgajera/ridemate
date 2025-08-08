import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AllContext'
import { decodeJWT } from './helper';
import { FaArrowLeft, FaCheck, FaUserAlt } from 'react-icons/fa';
import axios from 'axios';
import { LuUserPlus } from "react-icons/lu";
import { RxCross2 } from "react-icons/rx";
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import moment from 'moment';

const Notification = () => {

    const { Authorization, userBackendUrl, notificationCount, fetchNotificationCounts } = useAuth();

    const [loading, setLoading] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [profilePicError, setProfilePicError] = useState(false);

    const fetchNotifications = async () => {
        try {
            setLoading(true)
            const decoded = decodeJWT(Authorization)
            const userId = decoded?._id || ''

            const response = await axios.get(`${userBackendUrl}/api/user/getNotifications?userId=${userId}`, { headers: { Authorization } });

            if (response.data.status) {
                setLoading(false)
                setNotifications(response.data.data);
            }
        } catch (error) {
            setLoading(false);
            setNotifications([]);
        }
    }

    const acceptRequest = async (from, status, index) => {
        try {
            const decoded = decodeJWT(Authorization)
            const userId = decoded?._id || ''

            const params = {
                toUserId: userId || '',
                fromUserId: from || '',
                status
            }

            const response = await axios.get(`${userBackendUrl}/api/user/acceptConnectionRequest`, { headers: { Authorization }, params });

            if (response.data.status) {
                toast.success(response.data.message);

                const temp = [...notifications];
                const filtered = temp?.filter((val, ind) => ind !== index);
                setNotifications(filtered);
                fetchNotificationCounts();
            }
        } catch (error) {
            error?.response && toast.error(error?.response?.data?.message);
        }
    }

    useEffect(() => {
        fetchNotifications();
    }, [])

    return (
        <>
            <div className='w-[95%] max-w-screen-md mx-auto h-full flex flex-col'>
                <div className='w-full flex justify-start items-center gap-3 py-3 cursor-pointer'>
                    <button onClick={() => window.history.back()} className='cursor-pointer hover:bg-gray-200 p-2 rounded-full'>
                        <FaArrowLeft />
                    </button>
                    <div className='flex justify-start items-center gap-3'>
                        <h2 className='font-semibold text-lg md:text-xl'>Notifications</h2>
                        {notificationCount ? <div className='text-sm p-0.5 px-2.5 rounded-full bg-[#76091f]/10 hover:bg-[#76091f] text-[#76091f] hover:text-white border border-[#76091f]'>{notificationCount} new</div> : null}
                    </div>
                </div>
                <div className='w-full flex flex-col gap-3 sm:gap-5 pb-3'>
                    {
                        loading ? <LoadingSpinner /> :
                            notifications && notifications?.length ?
                                notifications?.map((val, index) => {
                                    return (
                                        <div className={`w-full flex items-start gap-3 sm:gap-5 p-3 sm:p-5 rounded-lg ${val?.status === 'pending' && 'border-[0.5px] border-[#76091f]/20 bg-[#76091f]/10'}`} key={index}>
                                            <div className='relative w-12 h-12 sm:w-16 sm:h-16 rounded-full shadow-lg'>
                                                {
                                                    val?.from?.profilePic && !profilePicError ?
                                                        <img src={`${userBackendUrl}/images/${val?.from?.profilePic}`} onError={() => setProfilePicError(true)} alt="Profile" className='w-full h-full rounded-full' /> :
                                                        <div className='w-full h-full flex justify-center items-center'>
                                                            <FaUserAlt fontSize={32} />
                                                        </div>
                                                }
                                                <span className='absolute -right-1 -bottom-1 sm:bottom-1 p-1 bg-[#76091f]/80 text-white rounded-full'><LuUserPlus /></span>
                                            </div>
                                            <div className='w-full flex flex-col gap-1 sm:gap-2'>
                                                <div className='w-full flex justify-start items-center gap-3'>
                                                    <p className='font-medium text-xl truncate'>{val?.from?.firstName} {val?.from?.lastName}</p>
                                                    <p className='w-3 h-3 rounded-full bg-[#76091f]'></p>
                                                </div>
                                                <p className='text-black/50 w-full text-left text-sm'>Requested you to connect with you.</p>
                                                <p className='text-black/50 w-full text-left text-sm'>{moment(val?.createdAt).fromNow()}</p>
                                                <div className='w-full grid grid-cols-2 gap-5 mt-1'>
                                                    <button onClick={() => acceptRequest(val?.from?._id, 'accepted', index)} className='w-full flex justify-center items-center gap-2 bg-[#76091f] text-white p-2 rounded-lg cursor-pointer hover:bg-[#76091f]/80'>
                                                        <span><FaCheck fontSize={13} /></span>
                                                        <span className='hidden sm:block'>Accept</span>
                                                    </button>
                                                    <button onClick={() => acceptRequest(val?.from?._id, 'declined', index)} className='w-full flex justify-center items-center gap-2 border border-[#76091f] text-[#76091f] p-2 rounded-lg cursor-pointer hover:bg-[#76091f] hover:text-white'>
                                                        <span><RxCross2 fontSize={18} /></span>
                                                        <span className='hidden sm:block'>Decline</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                                : <p className='w-full text-center p-5'>No any connection requests for you.</p>
                    }
                </div>
            </div>
        </>
    )
}

export default Notification