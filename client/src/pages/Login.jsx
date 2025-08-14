import React, { useState } from 'react'
import LoginSignUp from '../assets/loginSignUp.jpeg'
import { GoEyeClosed } from "react-icons/go";
import { RxEyeOpen } from "react-icons/rx";
import axios from 'axios'
import { useAuth } from '../context/AllContext';
import { toast } from 'react-toastify';
import { NavLink, useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

const Login = () => {

    const { RidemateLogo, userBackendUrl, storeTokenInLs } = useAuth();

    const navigate = useNavigate();

    const [login, setLogin] = useState(true);

    const loginObj = {
        userEmailMobile: '',
        password: ''
    }
    const [loginUser, setLoginUser] = useState(loginObj)

    const registerObj = {
        firstName: '',
        lastName: '',
        userEmail: '',
        userMobile: '',
        password: ''
    }
    const [registerUser, setRegisterUser] = useState(registerObj)

    const [showPassword, setShowPassword] = useState(false)
    const [isReadPrivacyPolicy, setIsReadPrivacyPolicy] = useState(false)
    const [error, setError] = useState('');
    const [isOpen, setIsOpen] = useState(false);

    const forgetPasswordObj = {
        emailMobile: '',
        oldPassword: '',
        newPassword: '',
        verifyNewPassword: ''
    }

    const showForgetPasswordObj = {
        oldPassword: false,
        newPassword: false,
        verifyNewPassword: false
    }

    const [forgetPassword, setForgetPassword] = useState(forgetPasswordObj)
    const [showForgetPassword, setShowForgetPassword] = useState(showForgetPasswordObj)
    const [forgetPasswordErr, setForgetPasswordErr] = useState('');

    const loginInput = [
        {
            label: "Enter Email or Mobile",
            placeholder: "Enter your email or mobile",
            type: "text",
            name: "userEmailMobile",
            value: loginUser.userEmailMobile,
            inputMode: 'text'
        },
        {
            label: "Password",
            placeholder: "Enter password",
            type: showPassword ? "text" : "password",
            name: "password",
            value: loginUser.password,
            isPassword: true
        }
    ]

    const registerInput = [
        {
            label: "First Name",
            placeholder: "Enter your first name",
            type: "text",
            name: "firstName",
            value: registerUser.firstName,
            inputMode: 'text'
        },
        {
            label: "Last Name",
            placeholder: "Enter your last name",
            type: "text",
            name: "lastName",
            value: registerUser.lastName,
            inputMode: 'text'
        },
        {
            label: "Mobile Number",
            placeholder: "Enter your mobile number",
            type: "number",
            name: "userMobile",
            value: registerUser.userMobile
        },
        {
            label: "Email",
            placeholder: "Enter your email address",
            type: "email",
            name: "userEmail",
            value: registerUser.userEmail
        },
        {
            label: "Password",
            placeholder: "Enter password",
            type: showPassword ? "text" : "password",
            name: "password",
            value: registerUser.password,
            isPassword: true
        }
    ]

    const handleChangeRegisterDetails = (e) => {
        setRegisterUser({ ...registerUser, [e.target.name]: e.target.value });
    };

    const handleChangeLoginDetails = (e) => {
        setLoginUser({ ...loginUser, [e.target.name]: e.target.value })
    }

    const handleLogin = async () => {
        try {
            if (!loginUser.userEmailMobile) {
                return setError("Email or mobile required.")
            }

            if (!loginUser.password) {
                return setError("Password required.")
            }

            const response = await axios.post(`${userBackendUrl}/api/user/login`, loginUser);

            if (response.data.status) {
                toast.success(response.data.message)
                storeTokenInLs(response.data.token)
                checkProfileDetails(response?.data?.user?._id)
                setLoginUser(loginObj)
                setError('');
            }
        } catch (error) {
            console.log("An error while login : ", error);
            error?.response && toast.error(error?.response?.data?.message)
        }
    }

    const handleRegister = async () => {
        try {
            if (!registerUser.firstName || !registerUser.lastName || !registerUser.userEmail || !registerUser.userMobile || !registerUser.password) {
                return setError("All fields required.")
            }

            if (!isReadPrivacyPolicy) {
                return setError("Please read & agree terms and conditions.")
            }

            const response = await axios.post(`${userBackendUrl}/api/user/register`, registerUser);

            if (response.data.status) {
                toast.success(response.data.message)
                setRegisterUser(registerObj)
                setError('');
                setLogin(true);
                setIsReadPrivacyPolicy(false)
            }
        } catch (error) {
            console.log("An error while register : ", error);
            error?.response && toast.error(error?.response?.data?.message)
        }
    }

    const checkProfileDetails = async (id) => {
        try {
            const response = await axios.post(`${userBackendUrl}/api/user/check-profile/${id}`);

            if (response.data.status) {
                navigate('/');
            } else {
                localStorage.setItem('incompleteCustomerData', JSON.stringify(response.data.existingData));
                navigate('/onboard');
            }
        } catch (error) {
            console.log("An error while checking profile details : ", error);
        }
    }

    const handleModalClose = () => {
        setIsOpen(false)
        setForgetPassword(forgetPasswordObj)
        setForgetPasswordErr('')
    }

    const handleResetPassword = async () => {
        try {
            if (!forgetPassword.emailMobile) {
                return setForgetPasswordErr("Email or mobile required.")
            } else if (!forgetPassword.oldPassword) {
                return setForgetPasswordErr("Old password required.")
            } else if (!forgetPassword.newPassword) {
                return setForgetPasswordErr("New password required.")
            } else if (!forgetPassword.verifyNewPassword) {
                return setForgetPasswordErr("Verify New Password required.")
            } else if ((forgetPassword.newPassword && forgetPassword.verifyNewPassword) && (forgetPassword.newPassword !== forgetPassword.verifyNewPassword)) {
                return setForgetPasswordErr("New and Verify New password should be same")
            } else {
                setForgetPasswordErr("");
                const response = await axios.post(`${userBackendUrl}/api/user/forgetPassword`, {
                    emailMobile: forgetPassword.emailMobile,
                    oldPassword: forgetPassword.oldPassword,
                    newPassword: forgetPassword.newPassword,
                    verifyNewPassword: forgetPassword.verifyNewPassword,
                })

                if (response.data.status) {
                    toast.success(response.data.message);
                    handleModalClose();
                }
            }
        } catch (error) {
            error?.response && toast.error(error?.response?.data?.message)
        }
    }

    return (
        <>
            <div className="min-h-[100vh] w-full flex justify-center items-center overflow-x-hidden bg-cover bg-no-repeat" style={{ backgroundImage: `url(${LoginSignUp})` }}>
                <div className="w-full max-w-7xl mx-auto flex flex-col md:flex-row justify-center items-center bg-white md:rounded-2xl overflow-hidden h-[100vh] md:h-[90vh] p-5">
                    <div className="hidden md:flex flex-col justify-end w-1/2 h-full bg-center bg-cover relative rounded-xl overflow-hidden" style={{ backgroundImage: `url(${LoginSignUp})` }}>
                        <div className="absolute bottom-0 left-0 w-full p-6 lg:p-10 text-white bg-gradient-to-t from-black/70 to-transparent">
                            <p className="text-3xl lg:text-5xl font-bold mb-2">One Tap to Everything You Need</p>
                            <span className="text-sm lg:text-base text-white/70">Experience seamless access to everything you desire, curated with core.</span>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 h-full flex justify-center items-center">
                        <div className="w-full max-h-[100svh] overflow-y-auto py-6 sm:py-8 px-4 sm:px-6 flex flex-col items-center gap-8" style={{ scrollbarWidth: 'none' }}>
                            <img src={RidemateLogo} alt={"RidemateLogo"} className='w-40' />

                            <div className="w-full max-w-xl border border-gray-300 rounded-2xl p-5 sm:p-6 md:p-8 flex flex-col gap-6 sm:gap-10">
                                <div className="text-center">
                                    <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-black/80">
                                        {login ? "Welcome Back" : "Sign Up"}
                                    </p>
                                    <span className="text-xs sm:text-sm md:text-base text-black/70">
                                        {login
                                            ? "Enter your email and password to access your account."
                                            : "Sign up to unlock your personalized experience."}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {(login ? loginInput : registerInput)?.map((val, ind) => (
                                        <div className="flex flex-col gap-2" key={ind}>
                                            <label className="text-xs sm:text-sm font-medium text-black/60 flex gap-1">
                                                {val?.label} <span className="text-[#76091F]">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={val.type}
                                                    name={val.name}
                                                    placeholder={val.placeholder}
                                                    value={val.value}
                                                    className={`w-full bg-gray-200 p-2 sm:p-3 input-no-spinner ${val.isPassword ? "pr-10" : ""} rounded-lg text-sm text-[#76091F] outline-none border border-gray-200 focus:border-[#76091F]`}
                                                    onChange={login ? handleChangeLoginDetails : handleChangeRegisterDetails}
                                                />
                                                {val?.isPassword && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute top-1/2 right-3 transform -translate-y-1/2"
                                                    >
                                                        {showPassword ? <GoEyeClosed color="#76091F" size={20} /> : <RxEyeOpen color="#76091F" size={20} />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {login ? (
                                        <div className="text-right">
                                            <button onClick={() => setIsOpen(true)} className="text-xs sm:text-sm font-medium text-[#76091F] cursor-pointer">Forgot Password?</button>
                                        </div>
                                    ) : (
                                        <label className="text-sm text-black/90 flex items-start gap-2">
                                            <input
                                                type="checkbox"
                                                checked={isReadPrivacyPolicy}
                                                onChange={(e) => setIsReadPrivacyPolicy(e.target.checked)}
                                            />
                                            <span>I agree to the Terms & Conditions and Privacy Policy.</span>
                                        </label>
                                    )}
                                    {error && <span className="text-xs sm:text-sm text-[#76091F]">{error}</span>}
                                </div>
                                <div className="flex flex-col gap-2 items-center">
                                    <button
                                        onClick={login ? handleLogin : handleRegister}
                                        className="w-full py-3 bg-[#76091F] text-white rounded-lg hover:opacity-90 transition cursor-pointer"
                                    >
                                        {login ? "Login" : "Get Started"}
                                    </button>
                                    <div className="flex flex-wrap justify-center items-center gap-1">
                                        <p className="text-black/80">
                                            {login ? "Are you a new user ?" : "Already have an account ?"}
                                        </p>
                                        <button
                                            onClick={() => {
                                                setLogin(!login);
                                                handleModalClose();
                                                setError("");
                                            }}
                                            className="text-[#76091F] font-medium cursor-pointer hover:underline"
                                        >
                                            {login ? "Sign Up" : "Sign In"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <Modal isOpen={isOpen} onClose={handleModalClose}>
                <div className='w-full flex flex-col gap-5'>
                    <h2 className='font-medium text-lg'>Forgot Password</h2>
                    <div className='w-full flex flex-col gap-1'>
                        <label className="text-xs sm:text-sm font-medium text-black/60 flex gap-1">
                            Enter Email or Mobile <span className="text-[#76091F]">*</span>
                        </label>
                        <input
                            type="text"
                            className={`w-full bg-gray-200 p-2 input-no-spinner rounded-lg text-sm text-[#76091F] outline-none border border-gray-200 focus:border-[#76091F]`}
                            value={forgetPassword.emailMobile}
                            onChange={(e) => setForgetPassword({ ...forgetPassword, emailMobile: e.target.value })}
                        />
                    </div>
                    <div className='w-full flex flex-col gap-1'>
                        <label className="text-xs sm:text-sm font-medium text-black/60 flex gap-1">
                            Enter Old password <span className="text-[#76091F]">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showForgetPassword?.oldPassword ? "text" : "password"}
                                className={`w-full bg-gray-200 p-2 sm:p-3 input-no-spinner pr-10 rounded-lg text-sm text-[#76091F] outline-none border border-gray-200 focus:border-[#76091F]`}
                                value={forgetPassword.oldPassword}
                                onChange={(e) => setForgetPassword({ ...forgetPassword, oldPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowForgetPassword({ ...showForgetPassword, oldPassword: !showForgetPassword.oldPassword })}
                                className="absolute top-1/2 right-3 transform -translate-y-1/2"
                            >
                                {showForgetPassword?.oldPassword ? <GoEyeClosed color="#76091F" size={20} /> : <RxEyeOpen color="#76091F" size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className='w-full flex flex-col gap-1'>
                        <label className="text-xs sm:text-sm font-medium text-black/60 flex gap-1">
                            Enter New password <span className="text-[#76091F]">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showForgetPassword?.newPassword ? "text" : "password"}
                                className={`w-full bg-gray-200 p-2 sm:p-3 input-no-spinner pr-10 rounded-lg text-sm text-[#76091F] outline-none border border-gray-200 focus:border-[#76091F]`}
                                value={forgetPassword.newPassword}
                                onChange={(e) => setForgetPassword({ ...forgetPassword, newPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowForgetPassword({ ...showForgetPassword, newPassword: !showForgetPassword.newPassword })}
                                className="absolute top-1/2 right-3 transform -translate-y-1/2"
                            >
                                {showForgetPassword?.newPassword ? <GoEyeClosed color="#76091F" size={20} /> : <RxEyeOpen color="#76091F" size={20} />}
                            </button>
                        </div>
                    </div>
                    <div className='w-full flex flex-col gap-1'>
                        <label className="text-xs sm:text-sm font-medium text-black/60 flex gap-1">
                            Verify New password <span className="text-[#76091F]">*</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showForgetPassword?.verifyNewPassword ? "text" : "password"}
                                className={`w-full bg-gray-200 p-2 sm:p-3 input-no-spinner pr-10 rounded-lg text-sm text-[#76091F] outline-none border border-gray-200 focus:border-[#76091F]`}
                                value={forgetPassword.verifyNewPassword}
                                onChange={(e) => setForgetPassword({ ...forgetPassword, verifyNewPassword: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowForgetPassword({ ...showForgetPassword, verifyNewPassword: !showForgetPassword.verifyNewPassword })}
                                className="absolute top-1/2 right-3 transform -translate-y-1/2"
                            >
                                {showForgetPassword?.verifyNewPassword ? <GoEyeClosed color="#76091F" size={20} /> : <RxEyeOpen color="#76091F" size={20} />}
                            </button>
                        </div>
                    </div>
                    {forgetPasswordErr && <p className="text-red-500 text-xs">{forgetPasswordErr}</p>}
                    <div className='w-full flex justify-end items-center'>
                        <button className='p-1.5 px-4 bg-[#76091F] text-white rounded-lg hover:opacity-90 transition cursor-pointer' onClick={handleResetPassword}>Reset</button>
                    </div>
                </div>
            </Modal>
        </>
    )
}

export default Login