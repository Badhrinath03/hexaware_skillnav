import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';
import { collection, doc, getDoc, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { ClipLoader } from 'react-spinners';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {Notification, UserAvatar, ProgressBar, Chart} from '../../components/index'

// Function to initialize daily usage (in hrs)
const initializeDailyUsage = async (userId) => {
    try {
        const startOfMonth = dayjs().startOf('month');
        const endOfMonth = dayjs().endOf('month');
        let currentDate = startOfMonth;

        while (currentDate.isBefore(endOfMonth)) {
            const dateKey = currentDate.format('YYYY-MM-DD');
            const dailyUsageRef = doc(db, 'users', userId, 'dailyUsage', dateKey);
            await setDoc(dailyUsageRef, { hoursSpent: 0 });
            currentDate = currentDate.add(1, 'day');
        }

        console.log('Daily usage initialized successfully');
    } catch (error) {
        console.error('Error initializing daily usage:', error);
    }
};

const UserDashboard = () => {
    const navigate = useNavigate();
    const [userName, setUserName] = useState('');
    const [picture, setPicture] = useState(null);
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [notEnrolledCourses, setNotEnrolledCourses] = useState([]);
    const [courseProgress, setCourseProgress] = useState({});
    const [notifications, setNotifications] = useState([]);
    const [dailyUsageData, setDailyUsageData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const auth = getAuth();
        const user = auth.currentUser;
    
        if (user) {
            const storedStartTime = localStorage.getItem(`startTime_${user.uid}`);
            const storedDate = localStorage.getItem(`date_${user.uid}`);
    
            if (storedStartTime && storedDate === dayjs().format('YYYY-MM-DD')) {
                // Continue from where it left off
                localStorage.setItem('loginTime', storedStartTime);
            } else {
                // i will create new session here
                localStorage.setItem('loginTime', Date.now());
                localStorage.setItem(`date_${user.uid}`, dayjs().format('YYYY-MM-DD'));
            }
        }
    
        return () => {
            if (user) {
                handleLogout(user.uid);
            }
        };
    }, []);
    

    useEffect(() => {
        const fetchUserData = async () => {
            const auth = getAuth();
            const user = auth.currentUser;

            if (user) {
                try {
                    // Fetch all data in parallel using Promise.all
                    await Promise.all([
                        fetchUserInfo(user.uid),
                        fetchEnrolledCourses(user.uid),
                        fetchNotifications(user.uid),
                        initializeDailyUsage(user.uid),
                        fetchDailyUsage(user.uid),
                    ]);
                } catch (error) {
                    console.error('Error fetching data:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                setLoading(false);
            }
        };

        fetchUserData();
    }, []);

    const fetchUserInfo = async (userId) => {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const userData = userDoc.data();
                setUserName(userData.name || 'User');
                setPicture(userData.profilePicture || 'https://via.placeholder.com/50');
            } else {
                console.error('User document does not exist');
            }
        } catch (error) {
            console.error('Error fetching user info:', error);
        }
    };

    const fetchEnrolledCourses = async (userId) => {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
                const enrolledCourseIds = userDoc.data().enrolledCourses || [];

                const coursesRef = collection(db, 'courses');
                const coursesSnapshot = await getDocs(coursesRef);
                const allCourses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                const enrolledCourses = allCourses.filter(course => enrolledCourseIds.includes(course.id));
                const notEnrolledCourses = allCourses.filter(course => !enrolledCourseIds.includes(course.id));

                setEnrolledCourses(enrolledCourses);
                setNotEnrolledCourses(notEnrolledCourses);
                await calculateCourseProgress(userId, enrolledCourses);
            } else {
                console.error('User document does not exist');
            }
        } catch (error) {
            console.error('Error fetching enrolled courses:', error);
        }
    };

    const fetchNotifications = async (userId) => {
        try {
            const notificationsRef = collection(db, 'users', userId, 'notifications');
            const notificationsSnapshot = await getDocs(notificationsRef);
            const notificationsList = notificationsSnapshot.docs.map(doc => doc.data());
            setNotifications(notificationsList);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    const fetchDailyUsage = async (userId) => {
        try {
            const logRef = collection(db, 'users', userId, 'dailyUsage');
            const logSnapshot = await getDocs(logRef);
            const usageData = logSnapshot.docs.map(doc => ({
                date: doc.id,
                hoursSpent: doc.data().hoursSpent
            }));
    
            const transformedData = usageData.reduce((acc, entry) => {
                const date = dayjs(entry.date).format('YYYY-MM-DD');
                acc[date] = entry.hoursSpent;
                return acc;
            }, {});
    
            setDailyUsageData(transformedData);
        } catch (error) {
            console.error('Error fetching daily usage:', error);
        }
    };
    

    const calculateCourseProgress = async (userId, courses) => {
        try {
            const userDocRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const completedLectures = userDoc.data().completedLectures || {};

                const progressPromises = courses.map(async (course) => {
                    const courseId = course.id;
                    const completedLecturesForCourse = completedLectures[courseId] || [];
                    const numVideos = Number(course.numVideos || 0);
                    const additionalLecturesCount = Array.isArray(course.additionalLectures) ? course.additionalLectures.length : 0;
                    const totalLecturesForCourse = numVideos + additionalLecturesCount;
                    
                    return {
                        courseId,
                        totalLectures: totalLecturesForCourse,
                        completedLecturesCount: completedLecturesForCourse.length
                    };
                });

                const progressResults = await Promise.all(progressPromises);
                setCourseProgress(progressResults.reduce((acc, { courseId, totalLectures, completedLecturesCount }) => {
                    acc[courseId] = { totalLectures, completedLecturesCount };
                    return acc;
                }, {}));
            } else {
                console.error('User not found');
            }
        } catch (error) {
            console.error('Error calculating course progress:', error);
        }
    };

    const handleLogout = async (userId) => {
        const loginTime = parseInt(localStorage.getItem('loginTime'), 10);
        if (!isNaN(loginTime)) {
            const logoutTime = Date.now();
            const hoursSpent = (logoutTime - loginTime) / (1000 * 60 * 60); // Convert milliseconds to hours
    
            try {
                const dateKey = dayjs().format('YYYY-MM-DD');
                const dailyUsageRef = doc(db, 'users', userId, 'dailyUsage', dateKey);
                const dailyUsageDoc = await getDoc(dailyUsageRef);
    
                if (dailyUsageDoc.exists()) {
                    const currentHours = dailyUsageDoc.data().hoursSpent || 0;
                    await setDoc(dailyUsageRef, { hoursSpent: currentHours + hoursSpent }, { merge: true });
                } else {
                    await setDoc(dailyUsageRef, { hoursSpent: hoursSpent });
                }
            } catch (error) {
                console.error('Error updating hoursSpent:', error);
            }
    
            localStorage.removeItem('loginTime');
        }
    };
    
    
    const handleClick = () => {
        navigate(`/user/all-courses`);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
            </div>
        );
    }

    // Prepare chart data
    const chartData = {
        labels: Object.keys(dailyUsageData),
        hours: Object.values(dailyUsageData)
    };

    return (
        <div className="flex min-h-screen bg-gradient-to-br from-gray-300 to-slate-300 overflow-y-auto">
            <div className="flex flex-col flex-1 p-6">
                <div className="bg-blue-500 text-white p-4 md:p-8 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center sm:overflow-hidden md:overflow-hidden">
                    <h1 className="text-xl md:text-2xl font-semibold flex mb-4 md:mb-0 sm:overflow-hidden md:overflow-hidden sm:whitespace-nowrap md:whitespace-nowrap">
                        <span className="animate-typewriter sm:truncate md:truncate">
                        Welcome to Hexaware AI Skill, {userName}!
                        </span>
                    </h1>
                    <UserAvatar name={userName} picture={picture} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-center">Courses Progress</h2>
                        <div className="space-y-4">
                            {enrolledCourses.map(course => {
                                const progress = courseProgress[course.id] || { totalLectures: 0, completedLecturesCount: 0 };
                                return (
                                    <div key={course.id} className="bg-gray-200 p-4 rounded-lg">
                                        <h3 className="text- font-medium">{course.name}</h3>
                                        <ProgressBar progress={progress.completedLecturesCount} total={progress.totalLectures} />
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-center">Brand New Courses Just for You</h2>
                        <ul className="flex flex-wrap gap-4 pb-3 justify-center">
                            {notEnrolledCourses.map(course => (
                                <li key={course.id} className="bg-slate-200 rounded-lg shadow-md p-3 flex flex-col items-center justify-center w-32 h-40">
                                    <img 
                                        className="w-20 h-20 rounded-lg mb-2 object-cover" 
                                        src={course.imageUrl} 
                                        alt={`${course.name} image`} 
                                    />
                                    <p className="text-gray-700 font-semibold text-center text-sm">{course.name}</p>
                                </li>
                            
                            ))}
                        </ul>
                        <div className="flex justify-center">
                            <button onClick={handleClick} className="bg-blue-600 rounded-lg p-2 text-white hover:bg-orange-500 transition-colors duration-500">
                                Enroll Now!
                            </button>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md text-center">
                        <h2 className="text-2xl font-semibold mb-4">Daily Usage</h2>
                        <Chart data={chartData} />
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-md">
                        <h2 className="text-2xl font-semibold mb-4 text-center">Did you forget something?</h2>
                        <Notification notifications={notifications} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
