import React, { useState, useEffect } from 'react';
import { db } from '../config/firebaseConfig';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { useParams } from 'react-router-dom';

const EnrolledCourseLectureCard = ({ lecture, lectureIndex, courseImage }) => {
  const { courseId } = useParams();
  const [isCompleted, setIsCompleted] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const auth = getAuth();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchCompletionStatus = async () => {
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        const userData = userDoc.data();
        
        if (userData?.completedLectures?.[courseId]?.includes(lectureIndex)) {
          setIsCompleted(true);
        }
      }
    };

    fetchCompletionStatus();
  }, [user, courseId, lectureIndex]);

  const handleCheckboxChange = async () => {
    if (!user) return;
  
    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);
  
    let completedLectures = {};
  
    if (userDoc.exists()) {
      const userData = userDoc.data();
      completedLectures = userData.completedLectures || {};
    }
  
    completedLectures[courseId] = completedLectures[courseId] || [];
  
    if (completedLectures[courseId].includes(lectureIndex)) {
      completedLectures[courseId] = completedLectures[courseId].filter(
        (id) => id !== lectureIndex
      );
      setIsCompleted(false);
    } else {
      completedLectures[courseId].push(lectureIndex);
      setIsCompleted(true);
    }
  
    if (completedLectures[courseId].length === 0) {
      delete completedLectures[courseId];
    }
  
    await updateDoc(userRef, { completedLectures });
  };

  const handleVideoClick = () => {
    setShowPopup(true);
  };

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <div className="bg-white shadow-lg rounded-lg overflow-hidden transition-transform transform hover:scale-105 hover:shadow-lg flex flex-col">
      <img
        src={courseImage || "https://via.placeholder.com/400x200"}
        alt="Course Image"
        className="w-full h-48 object-cover"
      />
      <div className="flex flex-col justify-between h-full p-4 bg-white rounded-lg shadow-md">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            {`Lecture ${lectureIndex}: ${lecture.videoName || "Lecture"}`}
          </h2>
        </div>
        <div className="mt-auto">
          {lecture.video && (
            <button 
              onClick={handleVideoClick}
              className="inline-block w-full text-center bg-blue-500 text-white font-medium py-2 px-4 rounded hover:bg-blue-600 transition-colors duration-300 mb-2"
            >
              View Video
            </button>
          )}
          {lecture.document && (
            <a 
              href={lecture.document} 
              className="inline-block w-full text-center bg-green-500 text-white font-medium py-2 px-4 rounded hover:bg-green-600 transition-colors duration-300" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              View Document
            </a>
          )}
          <div className="mt-2">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={isCompleted}
                onChange={handleCheckboxChange}
                className="form-checkbox h-5 w-5 text-blue-600"
              />
              <span className="ml-2 text-gray-700">Mark as Completed</span>
            </label>
          </div>
        </div>
      </div>

      {/* Fullscreen Video Popup */}
      {showPopup && (
  <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
    <button 
      onClick={handleClosePopup} 
      className="absolute top-4 right-4 text-white bg-gray-800 rounded-full p-2 hover:bg-gray-600 z-50"
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-8 w-8" 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
    <video 
      controls 
      className="w-full h-full object-cover"
      src={lecture.video}
    >
      Your browser does not support the video tag.
    </video>
  </div>
)}


    </div>
  );
};

export default EnrolledCourseLectureCard;
