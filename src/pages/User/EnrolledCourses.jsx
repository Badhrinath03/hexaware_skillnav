import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';
import { Link } from 'react-router-dom';
import { getAuth } from 'firebase/auth';

const EnrolledCourses = () => {
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const [isTruncated, setIsTruncated] = useState(true);

  const toggleTruncate = () => {
    setIsTruncated(!isTruncated);
  };

  // Read more, See less
  const truncateDescription = (text, maxLength) => {
    if (text.length > maxLength) {
      return isTruncated ? text.substring(0, maxLength) + '...' : text;
    }
    return text;
  };

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
    } else {
      console.error('No user is signed in');
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchEnrolledCourses = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const enrolledCourseIds = userData.enrolledCourses || [];

          const coursePromises = enrolledCourseIds.map(async (courseId) => {
            const courseRef = doc(db, 'courses', courseId);
            const courseDoc = await getDoc(courseRef);
            
            if (courseDoc.exists()) {
              return { id: courseDoc.id, ...courseDoc.data() };
            } else {
              return null; // Return null for deleted courses
            }
          });

          const enrolledCourseList = await Promise.all(coursePromises);

          // Filter out any null (deleted courses in past) values from the enrolled courses
          const validCourses = enrolledCourseList.filter(course => course !== null);
          
          setEnrolledCourses(validCourses);
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEnrolledCourses();
  }, [userId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-300 to-slate-300 p-6">
      <h1 className="text-4xl text-center font-semibold text-gray-800 mb-6">Enrolled Courses</h1>
      {enrolledCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrolledCourses.map(course => (
            <div 
              key={course.id} 
              className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-lg flex flex-col"
            >
              <img
                src={course.imageUrl || "https://via.placeholder.com/400x200"}
                alt={course.title}
                className="w-full h-48 object-cover"
              />
              <div className="p-4 flex flex-col flex-grow">
                <h2 className="text-xl font-semibold text-gray-800">{course.name}</h2>
                <p className="text-gray-600 mt-2 flex-grow">{truncateDescription(course.description, 100)}</p>
                {course.description.length > 100 && (
                  <button
                    onClick={toggleTruncate}
                    className="text-blue-500 hover:underline"
                  >
                    {isTruncated ? 'Read more' : 'Show less'}
                  </button>
                )}
                <div className="mt-4 flex justify-center">
                  <Link 
                    to={`/user/enrolled-courses/${course.id}`}
                    className="bg-blue-500 text-white font-medium py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-300 text-center"
                  >
                    View Course
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">You are not enrolled in any courses yet.</p>
      )}
    </div>
  );
};

export default EnrolledCourses;
