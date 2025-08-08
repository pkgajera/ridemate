import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AllContext'
import axios from 'axios';
import { decodeJWT } from './helper';
import { OlaMaps } from 'olamaps-web-sdk'
import { toast } from 'react-toastify';
import { CgInfo } from 'react-icons/cg';
import { IoCloseCircle } from "react-icons/io5";
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {

    const { userBackendUrl, Authorization, olaMapApiKey } = useAuth();

    const [userLat, setUserLat] = useState('');
    const [userLng, setUserLng] = useState('');
    const [MyMap, setMyMap] = useState(null);
    const [leaveTime, setLeaveTime] = useState('');
    const [commuteTime, setCommuteTime] = useState('');
    // const [allUsers, setAllUsers] = useState([]);
    const [userProfileImg, setUserProfileImg] = useState('');
    const [nearByUsers, setNearByUsers] = useState([]);
    const [openIndex, setOpenIndex] = useState(null); // track which user's accordion is open
    const [loading, setLoading] = useState(false);

    const decoded = decodeJWT(Authorization)
    const currentUserId = decoded?._id || ''

    const olaMaps = new OlaMaps({
        apiKey: olaMapApiKey,
    })

    const getNearByUsers = async (long, lat) => {
        try {
            setLoading(true)
            const response = await axios.get(`${userBackendUrl}/api/user/fetchNearbyUsers?longitude=${long}&latitude=${lat}&userId=${currentUserId}`, { headers: { Authorization } });

            if (response.data.status) {
                const all = response.data.data
                const sorted = all?.map((val) => {
                    return {
                        ...val,
                        latitude: val?.homeLocation?.coordinates[1],
                        longitude: val?.homeLocation?.coordinates[0]
                    }
                })
                setNearByUsers(sorted)
                setLoading(false)
            }
        } catch (error) {
            setLoading(false);
            setNearByUsers([]);
            console.log(error?.message);
        }
    }

    const getUser = async () => {
        try {
            const response = await axios.get(`${userBackendUrl}/api/user/getUser/${currentUserId}`, { headers: { Authorization } });

            if (response.data.status) {
                const user = response.data.data || {};
                setUserLng(user?.homeLocation?.coordinates[0])
                setUserLat(user?.homeLocation?.coordinates[1])
                setLeaveTime(user.officeTime)
                setCommuteTime(user.officeWayTime)
                setUserProfileImg(user.profilePic)

                if (user?.homeLocation?.coordinates[0] && user?.homeLocation?.coordinates[1]) {
                    getNearByUsers(user?.homeLocation?.coordinates[0], user?.homeLocation?.coordinates[1])
                }
            }
        } catch (error) {
            console.log(error?.message);
        }
    }

    const generateMarkerDiv = (backendUrl, fileName, isUserOwn) => {
        const markerDiv = document.createElement('div');
        const userClass = isUserOwn ? '' : ' userOwn';
        markerDiv.innerHTML = `
                    <div class="map-pin${userClass}">
                        <div class="pin-inner">
                            <img src="${backendUrl}/images/${fileName}" alt="User" />
                        </div>
                    </div>
                `;

        return markerDiv;
    }

    const sendConnectionRequest = async (index, toUserId) => {
        try {
            const response = await axios.get(`${userBackendUrl}/api/user/sendConnectionRequest?fromUserId=${currentUserId}&targetUserId=${toUserId}`, { headers: { Authorization } });

            if (response.data.status) {
                toast.success(response.data.message)

                const temp = [...nearByUsers];
                temp[index].connectionStatus = 'requested';
                setNearByUsers(temp)
            }
        } catch (error) {
            error?.response && toast.error(error?.response?.data?.message)
        }
    }

    useEffect(() => {
        getUser()
    }, [])

    useEffect(() => {
        if (userLat && userLng) {
            const mymap = olaMaps.init({
                style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                container: 'map',
                center: [Number(userLng), Number(userLat)],
                zoom: 16
            });

            setMyMap(mymap)

            const markerDiv = generateMarkerDiv(userBackendUrl, userProfileImg, true)

            const marker = olaMaps.addMarker({ element: markerDiv, offset: [0, -45] })
                .setLngLat([Number(userLng), Number(userLat)])
                .addTo(mymap);

            marker.on('dragend', () => {
                const { lng, lat } = marker.getLngLat();
                setUserLng(lng.toString());
                setUserLat(lat.toString());
                getNearByUsers(lng, lat);
            });
        }
    }, [userLat, userLng, currentUserId]);

    useEffect(() => {
        nearByUsers.forEach(user => {
            const nearbyUsersMarker = generateMarkerDiv(userBackendUrl, user.profilePic)
            olaMaps.addMarker({ element: nearbyUsersMarker, offset: [0, -45], draggable: false })
                .setLngLat([user.longitude, user.latitude])
                .addTo(MyMap);
        });
    }, [nearByUsers])

    const toggleAccordion = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    const formatDistance = (distance) => {
        if (!distance) {
            return 0
        } else if (distance < 1000) {
            return `${distance.toFixed(2)} meters`
        } else if (distance > 1000) {
            const km = distance / 1000;

            if (km < 1) {
                return `${km.toFixed(2)} km`
            } else {
                return `${km.toFixed(2)} kms`
            }
        }
    }

    return (
        <>
            <div className='w-full h-full grid grid-cols-12 gap-3 p-3'>
                <div className='w-full col-span-12 lg:col-span-10 rounded-lg overflow-hidden'>
                    <div style={{ height: '500px', width: '100%' }}>
                        <div className='w-full h-[500px]' id='map' />
                    </div>
                </div>
                <div className='w-full col-span-12 lg:col-span-2 flex flex-col rounded-lg border border-gray-200'>
                    <div className='w-full flex justify-between items-center p-3'>
                        <p className='w-full text-[#76091f] text-xl font-semibold'>Nearby Users</p>
                        {/* <p className='w-3 h-3 rounded-full bg-[#76091f] animate-pulse'></p> */}
                        {/* <button className='bg-[#76091f] hover:bg-[#76091f]/80 cursor-pointer text-white rounded-md p-1 px-3 text-sm' onClick={() => getNearByUsers(userLng, userLat)}>Refresh</button> */}
                    </div>
                    <hr className='border border-gray-200' />
                    <aside className='w-full flex flex-col gap-3 p-1'>
                        {
                            loading ? <LoadingSpinner /> :
                                nearByUsers && nearByUsers?.length ?
                                    nearByUsers.map((user, index) => {
                                        return (
                                            <React.Fragment key={index}>
                                                <div className={`w-full rounded-lg flex justify-start items-center gap-3 p-3 ${openIndex === index ? 'bg-gray-200' : 'hover:bg-gray-100'} cursor-pointer transition`}>
                                                    <img src={`${userBackendUrl}/images/${user.profilePic}`} alt="" className='w-10 h-10 rounded-full' />
                                                    {/* <div className='w-full flex flex-col justify-between items-start truncate'> */}
                                                    <div className='w-full flex justify-between items-center'>
                                                        <span className='truncate'>{user.firstName} {user.lastName}</span>
                                                        <div className='flex items-center gap-2'>
                                                            <button disabled={user?.connectionStatus === 'requested' || user?.connectionStatus === 'connected'} onClick={() => sendConnectionRequest(index, user._id)} className='bg-[#76091f] text-white p-1 px-2 text-xs md:text-sm rounded-md not-disabled:cursor-pointer'>
                                                                {user?.connectionStatus === 'none' ? 'Connect' : user?.connectionStatus === 'requested' ? 'pending' : 'connected'}
                                                            </button>
                                                            <button className='cursor-pointer' onClick={() => toggleAccordion(index)}>
                                                                {openIndex === index ? <IoCloseCircle fontSize={20} /> : <CgInfo fontSize={20} />}
                                                            </button>
                                                        </div>
                                                    </div>
                                                    {/* <span className='text-sm'>{new Date().toISOString()}</span> */}
                                                    {/* </div> */}
                                                </div>
                                                {openIndex === index && (
                                                    <div className="w-full bg-gray-100 p-3 flex flex-col gap-1 rounded-lg text-sm text-gray-700 transition-all duration-300">
                                                        <p>Home Distance : {formatDistance(user.homeDistanceInMeters)}</p>
                                                        <p>WorkPlace Distance : {formatDistance(user.officeDistanceInMeters)}</p>
                                                        <p>Office Time : {user.officeTime}</p>
                                                        <p>WorkPlace Leave Time : {user.workplaceLeaveTime}</p>
                                                    </div>
                                                )}
                                            </React.Fragment>
                                        )
                                    }) : <p className='w-full text-center'>No nearby users found.</p>
                        }
                        {/* <AccordionItem title={1} content={1} /><AccordionItem title={1} content={1} /><AccordionItem title={1} content={1} /> */}
                    </aside>
                </div>
            </div>
        </>
    )
}

export default Dashboard