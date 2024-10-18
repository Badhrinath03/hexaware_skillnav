import React from 'react';

const ProgressBar = ({ progress, total }) => {
    const percentage = total > 0 ? (progress / total) * 100 : 0;
    const formattedPercentage = percentage === 100 || percentage === 0 ? percentage : percentage.toFixed(2);

    // Determine text color based on the percentage
    const textColor = percentage === 0 ? 'text-black' : 'text-gray-300';

    return (
        <div className="bg-gray-200 rounded-full w-full h-4 overflow-hidden">
            <div
                className={`bg-indigo-600 h-full rounded-full text-xs font-medium text-center ${textColor} relative bg-gradient-to-r from-violet-500 via-orange-600 to-indigo-900 bg-[length:200%_100%] animate-shine`}
                style={{ width: `${formattedPercentage}%` }}
            >
                <span className={`text-xs font-semibold ${textColor}`} style={{ lineHeight: '1rem' }}>
                    {formattedPercentage}%
                </span>
            </div>
        </div>
    );
};

export default ProgressBar;
