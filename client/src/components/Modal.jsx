import React from "react";
import { IoIosCloseCircle } from "react-icons/io";

const Modal = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={onClose} 
        >
            <div
                className="bg-white rounded-lg shadow-xl max-h-[90vh] w-full max-w-md sm:max-w-lg md:max-w-xl p-5 relative overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-lg font-bold cursor-pointer"
                >
                    <IoIosCloseCircle fontSize={24}/>
                </button>
                {children}
            </div>
        </div>
    );
};

export default Modal;