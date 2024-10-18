import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebaseConfig';
import bg4 from '../images/4-bg.png';

const Sidebar = ({ role }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();

    const logOut = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Logout error: ", error);
        }
    };

    const menuItems = role === 'admin' ? [
        { name: 'Dashboard', icon: '🏠', path: '/admin' },
        { name: 'All Courses', icon: '📖', path: '/admin/all-courses' },
        { name: 'Add Course', icon: '📚', path: '/admin/add-course' }, 
        { name: 'Add Quiz', icon: '📝', path: '/admin/add-quiz' },
        { name: 'View Quiz', icon: '🎓', path: '/admin/view-quiz' },
        { name: 'Profile Management', icon: '👤', path: '/admin/profile-management' },
    ] : [
        { name: 'Dashboard', icon: '🏠', path: '/user' },
        { name: 'All Courses', icon: '📖', path: '/user/all-courses' },
        { name: 'Enrolled Courses', icon: '📚', path: '/user/enrolled-courses' },
        { name: 'Certifications', icon: '🎓', path: '/user/certification' },
        { name: 'Notifications', icon: '🔔', path: '/user/notification' },
        { name: 'Profile Management', icon: '👤', path: '/user/profile-management' },
        { name: 'Quiz', icon: '📝', path: '/user/quiz' },
    ];

    return (
        <>
            {/* Toggle Button for Small and Medium Screens */}
            <div className="lg:hidden fixed top-0 right-0 p-4 z-50">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={`p-2 text-white rounded-full bg-black transition-transform transform ${isOpen ? 'rotate-180' : 'rotate-0'} ${isOpen ? 'ml-4' : ''}`}
                >
                    {isOpen ? '◁' : '▷'}
                </button>
            </div>

            {/* Sidebar */}
            <div 
                className={`fixed top-0 left-0 h-screen bg-gray-800 text-white overflow-auto p-2 shadow-lg z-40 transition-transform transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:w-64 lg:block lg:flex-col`} 
            >
                <div className="flex flex-col h-full">
                    <div className="flex flex-col items-center mb-4">
                        <img 
                            className="rounded-full w-48 h-48 object-cover"
                            src={bg4}
                            alt="logo" 
                            draggable={false}
                        />
                    </div>

                    <ul className="flex-1">
                        {menuItems.map((item, index) => (
                            <li key={index} className="mb-2">
                                <Link to={item.path}>
                                    <button className="flex items-center w-full p-2 text-left hover:bg-blue-600 rounded-lg transition-colors duration-200 ease-in-out">
                                        <span className="mr-3 text-xl">{item.icon}</span>
                                        {item.name}
                                    </button>
                                </Link>
                            </li>
                        ))}
                    </ul>

                    <div className="mt-auto">
                        <button onClick={logOut} className="flex items-center w-full p-2 text-left bg-red-600 hover:bg-red-500 rounded-lg transition-colors duration-200 ease-in-out">
                            <span className="mr-3 text-xl">🔒</span>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Sidebar;
