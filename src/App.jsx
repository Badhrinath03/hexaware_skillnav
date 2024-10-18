import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import { Certification, AvailableCourses, EnrolledCourses, Notifications, ProfileManagement, Quiz, UserDashboard, EnrolledCoursePage, CandidateForm } from './pages/User/index';

import { AddCourse, AdminDashboard, DeleteCourse, EditCourse, AllCourses, CourseDetails, VideoUpload, AddQuiz, ViewQuizzes, AdminProfile } from './pages/Admin/index';

import Auth from './pages/Auth';
import NotFound from './pages/NotFound';

import {SideBar, MainWrapper} from './components/index';

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from './config/firebaseConfig';
import { doc, getDoc, onSnapshot, collection } from 'firebase/firestore';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ClipLoader } from 'react-spinners';

const App = () => {
    const [userRole, setUserRole] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loading, setLoading] = useState(true);

    const listenForNotifications = (uid) => {
        const notificationsRef = collection(db, 'users', uid, 'notifications');

        return onSnapshot(notificationsRef, (querySnapshot) => {
            const now = new Date();

            querySnapshot.forEach((notificationDoc) => {
                const notification = notificationDoc.data();
                const notificationDateTime = new Date(`${notification.date}T${notification.time}`);

                if (notificationDateTime <= now) {
                    toast(notification.text);
                }
            });
        });
    };

    useEffect(() => {
        const auth = getAuth();
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            try {
                if (user) {
                    const uid = user.uid;

                    // Fetch the user's role from Firestore
                    const userDoc = await getDoc(doc(db, 'users', uid));
                    if (userDoc.exists()) {
                        const role = userDoc.data().role;
                        setUserRole(role);
                        setIsAuthenticated(true);

                        // Start listening for notifications if the user has a 'user' role
                        if (role === 'user') {
                            const unsubscribeNotifications = listenForNotifications(uid);
                            // Clean up the listener on unmount
                            return () => unsubscribeNotifications();
                        }
                    } else {
                        console.log('No such document!');
                        setIsAuthenticated(false);
                        setUserRole(null);
                    }
                } else {
                    setIsAuthenticated(false);
                    setUserRole(null);
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
                setIsAuthenticated(false);
                setUserRole(null);
                setLoading(false);
            } finally {
                setLoading(false); 
            }
        });

        // make sure that we'r unmounting listener
        return () => unsubscribe();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
            </div>
        );
    }

    return (
        <Router>
            <div className="flex h-screen bg-gradient-to-br from-gray-300 to-slate-300">
                {isAuthenticated && userRole && <SideBar role={userRole} />}
                <MainWrapper>
                    {isAuthenticated && userRole === 'user' && <ToastContainer />}
                    <Routes>
                        <Route path="/" element={<Auth setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} />} />
                        {isAuthenticated && userRole === 'user' && (
                            <>
                                <Route path="/user" element={<UserDashboard />} />
                                <Route path="/user/all-courses" element={<AvailableCourses />} />
                                <Route path="/user/enrolled-courses" element={<EnrolledCourses />} />
                                <Route path="/user/enrolled-courses/:courseId" element={<EnrolledCoursePage />} />
                                <Route path="/user/certification" element={<Certification />} />
                                <Route path="/user/notification" element={<Notifications />} />
                                <Route path="/user/candidate-form" element={<CandidateForm />} />
                                <Route path="/user/profile-management" element={<ProfileManagement />} />
                                <Route path="/user/quiz" element={<Quiz />} />
                            </>
                        )}
                        {isAuthenticated && userRole === 'admin' && (
                            <>
                                <Route path="/admin" element={<AdminDashboard />} />
                                <Route path="/admin/all-courses" element={<AllCourses />} />
                                <Route path="/admin/add-course" element={<AddCourse />} />
                                <Route path="/admin/all-courses/:courseId" element={<CourseDetails />} />
                                <Route path="/admin/all-courses/:courseId/:courseName" element={<VideoUpload />} />
                                <Route path="/admin/all-courses/edit-course/:courseId" element={<EditCourse />} />
                                <Route path="/admin/all-courses/delete-course/:courseId" element={<DeleteCourse />} />
                                <Route path="/admin/add-quiz" element={<AddQuiz />} />
                                <Route path="/admin/view-quiz" element={<ViewQuizzes />} />
                                <Route path="/admin/profile-management" element={<AdminProfile />} />
                            </>
                        )}
                        {/* Not found page */}
                        <Route path="*" element={<NotFound />} />
                    </Routes>
                </MainWrapper>
            </div>
        </Router>
    );
};

export default App;
