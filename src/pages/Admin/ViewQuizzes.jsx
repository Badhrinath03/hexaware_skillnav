import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { ClipLoader } from 'react-spinners';

const ViewQuizzes = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [quiz, setQuiz] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      const courseCollection = collection(db, 'courses');
      const courseSnapshot = await getDocs(courseCollection);
      const courseList = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(courseList);
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!selectedCourseId) return;

      setLoading(true);
      try {
        const courseDoc = doc(db, 'courses', selectedCourseId);
        const courseSnapshot = await getDoc(courseDoc);

        if (courseSnapshot.exists()) {
          const courseData = courseSnapshot.data();
          setQuiz(courseData.quiz || []);
        } else {
          console.log('No such document!');
          setQuiz([]);
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setQuiz([]);
      }
      setLoading(false);
    };

    fetchQuiz();
  }, [selectedCourseId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-4xl text-center font-bold mb-6">View Quizzes</h1>

      <div className="mb-6">
        <label className="block text-lg font-medium mb-2">Select Course to View Quiz:</label>
        <select
          value={selectedCourseId}
          onChange={(e) => setSelectedCourseId(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="">Select a course</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>{course.name}</option>
          ))}
        </select>
      </div>

      {selectedCourseId && quiz.length === 0 && !loading && (
        <p className="text-red-500">No quiz added for this course.</p>
      )}

      {quiz.length > 0 && (
        <div className="space-y-6">
          {quiz.map((q, index) => (
            <div key={index} className="border border-gray-300 rounded-md p-4">
              <h2 className="text-lg font-semibold mb-2">{q.question}</h2>
              <ul className="list-disc pl-5">
                {q.options.map((opt, i) => (
                  <li
                    key={i}
                    className={`mb-2 ${opt === q.correctAnswer ? 'text-green-500' : ''}`}
                  >
                    {opt}
                    {opt === q.correctAnswer && (
                      <span className="text-green-500">(Correct)</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ViewQuizzes;
