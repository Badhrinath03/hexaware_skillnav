import React, { useEffect, useState } from 'react';
import { ClipLoader } from 'react-spinners';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

const CourseDetails = () => {
  const { courseId } = useParams();
  const [courseData, setCourseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const courseDoc = await getDoc(doc(db, 'courses', courseId));
        if (courseDoc.exists()) {
          setCourseData(courseDoc.data());
        } else {
          console.log('No such document!');
        }
      } catch (error) {
        console.error('Error fetching course data: ', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  if (!courseData) {
    return (
      <p className="flex justify-center text-center mt-[40vh] text-5xl text-red-500">
        No course data found.<br />Please add course name and description!
      </p>
    );
  }

  const handleViewCourse = () => {
    navigate(`/admin/all-courses/${courseId}/${courseData.name}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        {courseData.imageUrl && (
          <div className="flex justify-center mb-6">
            <img
              src={courseData.imageUrl}
              alt={courseData.name}
              className="w-40 h-40 rounded-full border-4 border-gray-300 shadow-lg"
            />
          </div>
        )}
        <h2 className="text-4xl font-extrabold mb-6 text-center text-indigo-600">{courseData.name}</h2>
        <p className="mb-6 text-lg text-gray-700">{courseData.description}</p>
        <div className="flex justify-center">
          <button
            onClick={handleViewCourse}
            className="bg-indigo-500 text-white py-3 px-6 rounded-lg hover:bg-indigo-600 transition duration-300"
          >
            View/Upload Course Lectures
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
