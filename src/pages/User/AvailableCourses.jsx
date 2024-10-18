import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebaseConfig'; 
import { collection, getDocs, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';
import { getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const AvailableCourses = () => {
  const [isTruncated, setIsTruncated] = useState(true);
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [userId, setUserId] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [enrollmentLoading, setEnrollmentLoading] = useState(false);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();

  const toggleTruncate = () => {
    setIsTruncated(!isTruncated);
  };

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
    const fetchCourses = async () => {
      try {
        const coursesCollection = collection(db, 'courses');
        const courseSnapshot = await getDocs(coursesCollection);
        const courseList = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(courseList);
        setFilteredCourses(courseList);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchEnrolledCourses = async () => {
      try {
        const userRef = doc(db, 'users', userId);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setEnrolledCourses(userData.enrolledCourses || []);
        }
      } catch (error) {
        console.error('Error fetching enrolled courses:', error);
      }
    };

    fetchEnrolledCourses();
  }, [userId]);

  const handleEnrollClick = (course) => {
    setSelectedCourse(course);
  };

  const confirmEnrollment = async () => {
    if (!userId) {
      console.error('User is not authenticated');
      return;
    }

    setEnrollmentLoading(true);

    try {
      const userRef = doc(db, 'users', userId);

      const userDoc = await getDoc(userRef);
      if (!userDoc.exists()) {
        await setDoc(userRef, {
          enrolledCourses: [selectedCourse.id],
        });
      } else {
        await updateDoc(userRef, {
          enrolledCourses: arrayUnion(selectedCourse.id),
        });
      }

      navigate('/user/enrolled-courses');
    } catch (error) {
      console.error('Error enrolling in course:', error);
    } finally {
      setEnrollmentLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = courses;

    if (filterBy && filterValue) {
      filtered = filtered.filter(course => {
        const fieldValue = course[filterBy]?.toString().toLowerCase() || '';
        return fieldValue.includes(filterValue.toLowerCase());
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filterBy, filterValue, searchTerm, courses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-300 to-slate-300 p-6">
      <h1 className="text-4xl text-center font-semibold text-gray-800 mb-6">All Courses</h1>

      <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-4">
          <label className="text-gray-700">Filter By:</label>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Filter</option>
            <option value="tags">By Tags</option>
            <option value="category">By Category</option>
          </select>
          {filterBy && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder={`Enter ${filterBy}`}
              className="p-2 border rounded"
            />
          )}
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses..."
            className="p-2 border rounded w-full md:w-64"
          />
        </div>
      </div>

      {filteredCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map(course => {
            const isEnrolled = enrolledCourses.includes(course.id);

            return (
              <div 
                key={course.id} 
                className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-lg flex flex-col justify-between"
              >
                <img
                  src={course.imageUrl || "https://via.placeholder.com/400x200"}
                  alt={course.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">{course.name}</h2>
                    <p className="text-gray-600 mt-2">
                      {truncateDescription(course.description, 100)}
                    </p>
                    {course.description.length > 100 && (
                      <button
                        onClick={toggleTruncate}
                        className="text-blue-500 hover:underline"
                      >
                        {isTruncated ? 'Read more' : 'Show less'}
                      </button>
                    )}
                  </div>
                  <div className="mt-4 flex justify-center">
                    {isEnrolled ? (
                      <button
                        className="inline-block text-center bg-gray-400 text-white font-medium py-2 px-4 rounded cursor-not-allowed"
                      >
                        Already Enrolled
                      </button>
                    ) : (
                      <button
                        onClick={() => handleEnrollClick(course)}
                        className="inline-block text-center bg-blue-500 text-white font-medium py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-300"
                      >
                        Enroll Now!
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-600">No courses available at the moment.</p>
      )}

      {selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <h2 className="text-xl font-semibold text-gray-800">Confirm Enrollment</h2>
            <p className="text-gray-600 mt-2">Are you sure you want to enroll in {selectedCourse.name}?</p>
            <div className="mt-4 flex justify-center gap-4">
              <button
                onClick={confirmEnrollment}
                className="bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 transition-colors duration-300"
                disabled={enrollmentLoading}
              >
                {enrollmentLoading ? <ClipLoader color="#ffffff" size={20} /> : 'Confirm'}
              </button>
              <button
                onClick={() => setSelectedCourse(null)}
                className="bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 transition-colors duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailableCourses;
