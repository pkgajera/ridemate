import React, { useEffect, useMemo, useState } from 'react'
import { FaLocationDot } from 'react-icons/fa6';
import { FiEdit3 } from "react-icons/fi";
import { IoBusiness, IoClose, IoHome, IoPersonSharp } from "react-icons/io5";
import { BiSolidSave } from "react-icons/bi";
import { toast } from 'react-toastify'
import { MdTwoWheeler } from 'react-icons/md';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { decodeJWT, genders, seatingCapacity, stepOneSchema, stepThreeSchema, stepTwoSchema, vehicles } from './helper';
import { useAuth } from '../context/AllContext';
import { OlaMaps } from 'olamaps-web-sdk';
import axios from 'axios';

const Profile = () => {

    const schemas = [stepOneSchema, stepTwoSchema, stepThreeSchema];

    const { userBackendUrl, Authorization, olaMapApiKey, olaMapApi } = useAuth();

    const olaMaps = useMemo(() => new OlaMaps({
        apiKey: olaMapApiKey,
    }), []);

    const steps = [
        {
            icon: <IoPersonSharp fontSize={22} />,
            title: 'Personal'
        },
        {
            icon: <MdTwoWheeler fontSize={24} />,
            title: 'Vehicle'
        },
        {
            icon: <FaLocationDot fontSize={20} />,
            title: 'Location'
        }
    ];
    const [step, setStep] = useState(0);
    const [isEdit, setIsEdit] = useState(false);
    const [isVehicle, setIsVehicle] = useState(false);

    const [homeAddressSuggestions, setHomeAddressSuggestions] = useState([]);
    const [workplaceAddressSuggestions, setWorkplaceAddressSuggestions] = useState([]);

    const [loadingHomeAddresses, setLoadingHomeAddresses] = useState(false);
    const [loadingWorkplaceAddresses, setLoadingWorkplaceAddresses] = useState(false);

    const [hasSelectedHomeAddress, setHasSelectedHomeAddress] = useState(true);
    const [hasSelectedWorkplaceAddress, setHasSelectedWorkplaceAddress] = useState(true);

    const { register, watch, handleSubmit, setValue, trigger, getValues, formState: { errors }, } = useForm({
        resolver: zodResolver(schemas[step]),
        defaultValues: {
            firstName: '',
            lastName: '',
            userEmail: '',
            userMobile: '',
            gender: '',
            isVehicle: false,
            vehicleType: '',
            make: '',
            model: '',
            color: '',
            seatingCapacity: '',
            homeStreetAddress: '',
            homeCity: '',
            homeState: '',
            officeTime: '',
            homeLatitude: '',
            homeLongitude: '',
            officeWayTime: '',
            workplaceStreetAddress: '',
            workplaceCity: '',
            workplaceState: '',
            workplaceLeaveTime: '',
            workplaceLatitude: '',
            workplaceLongitude: ''
        },
        mode: 'onChange',
    });

    const gender = watch('gender')
    const vehicleType = watch('vehicleType')
    const seatingCap = watch('seatingCapacity')
    const homeLatitude = watch('homeLatitude')
    const homeLongitude = watch('homeLongitude')
    const workplaceLatitude = watch('workplaceLatitude')
    const workplaceLongitude = watch('workplaceLongitude')
    const homeStreetAddress = watch('homeStreetAddress')
    const workplaceStreetAddress = watch('workplaceStreetAddress')

    const next = async () => {
        if (isEdit) {
            const isValid = await trigger();
            if (isValid) {
                setStep((prev) => prev + 1);
            }
        } else {
            setStep((prev) => prev + 1);
        }
    }

    const back = () => setStep((s) => Math.max(s - 1, 0));

    // const handleSaveProfile = async (data) => {
    //     try {
    //         if (!isEdit) {
    //             return toast.warn("Click on edit profile to edit profile details.")
    //         }

    //         const decoded = decodeJWT(Authorization)
    //         const userId = decoded?._id || ''

    //         const formValues = getValues();
    //         const formData = new FormData();

    //         console.log(Object.entries(formValues), 'formValues');

    //         for (const [key, value] of Object.entries(formValues)) {
    //             if (value instanceof File) {
    //                 formData.append(key, value);
    //             } else if (key === 'profilePic' && typeof value === 'string') {
    //                 formData.append('existingProfilePic', value); // existing image string
    //             } else if (typeof value === 'object' && value !== null) {
    //                 formData.append(key, JSON.stringify(value));
    //             } else if (value !== undefined) {
    //                 formData.append(key, value);
    //             }
    //         }

    //         const response = await axios.post(`${userBackendUrl}/api/user/update-profile/${userId}`, formData, { headers: { Authorization } });

    //         if (response.data.status) {
    //             toast.success('Profile details updated successfully.');
    //             setIsEdit(false)
    //         }
    //     } catch (error) {
    //         error?.response && toast.error(error?.response?.data?.message);
    //     }
    // }

    const handleSaveProfile = async (data) => {
        try {
            if (!isEdit) {
                return toast.warn("Click on edit profile to edit profile details.");
            }

            const decoded = decodeJWT(Authorization);
            const userId = decoded?._id || '';
            const formValues = getValues();
            const formData = new FormData();

            for (const [key, value] of Object.entries(formValues)) {
                // Skip backend-managed fields
                if (['connections', 'connectionRequests'].includes(key)) continue;

                if (value instanceof File) {
                    formData.append(key, value);
                } else if (key === 'profilePic' && typeof value === 'string') {
                    formData.append('existingProfilePic', value); // for old image
                } else if (typeof value === 'object' && value !== null) {
                    formData.append(key, JSON.stringify(value));
                } else if (value !== undefined) {
                    formData.append(key, value);
                }
            }

            const response = await axios.post(
                `${userBackendUrl}/api/user/update-profile/${userId}`,
                formData,
                { headers: { Authorization } }
            );

            if (response.data.status) {
                toast.success('Profile details updated successfully.');
                setIsEdit(false);
            }
        } catch (error) {
            error?.response && toast.error(error?.response?.data?.message);
        }
    };


    const fetchHomeAddressesSuggestions = async () => {
        try {
            console.log("Hello");
            const params = {
                api_key: olaMapApiKey,
                input: homeStreetAddress
            }
            const response = await axios.get(`${olaMapApi}/places/v1/autocomplete`, { params });
            console.log("Response : ", response);
            if (response.data.status) {
                setLoadingHomeAddresses(false)
                setHomeAddressSuggestions(response.data.predictions)
            }
        } catch (error) {
            setHomeAddressSuggestions([])
            setLoadingHomeAddresses(false)
        }
    }

    const fetchWorkplaceAddressesSuggestions = async () => {
        try {
            const params = {
                api_key: olaMapApiKey,
                input: workplaceStreetAddress
            }
            const response = await axios.get(`${olaMapApi}/places/v1/autocomplete`, { params });
            if (response.data.status) {
                setLoadingWorkplaceAddresses(false)
                setWorkplaceAddressSuggestions(response.data.predictions)
            }
        } catch (error) {
            setWorkplaceAddressSuggestions([])
            setLoadingWorkplaceAddresses(false)
        }
    }

    const handleSelectHomeAddress = (location) => {
        const address = location?.structured_formatting?.secondary_text || '';
        const longitude = location?.geometry?.location?.lng;
        const latitude = location?.geometry?.location?.lat;

        setValue('homeStreetAddress', address);
        setValue('homeLongitude', longitude);
        setValue('homeLatitude', latitude);

        setHomeAddressSuggestions([]);
        setHasSelectedHomeAddress(true);
        setLoadingHomeAddresses(false);
    };

    const handleSelectWorkplaceAddress = (location) => {
        const address = location?.structured_formatting?.secondary_text || '';
        const longitude = location?.geometry?.location?.lng;
        const latitude = location?.geometry?.location?.lat;

        setValue('workplaceStreetAddress', address);
        setValue('workplaceLongitude', longitude);
        setValue('workplaceLatitude', latitude);

        setWorkplaceAddressSuggestions([]);
        setHasSelectedWorkplaceAddress(true);
        setLoadingWorkplaceAddresses(false);
    };

    const fetchUserDetails = async () => {
        try {
            const decoded = decodeJWT(Authorization)
            const userId = decoded?._id || '';

            const response = await axios.get(`${userBackendUrl}/api/user/getUser/${userId}`, { headers: { Authorization } });

            if (response.data.status) {
                const userData = response.data.data
                const user = {
                    ...userData,
                    homeLatitude: userData?.homeLocation?.coordinates[1],
                    homeLongitude: userData?.homeLocation?.coordinates[0],
                    workplaceLatitude: userData?.workplaceLocation?.coordinates[1],
                    workplaceLongitude: userData?.workplaceLocation?.coordinates[0]
                }

                if (Object.entries(user).length) {
                    for (const [key, value] of Object.entries(user)) {
                        setValue(key, value);
                    }
                    setIsVehicle(user.isVehicle || false);
                }
            }
        } catch (error) {
            console.log(error?.message);
        }
    }

    useEffect(() => {
        setValue('isVehicle', isVehicle);
    }, [isVehicle]);

    useEffect(() => {
        fetchUserDetails();
    }, []);

    useEffect(() => {
        if (step === 2 && homeLatitude && homeLongitude && document.getElementById('homeLocationMap')) {
            const mymap = olaMaps.init({
                style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                container: 'homeLocationMap',
                center: [homeLongitude, homeLatitude],
                zoom: 16
            });

            const marker = olaMaps.addMarker({ color: 'red', draggable: true })
                .setLngLat([homeLongitude, homeLatitude])
                .addTo(mymap);

            marker.on('dragend', () => {
                const { lng, lat } = marker.getLngLat();
                setValue('homeLongitude', lng);
                setValue('homeLatitude', lat);
            });
        }
    }, [step, homeLatitude, homeLongitude])

    useEffect(() => {
        if (step === 2 && workplaceLatitude && workplaceLongitude && document.getElementById('workMap')) {
            const mymap = olaMaps.init({
                style: "https://api.olamaps.io/tiles/vector/v1/styles/default-light-standard/style.json",
                container: 'workMap',
                center: [workplaceLongitude, workplaceLatitude],
                zoom: 16
            });

            const marker = olaMaps.addMarker({ color: 'red', draggable: true })
                .setLngLat([workplaceLongitude, workplaceLatitude])
                .addTo(mymap);

            marker.on('dragend', () => {
                const { lng, lat } = marker.getLngLat();
                setValue('workplaceLongitude', lng.toString());
                setValue('workplaceLatitude', lat.toString());
            });
        }
    }, [step, workplaceLatitude, workplaceLongitude])

    useEffect(() => {
        let delayDebounce;

        if (step === 2) {
            if (homeStreetAddress && !hasSelectedHomeAddress) {
                setLoadingHomeAddresses(true);
                delayDebounce = setTimeout(() => {
                    fetchHomeAddressesSuggestions();
                }, 500);
            } else {
                setLoadingHomeAddresses(false);
                setHomeAddressSuggestions([]);
            }
        }

        return () => clearTimeout(delayDebounce);
    }, [step, homeStreetAddress, hasSelectedHomeAddress]);

    useEffect(() => {
        let delayDebounce;

        if (step === 2) {
            if (workplaceStreetAddress && !hasSelectedWorkplaceAddress) {
                setLoadingWorkplaceAddresses(true);
                delayDebounce = setTimeout(() => {
                    fetchWorkplaceAddressesSuggestions();
                }, 500);
            } else {
                setLoadingWorkplaceAddresses(false);
                setWorkplaceAddressSuggestions([]);
            }
        }

        return () => clearTimeout(delayDebounce);
    }, [step, workplaceStreetAddress, hasSelectedWorkplaceAddress]);

    return (
        <>
            <div className='w-full flex flex-col bg-gray-50' style={{ minHeight: 'calc(100vh - 72px)' }}>
                <div className="sticky top-0 w-full backdrop-blur-md bg-white/60 shadow-sm z-[900] flex flex-col">
                    <div className='w-full h-20 border-b border-b-gray-200 flex justify-between items-center p-3'>
                        <div className='flex flex-col justify-center items-start'>
                            <p className='text-xl md:text-2xl font-semibold'>My Profile</p>
                            <span className='text-[#76091f]/70 truncate text-sm md:text-base'>Manage your account information</span>
                        </div>
                        <div className='flex justify-end items-center gap-3'>
                            {
                                isEdit ?
                                    <>
                                        <button className='flex justify-center items-center gap-2 border border-[#76091f] hover:bg-[#76091f] hover:text-white text-[#76091f] p-2 md:px-5 rounded-lg cursor-pointer hover:opacity-90' onClick={() => setIsEdit(false)}>
                                            <IoClose fontSize={20} /><span className='hidden md:block truncate'>Cancel</span>
                                        </button>
                                        <button className='flex justify-center items-center gap-2 border border-[#76091f] bg-[#76091f] text-white p-2 md:px-5 rounded-lg cursor-pointer hover:opacity-90' onClick={handleSubmit(handleSaveProfile)}>
                                            <BiSolidSave fontSize={20} /><span className='hidden md:block truncate'>Save</span>
                                        </button>
                                    </>
                                    :
                                    <button className='flex justify-center items-center gap-3 border border-[#76091f] bg-[#76091f] text-white p-2 md:px-5 rounded-lg cursor-pointer hover:opacity-90' onClick={() => setIsEdit(true)}>
                                        <FiEdit3 fontSize={20} /><span className='hidden md:block truncate'>Edit Profile</span>
                                    </button>
                            }
                        </div>
                    </div>
                    <div className='w-full border-b border-b-gray-200 flex justify-center items-center p-3 shadow'>
                        <div className="flex justify-between mx-auto flex-wrap bg-gray-200 gap-3 p-2 rounded-lg">
                            {
                                steps?.map((val, ind) => {
                                    return (
                                        <button className={`flex justify-center items-center gap-2 p-2 px-5 rounded-md cursor-pointer ${step === ind ? 'bg-white' : ''}`} key={ind}>
                                            {val?.icon}
                                            <span className='hidden md:block'>{val?.title}</span>
                                        </button>
                                    )
                                })
                            }
                        </div>
                    </div>
                </div>
                <div className="w-full max-w-screen-md mx-auto p-4 flex justify-center items-center" >
                    <div className="w-full bg-white rounded-lg p-4 sm:p-6 flex flex-col gap-6">
                        {step === 0 && (
                            <div className="w-full rounded-xl flex flex-col justify-center items-center gap-5">
                                <h2 className="w-full text-left text-xl font-semibold">Personal Details</h2>
                                <div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    <div className='w-full flex flex-col gap-1.5'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>First Name</span>
                                        <input disabled={!isEdit} {...register('firstName')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="First Name" />
                                        {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Last Name</span>
                                        <input disabled={!isEdit} {...register('lastName')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Last Name" />
                                        {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Email Address</span>
                                        <input disabled={!isEdit} {...register('userEmail')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter email address" />
                                        {errors.userEmail && <p className="text-red-500 text-xs">{errors.userEmail.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Phone Number</span>
                                        <input disabled={!isEdit} {...register('userMobile')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter phone number" />
                                        {errors.userMobile && <p className="text-red-500 text-xs">{errors.userMobile.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Gender</span>
                                        <div className="relative">
                                            <select
                                                className={`appearance-none p-2 px-4 pr-12 w-full ${gender ? 'text-[#76091F]' : 'text-[#BD9099]'} bg-white border border-gray-300 rounded-md outline-none truncate`}
                                                {...register('gender')} disabled={!isEdit}
                                            >
                                                <option value="">Select your gender</option>
                                                {
                                                    genders?.map((gender, index) => {
                                                        return (
                                                            <option value={gender.value} key={index}>{gender.label}</option>
                                                        )
                                                    })
                                                }
                                            </select>
                                            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5 text-[#BD9099]">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                </svg>
                                            </div>
                                        </div>
                                        {errors.gender && <p className="text-red-500 text-xs">{errors.gender.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Upload profile pic</span>
                                        <input
                                            // {...register('profilePic')}
                                            type="file"
                                            accept="image/*"
                                            disabled={!isEdit}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setValue('profilePic', file, { shouldValidate: true });
                                            }}
                                            className="w-full cursor-pointer file:cursor-pointer border border-gray-300 accent-[#76091F] outline-none text-[#76091F] rounded-lg file:bg-[#76091F] file:text-white file:p-2 file:px-3"
                                        />
                                        {errors.profilePic && <p className="text-red-500 text-xs">{errors.profilePic.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                        {step === 1 && (
                            <div className="w-full rounded-xl flex flex-col justify-center items-center gap-5">
                                <h2 className="w-full text-left text-xl font-semibold">Vehicle Details</h2>
                                <div className='w-full bg-gray-100 p-3 rounded-lg flex justify-between items-center'>
                                    <div className='flex flex-col gap-1'>
                                        <p className='text-black text-base'>I have a vehicle</p>
                                        <span className='text-gray-400 text-xs'>Enable if you want to offer rides</span>
                                    </div>
                                    <button disabled={!isEdit}
                                        onClick={() => setIsVehicle(!isVehicle)}
                                        className={`relative inline-flex items-center cursor-pointer rounded-full w-14 h-7 transition-all duration-300 ease-in-out ${isVehicle ? 'bg-[#76091F]' : 'bg-gray-500'}`}
                                    >
                                        <span className={`absolute left-1 top-1 transition-all duration-300 ease-in-out w-5 h-5 bg-white rounded-full ${isVehicle ? 'translate-x-7' : ''}`}></span>
                                    </button>
                                </div>
                                {
                                    isVehicle ?
                                        <div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                            <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                                <span className='text-gray-400 text-xs sm:text-sm'>Vehicle Type</span>
                                                <div className="relative">
                                                    <select
                                                        className={`appearance-none p-2 px-4 pr-12 w-full ${vehicleType ? 'text-[#76091F]' : 'text-[#BD9099]'} bg-white border border-gray-300 rounded-md outline-none truncate`}
                                                        {...register('vehicleType')}
                                                        disabled={!isEdit}
                                                    >
                                                        <option value="">Select vehicle type</option>
                                                        {
                                                            vehicles?.map((vehicle, index) => {
                                                                return (
                                                                    <option value={vehicle.value} key={index}>{vehicle.label}</option>
                                                                )
                                                            })
                                                        }
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5 text-[#BD9099]">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                        </svg>
                                                    </div>
                                                </div>
                                                {errors.vehicleType && <p className="text-red-500 text-xs">{errors.vehicleType.message}</p>}
                                            </div>
                                            <div className='w-full flex flex-col gap-1.5'>
                                                <span className='text-gray-400 text-xs sm:text-sm'>Make</span>
                                                <input disabled={!isEdit} {...register('make')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Toyota" />
                                                {errors.make && <p className="text-red-500 text-xs">{errors.make.message}</p>}
                                            </div>
                                            <div className='w-full flex flex-col gap-1.5'>
                                                <span className='text-gray-400 text-xs sm:text-sm'>Model</span>
                                                <input disabled={!isEdit} {...register('model')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Crysta" />
                                                {errors.model && <p className="text-red-500 text-xs">{errors.model.message}</p>}
                                            </div>
                                            <div className='w-full flex flex-col gap-1.5'>
                                                <span className='text-gray-400 text-xs sm:text-sm'>Color</span>
                                                <input disabled={!isEdit} {...register('color')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Black" />
                                                {errors.color && <p className="text-red-500 text-xs">{errors.color.message}</p>}
                                            </div>
                                            <div className='w-full flex flex-col gap-1.5'>
                                                <span className='text-gray-400 text-xs sm:text-sm'>Seating Capacity</span>
                                                <div className="relative">
                                                    <select disabled={!isEdit}
                                                        className={`appearance-none p-2 px-4 pr-12 w-full ${seatingCap ? 'text-[#76091F]' : 'text-[#BD9099]'} bg-white border border-gray-300 rounded-md outline-none truncate`}
                                                        {...register('seatingCapacity')}
                                                    >
                                                        <option value="">Select seating capacity</option>
                                                        {
                                                            seatingCapacity?.map((val, index) => {
                                                                return (
                                                                    <option value={val.value} key={index}>{val.label}</option>
                                                                )
                                                            })
                                                        }
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="h-5 w-5 text-[#BD9099]">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                                        </svg>
                                                    </div>
                                                </div>
                                                {errors.seatingCapacity && <p className="text-red-500 text-xs">{errors.seatingCapacity.message}</p>}
                                            </div>
                                        </div> : null
                                }
                            </div>
                        )}
                        {step === 2 && (
                            <div className="w-full rounded-xl flex flex-col justify-center items-center gap-5">
                                <h2 className="w-full text-left text-xl font-semibold">Location Details</h2>
                                <div className='w-full flex justify-start items-center gap-1.5'>
                                    <IoHome fontSize={20} color='76091F' />
                                    <span className='font-medium'>Home Address</span>
                                </div>
                                <div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Address</span>
                                        <div className='w-full relative'>
                                            <input
                                                type='text'
                                                disabled={!isEdit}
                                                className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg resize-none"
                                                placeholder='Enter Address'
                                                {...register('homeStreetAddress')}
                                                onChange={(e) => {
                                                    setHasSelectedHomeAddress(false);
                                                    setValue('homeStreetAddress', e.target.value);
                                                }}
                                            />
                                            {
                                                homeStreetAddress && !hasSelectedHomeAddress ?
                                                    <div className='absolute p-1 w-full max-h-60 overflow-y-auto top-12 left-0 rounded-lg bg-gray-100 border border-gray-300 z-[1000] shadow-2xl'>
                                                        {loadingHomeAddresses ? (
                                                            <p className='w-full p-2 text-center text-gray-400 italic'>Loading suggestions...</p>
                                                        ) : homeAddressSuggestions && homeAddressSuggestions.length ? (
                                                            homeAddressSuggestions.map((location, ind) => (
                                                                <div
                                                                    className='w-full flex flex-col gap-1 p-2 rounded-lg hover:bg-white cursor-pointer'
                                                                    key={ind}
                                                                    onClick={() => handleSelectHomeAddress(location)}
                                                                >
                                                                    <p className='truncate text-[10px] md:text-sm'>
                                                                        {location?.structured_formatting?.main_text}
                                                                    </p>
                                                                    <span className='truncate text-xs text-gray-500'>
                                                                        {location?.structured_formatting?.secondary_text}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className='w-full p-2 text-center text-gray-500'>No result found.</p>
                                                        )}
                                                    </div> : null
                                            }
                                        </div>
                                        {errors.homeStreetAddress && <p className="text-red-500 text-xs">{errors.homeStreetAddress.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>City</span>
                                        <input disabled={!isEdit} {...register('homeCity')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter City" />
                                        {errors.homeCity && <p className="text-red-500 text-xs">{errors.homeCity.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>State</span>
                                        <input disabled={!isEdit} {...register('homeState')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter State" />
                                        {errors.homeState && <p className="text-red-500 text-xs">{errors.homeState.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Office Time</span>
                                        <input disabled={!isEdit} {...register('officeTime')} type='time' className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter City" />
                                        {errors.officeTime && <p className="text-red-500 text-xs">{errors.officeTime.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Office Way Time ( minutes )</span>
                                        <input disabled={!isEdit} {...register('officeWayTime')} type='number' className="input-no-spinner w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter office way time in minutes" />
                                        {errors.officeWayTime && <p className="text-red-500 text-xs">{errors.officeWayTime.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1 sm:col-span-2'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Current Location for Home</span>
                                        {
                                            homeLatitude && homeLongitude ?
                                                (<div style={{ height: '300px', width: '100%' }}>
                                                    <div className='w-full h-[300px]' id='homeLocationMap' />
                                                </div>) : null
                                        }
                                        {errors.homeLongitude && <p className="text-red-500 text-xs">{errors.homeLongitude.message}</p>}
                                    </div>
                                </div>
                                <div className='w-full flex justify-start items-center gap-1.5'>
                                    <IoBusiness fontSize={20} color='76091F' />
                                    <span className='font-medium'>Work Address</span>
                                </div>
                                <div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                    <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Address</span>
                                        <div className='w-full relative'>
                                            <input
                                                type='text'
                                                disabled={!isEdit}
                                                className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg resize-none"
                                                placeholder='Enter Address'
                                                {...register('workplaceStreetAddress')}
                                                onChange={(e) => {
                                                    setHasSelectedWorkplaceAddress(false);
                                                    setValue('workplaceStreetAddress', e.target.value);
                                                }}
                                            />
                                            {
                                                workplaceStreetAddress && !hasSelectedWorkplaceAddress ?
                                                    <div className='absolute p-1 w-full max-h-60 overflow-y-auto top-12 left-0 rounded-lg bg-gray-100 border border-gray-300 z-[1000] shadow-2xl'>
                                                        {loadingWorkplaceAddresses ? (
                                                            <p className='w-full p-2 text-center text-gray-400 italic'>Loading suggestions...</p>
                                                        ) : workplaceAddressSuggestions && workplaceAddressSuggestions.length ? (
                                                            workplaceAddressSuggestions.map((location, ind) => (
                                                                <div
                                                                    className='w-full flex flex-col gap-1 p-2 rounded-lg hover:bg-white cursor-pointer'
                                                                    key={ind}
                                                                    onClick={() => handleSelectWorkplaceAddress(location)}
                                                                >
                                                                    <p className='truncate text-[10px] md:text-sm'>
                                                                        {location?.structured_formatting?.main_text}
                                                                    </p>
                                                                    <span className='truncate text-xs text-gray-500'>
                                                                        {location?.structured_formatting?.secondary_text}
                                                                    </span>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className='w-full p-2 text-center text-gray-500'>No result found.</p>
                                                        )}
                                                    </div> : null
                                            }
                                        </div>
                                        {errors.workplaceStreetAddress && <p className="text-red-500 text-xs">{errors.workplaceStreetAddress.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>City</span>
                                        <input disabled={!isEdit} {...register('workplaceCity')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter City" />
                                        {errors.workplaceCity && <p className="text-red-500 text-xs">{errors.workplaceCity.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>State</span>
                                        <input disabled={!isEdit} {...register('workplaceState')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter State" />
                                        {errors.workplaceState && <p className="text-red-500 text-xs">{errors.workplaceState.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Workplace Leave Time</span>
                                        <input disabled={!isEdit} {...register('workplaceLeaveTime')} type='time' className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" />
                                        {errors.workplaceLeaveTime && <p className="text-red-500 text-xs">{errors.workplaceLeaveTime.message}</p>}
                                    </div>
                                    <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                        <span className='text-gray-400 text-xs sm:text-sm'>Current Location for Workplace</span>
                                        {
                                            workplaceLatitude && workplaceLongitude ?
                                                <div style={{ height: '300px', width: '100%' }}>
                                                    <div className='w-full h-[300px]' id='workMap' />
                                                </div> : null
                                        }
                                        {errors.workplaceLongitude && <p className="text-red-500 text-xs">{errors.workplaceLongitude.message}</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={back} disabled={step === 0} className="order-2 sm:order-0 px-4 py-2 rounded-lg text-[#76091F] border border-[#76091F] not-disabled:hover:bg-[#76091F] not-disabled:hover:text-white not-disabled:cursor-pointer disabled:opacity-50">Back</button>
                            {
                                step < 2 ?
                                    <button onClick={next} className="px-4 py-2 rounded-lg bg-[#76091F] text-white hover:bg-[#76091F]/90 not-disabled:cursor-pointer">Next</button>
                                    : <button disabled={!isEdit} onClick={handleSubmit(handleSaveProfile)} className="px-4 py-2 rounded-lg bg-[#76091F] text-white hover:bg-[#76091F]/90 not-disabled:cursor-pointer">Finish</button>
                            }
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default Profile