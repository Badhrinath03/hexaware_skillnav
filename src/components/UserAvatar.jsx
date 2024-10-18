import React from 'react';
import { getAuth } from 'firebase/auth';

const UserAvatar = ({ name, picture }) => {
    const auth = getAuth();
    const user = auth.currentUser;

    
    const firstName = name ? name.split(' ')[0] : 'User';

    return (
        <div className="flex items-center space-x-4">
            <div className="relative">
                <img
                    src={picture || 'https://via.placeholder.com/50'}
                    alt="User Avatar"
                    className="w-16 h-16 rounded-full object-cover"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div className="text-white">
                <p className="text-lg font-semibold">{firstName}</p>
                <p className="text-sm">{user?.email || 'user@example.com'}</p>
            </div>
        </div>
    );
};

export default UserAvatar;
