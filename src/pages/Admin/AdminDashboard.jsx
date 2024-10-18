import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebaseConfig'; 
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {UserAvatar, UserGrowthChart, PopularCoursesChart} from '../../components/index'
import { ClipLoader } from 'react-spinners';

const AdminDashboard = () => {
  const [userName, setUserName] = useState('');
  const [picture, setPicture] = useState('');
  const [availableCourses, setAvailableCourses] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [topcourses, setTopCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    const fetchData = async () => {
      if (user) {
        try {
          // fetch all the data for all the grid boxes ... all that fetch occur here

          // Fetch user data
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          const userData = userDoc.data();
          setUserName(userData.name);
          setPicture(userData.profilePicture);

          // Fetch available courses
          const coursesCollectionRef = collection(db, 'courses');
          const coursesSnapshot = await getDocs(coursesCollectionRef);
          const courses = coursesSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          }));
          setAvailableCourses(courses);

          // Fetch and filter users
          const usersCollectionRef = collection(db, 'users');
          const usersSnapshot = await getDocs(usersCollectionRef);
          const users = await Promise.all(usersSnapshot.docs.map(async doc => {
            const userDoc = doc.data();
            if (userDoc.role === 'user') {
              return {
                id: doc.id,
                ...userDoc
              };
            }
            return null;
          }));

          const filteredUsers = users.filter(user => user !== null);
          setUsersList(filteredUsers);

          // Aggregate completion data (the course having most lectures completed = most popular course)
          const courseCompletionCounts = {};

          for (const user of filteredUsers) {
            const completedCourses = user.completedLectures || {};
            for (const [courseId, completedLectures] of Object.entries(completedCourses)) {
              if (!courseCompletionCounts[courseId]) {
                courseCompletionCounts[courseId] = 0;
              }
              courseCompletionCounts[courseId] += completedLectures.length;
            }
          }

          // Find top 3 courses
          const topCoursesIds = Object.keys(courseCompletionCounts)
            .sort((a, b) => courseCompletionCounts[b] - courseCompletionCounts[a])
            .slice(0, 3);

          const top3Courses = courses.filter(course => topCoursesIds.includes(course.id));

          // Update topcourses array
          const updatedTopCourses = top3Courses.map(course => ({
            name: course.name,
            completions: courseCompletionCounts[course.id] || 0,
          }));

          setTopCourses(updatedTopCourses);

        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setLoading(false);
        }
      } else {
        console.log("User not found!");
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-300 to-slate-300 overflow-y-scroll">
      <div className="flex flex-col flex-1 p-6">
        <div className="bg-blue-500 text-white p-4 md:p-8 rounded-lg mb-6 flex flex-col md:flex-row justify-between items-center sm:overflow-hidden md:overflow-hidden">
          <h1 className="text-xl md:text-2xl font-semibold flex mb-4 md:mb-0 sm:overflow-hidden md:overflow-hidden sm:whitespace-nowrap md:whitespace-nowrap">
            <span className="animate-typewriter sm:truncate md:truncate">
              Welcome to Hexaware AI Skill, {userName}!
            </span>
          </h1>
          <UserAvatar name={userName} picture={picture} />
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 mb-6">
          <div className="bg-white p-6 rounded-lg shadow-md text-center">
            <h2 className="text-2xl font-semibold mb-4">Users Growth</h2>
            <UserGrowthChart users={usersList} />
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center">Popular Courses</h2>
            <div className="relative h-80 flex text-center justify-center">
              <PopularCoursesChart courses={topcourses} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Section */}
          <div className="col-span-2 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4 text-center">Available Courses</h2>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {availableCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-gray-200 p-4 rounded-lg flex items-center"
                >
                  {course.imageUrl && (
                    <img
                      src={course.imageUrl}
                      alt={course.name}
                      className="w-16 h-16 rounded-lg object-cover mr-4"
                    />
                  )}
                  <h3 className="text-lg font-medium">{course.name}</h3>
                </div>
              ))}
            </div>
          </div>

          {/* Right Section */}
          <div className="col-span-1 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold mb-4 text-center">Registered Users</h2>
                <ul className="space-y-4 overflow-y-auto" style={{ maxHeight: '140px' }}>
                  {usersList.map(user => (
                    <li key={user.id} className="flex items-center">
                      {user.profilePicture && user.name && (
                        <img
                          src={user.profilePicture}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover mr-4"
                        />
                      )}
                      <div>
                        <p className="text-lg font-medium">{user.name}</p>
                      </div>
                    </li>
                  ))}
                </ul>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-center">Total Users</h2>
                <p className="text-3xl font-bold text-indigo-600 text-center">{usersList.length}</p>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4 text-center">Active Courses</h2>
                <p className="text-3xl font-bold text-indigo-600 text-center">{availableCourses.length}</p>
              </div>
            </div>
          </div>
        </div>

        
      </div>
    </div>
  );
};

export default AdminDashboard;
