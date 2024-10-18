// Notification.jsx
import React from 'react';

const Notification = ({ notifications }) => {
    return (
        <div className="bg-white shadow-md rounded-lg p-4 max-w-lg mx-auto">
            <div className="space-y-2">
                {notifications.length === 0 ? (
                    <p className="text-gray-500">No new notifications.</p>
                ) : (
                    notifications.map((notif, index) => (
                        <div key={index} className="bg-gray-100 p-2 rounded-md">
                            <p className="text-sm overflow-y-auto">{notif.text}</p>
                            <p className="text-xs text-gray-500">{new Date(notif.timestamp).toLocaleString()}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default Notification;
