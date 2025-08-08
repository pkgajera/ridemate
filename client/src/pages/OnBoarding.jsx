import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { IoBusiness, IoHome, IoPersonSharp } from "react-icons/io5";
import { MdTwoWheeler } from "react-icons/md";
import { FaLocationDot } from "react-icons/fa6";
import axios from 'axios';
import { useAuth } from '../context/AllContext';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { decodeJWT, genders, seatingCapacity, stepOneSchema, stepThreeSchema, stepTwoSchema, vehicles } from './helper';

const OnBoardingForm = () => {
    const schemas = [stepOneSchema, stepTwoSchema, stepThreeSchema];

    const { userBackendUrl, Authorization, olaMapApiKey, olaMapApi } = useAuth();
    const navigate = useNavigate();

    const olaMaps = useMemo(() => new OlaMaps({
        apiKey: olaMapApiKey,
    }), []);

    const [step, setStep] = useState(0);
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

    const next = async () => {
        const isValid = await trigger();
        if (isValid) {
            setStep((prev) => prev + 1);
        }
    }

    const back = () => setStep((s) => Math.max(s - 1, 0));

    const steps = ['Account', 'Vehicle', 'Location'];

    const gender = watch('gender')
    const vehicleType = watch('vehicleType')
    const seatingCap = watch('seatingCapacity')
    const homeLatitude = watch('homeLatitude')
    const homeLongitude = watch('homeLongitude')
    const workplaceLatitude = watch('workplaceLatitude')
    const workplaceLongitude = watch('workplaceLongitude')
    const homeStreetAddress = watch('homeStreetAddress')
    const workplaceStreetAddress = watch('workplaceStreetAddress')

    const submitForms = async (data) => {
        try {
            const decoded = decodeJWT(Authorization)
            const userId = decoded?._id || ''

            const formValues = getValues();
            const formData = new FormData();

            for (const [key, value] of Object.entries(formValues)) {
                if (value instanceof File) {
                    formData.append(key, value);
                } else if (key === 'profilePic' && typeof value === 'string') {
                    formData.append('existingProfilePic', value);
                } else if (typeof value === 'object' && value !== null) {
                    formData.append(key, JSON.stringify(value));
                } else if (value !== undefined) {
                    formData.append(key, value);
                }
            }

            const response = await axios.post(`${userBackendUrl}/api/user/update-profile/${userId}`, formData, { headers: { Authorization } });

            if (response.data.status) {
                toast.success(response.data.message);
                localStorage.removeItem('incompleteCustomerData');
                navigate("/")
            }
        } catch (error) {
            error?.response && toast.error(error?.response?.data?.message);
        }
    }

    useEffect(() => {
        setValue('isVehicle', isVehicle);
    }, [isVehicle]);

    useEffect(() => {
        const savedData = JSON.parse(localStorage.getItem('incompleteCustomerData')) || {};

        if (!Object.entries(savedData).length) {
            return navigate("/")
        }

        for (const [key, value] of Object.entries(savedData)) {
            setValue(key, value);
        }
        setIsVehicle(savedData.isVehicle || false);
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

    const fetchHomeAddressesSuggestions = async () => {
        try {
            const params = {
                api_key: olaMapApiKey,
                input: homeStreetAddress
            }
            const response = await axios.get(`${olaMapApi}/places/v1/autocomplete`, { headers: { Authorization }, params });
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
            const response = await axios.get(`${olaMapApi}/places/v1/autocomplete`, { headers: { Authorization }, params });
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
        <div className="bg-gray-50">
            <div className="sticky top-0 backdrop-blur-md bg-white/60 shadow-sm px-4 py-3 z-[10000]">
                <div className="flex justify-between max-w-screen-md mx-auto flex-wrap gap-x-4">
                    {steps.map((stp, index) => (
                        <div
                            key={stp}
                            className={`flex-1 text-center text-xs sm:text-sm font-medium transition-all duration-300 ${index === step ? 'text-[#76091f] scale-105' : 'text-gray-400'}`}
                        >
                            <div className="mb-1">
                                <div
                                    className={`w-6 h-6 mx-auto rounded-full border-2 ${index <= step ? 'border-[#76091F] bg-[#76091F] text-white' : 'border-gray-300'
                                        } flex items-center justify-center text-[10px] sm:text-xs`}
                                >
                                    {index + 1}
                                </div>
                            </div>
                            {stp}
                        </div>
                    ))}
                </div>
            </div>
            <div
                className="w-full max-w-screen-md mx-auto p-4 flex justify-center items-center"
                style={{ minHeight: 'calc(100vh - 72px)', scrollbarWidth: 'none' }}
            >
                <div className="w-full bg-white rounded-lg p-4 sm:p-6 flex flex-col gap-6">
                    {step === 0 && (
                        <div className="w-full rounded-xl flex flex-col justify-center items-center gap-5">
                            <div className='w-auto bg-[#76091F] p-3 rounded-full'>
                                <IoPersonSharp fontSize={30} color='white' />
                            </div>
                            <div className='w-full flex flex-col justify-center items-center gap-1 text-center'>
                                <h2 className="text-xl font-semibold">Personal Details</h2>
                                <span className='text-sm text-gray-500'>Tell us a bit about yourself to get started</span>
                            </div>
                            <div className='w-full grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                <div className='w-full flex flex-col gap-1.5'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>First Name</span>
                                    <input {...register('firstName')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="First Name" />
                                    {errors.firstName && <p className="text-red-500 text-xs">{errors.firstName.message}</p>}
                                </div>
                                <div className='w-full flex flex-col gap-1.5'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>Last Name</span>
                                    <input {...register('lastName')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Last Name" />
                                    {errors.lastName && <p className="text-red-500 text-xs">{errors.lastName.message}</p>}
                                </div>
                                <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>Email Address</span>
                                    <input {...register('userEmail')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter email address" />
                                    {errors.userEmail && <p className="text-red-500 text-xs">{errors.userEmail.message}</p>}
                                </div>
                                <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>Phone Number</span>
                                    <input {...register('userMobile')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter phone number" />
                                    {errors.userMobile && <p className="text-red-500 text-xs">{errors.userMobile.message}</p>}
                                </div>
                                <div className='w-full flex flex-col gap-1.5 sm:col-span-2'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>Gender</span>
                                    <div className="relative">
                                        <select
                                            className={`appearance-none p-2 px-4 pr-12 w-full ${gender ? 'text-[#76091F]' : 'text-[#BD9099]'} bg-white border border-gray-300 rounded-md outline-none truncate`}
                                            {...register('gender')}
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
                            <div className='w-auto bg-[#76091F] p-3 rounded-full'>
                                <MdTwoWheeler fontSize={30} color='white' />
                            </div>
                            <div className='w-full flex flex-col justify-center items-center gap-1 text-center'>
                                <h2 className="text-xl font-semibold">Vehicle Information</h2>
                                <span className='text-sm text-gray-500'>Do you have a vehicle for ride sharing?</span>
                            </div>
                            <div className='w-full bg-gray-100 p-3 rounded-lg flex justify-between items-center'>
                                <div className='flex flex-col gap-1'>
                                    <p className='text-black text-base'>I have a vehicle</p>
                                    <span className='text-gray-400 text-xs'>Enable if you want to offer rides</span>
                                </div>
                                <div
                                    onClick={() => setIsVehicle(!isVehicle)}
                                    className={`relative inline-flex items-center cursor-pointer rounded-full w-14 h-7 transition-all duration-300 ease-in-out ${isVehicle ? 'bg-[#76091F]' : 'bg-gray-500'}`}
                                >
                                    <span className={`absolute left-1 top-1 transition-all duration-300 ease-in-out w-5 h-5 bg-white rounded-full ${isVehicle ? 'translate-x-7' : ''}`}></span>
                                </div>
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
                                            <input {...register('make')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Toyota" />
                                            {errors.make && <p className="text-red-500 text-xs">{errors.make.message}</p>}
                                        </div>
                                        <div className='w-full flex flex-col gap-1.5'>
                                            <span className='text-gray-400 text-xs sm:text-sm'>Model</span>
                                            <input {...register('model')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Crysta" />
                                            {errors.model && <p className="text-red-500 text-xs">{errors.model.message}</p>}
                                        </div>
                                        <div className='w-full flex flex-col gap-1.5'>
                                            <span className='text-gray-400 text-xs sm:text-sm'>Color</span>
                                            <input {...register('color')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Black" />
                                            {errors.color && <p className="text-red-500 text-xs">{errors.color.message}</p>}
                                        </div>
                                        <div className='w-full flex flex-col gap-1.5'>
                                            <span className='text-gray-400 text-xs sm:text-sm'>Seating Capacity</span>
                                            <div className="relative">
                                                <select
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
                            <div className='w-auto bg-[#76091F] p-3 rounded-full'>
                                <FaLocationDot fontSize={30} color='white' />
                            </div>
                            <div className='w-full flex flex-col justify-center items-center gap-1 text-center'>
                                <h2 className="text-xl font-semibold">Location Setup</h2>
                                <span className='text-sm text-gray-500'>Add your home and work addresses to find nearby connections</span>
                            </div>
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
                                    <input {...register('homeCity')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter City" />
                                    {errors.homeCity && <p className="text-red-500 text-xs">{errors.homeCity.message}</p>}
                                </div>
                                <div className='w-full flex flex-col gap-1.5'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>State</span>
                                    <input {...register('homeState')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter State" />
                                    {errors.homeState && <p className="text-red-500 text-xs">{errors.homeState.message}</p>}
                                </div>
                                <div className='w-full flex flex-col gap-1.5'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>Office Time</span>
                                    <input {...register('officeTime')} type='time' className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter City" />
                                    {errors.officeTime && <p className="text-red-500 text-xs">{errors.officeTime.message}</p>}
                                </div>
                                <div className='w-full flex flex-col gap-1.5'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>Office Way Time ( minutes )</span>
                                    <input {...register('officeWayTime')} type='number' className="input-no-spinner w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter office way time in minutes" />
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
                                    <input {...register('workplaceCity')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter City" />
                                    {errors.workplaceCity && <p className="text-red-500 text-xs">{errors.workplaceCity.message}</p>}
                                </div>
                                <div className='w-full flex flex-col gap-1.5'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>State</span>
                                    <input {...register('workplaceState')} className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" placeholder="Enter State" />
                                    {errors.workplaceState && <p className="text-red-500 text-xs">{errors.workplaceState.message}</p>}
                                </div>
                                <div className='w-full flex flex-col gap-1.5'>
                                    <span className='text-gray-400 text-xs sm:text-sm'>Workplace Leave Time</span>
                                    <input {...register('workplaceLeaveTime')} type='time' className="w-full p-2 border border-gray-300 focus:border-[#76091F] accent-[#76091F] outline-none text-[#76091F] rounded-lg" />
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
                                : <button className="px-4 py-2 rounded-lg bg-[#76091F] text-white hover:bg-[#76091F]/90 not-disabled:cursor-pointer" onClick={handleSubmit(submitForms)}>Finish</button>
                        }
                    </div>
                </div>
            </div>
        </div >
    );
};

export default OnBoardingForm;