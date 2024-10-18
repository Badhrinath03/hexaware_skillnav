import React from 'react';
import { useLocation } from 'react-router-dom';
import useMediaQuery from '../components/useMediaQuery'; // Custom hook to check screen size

const MainWrapper = ({ children, isSidebarOpen }) => {
    const location = useLocation();
    const isSmallOrMediumScreen = useMediaQuery('(max-width: 1024px)');

    const shouldApplyMargin = location.pathname !== '/' && !isSmallOrMediumScreen;

    return (
        <div className={`flex-grow overflow-y-auto ${shouldApplyMargin && !isSmallOrMediumScreen ? 'ml-64' : ''} transition-all`}>
            {children}
        </div>
    );
};

export default MainWrapper;
