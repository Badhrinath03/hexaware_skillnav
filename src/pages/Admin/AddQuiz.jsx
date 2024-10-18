import React, { useState, useEffect } from 'react';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useNavigate } from 'react-router-dom';

const AddQuiz = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOption, setCorrectOption] = useState('');
  const [questionType, setQuestionType] = useState('multiple-choice');
  const [timer, setTimer] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      const courseCollection = collection(db, 'courses');
      const courseSnapshot = await getDocs(courseCollection);
      const courseList = courseSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCourses(courseList);
    };

    fetchCourses();
  }, []);

  const handleAddQuestion = () => {
    if (!newQuestion || (questionType === 'multiple-choice' && (options.includes('') || !correctOption))) {
      alert('Please fill in all fields correctly.');
      return;
    }

    const question = {
      question: newQuestion,
      type: questionType,
      options: questionType === 'multiple-choice' ? options : [],
      correctAnswer: questionType === 'multiple-choice' ? correctOption : '',
    };

    setQuestions([...questions, question]);
    setNewQuestion('');
    setOptions(['', '', '', '']);
    setCorrectOption('');
  };

  const handleSaveQuiz = async () => {
    if (!selectedCourseId || questions.length === 0) {
      alert('Please select a course and add at least one question.');
      return;
    }

    try {
      const courseRef = doc(db, 'courses', selectedCourseId);

      await updateDoc(courseRef, {
        quiz: questions,
        timer: timer
      });

      alert('Quiz added successfully!');
      navigate('/admin'); // Redirect after successful save
    } catch (error) {
      console.error('Error saving quiz:', error);
      alert('Error saving quiz. Please try again.');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-4xl text-center font-bold mb-6">Add Quiz</h1>

      <div className="mb-6">
        <label className="block text-lg font-medium mb-2">Select Course:</label>
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

      <div className="mb-6">
        <label className="block text-lg font-medium mb-2">Quiz Timer (in minutes):</label>
        <input
          type="number"
          value={timer}
          onChange={(e) => setTimer(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Add Question</h2>
        <label className="block text-lg font-medium mb-2">Question Type:</label>
        <select
          value={questionType}
          onChange={(e) => setQuestionType(e.target.value)}
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="multiple-choice">Multiple Choice</option>
        </select>

        <input
          type="text"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Enter question"
          className="block w-full p-2 border border-gray-300 rounded-md shadow-sm mb-4 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        />

        {questionType === 'multiple-choice' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {options.map((option, index) => (
              <input
                key={index}
                type="text"
                value={option}
                onChange={(e) => {
                  const newOptions = [...options];
                  newOptions[index] = e.target.value;
                  setOptions(newOptions);
                }}
                placeholder={`Option ${index + 1}`}
                className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            ))}
          </div>
        )}

        {questionType === 'multiple-choice' && (
          <div className="mb-4">
            <label className="block text-lg font-medium mb-2">Correct Option:</label>
            <select
              value={correctOption}
              onChange={(e) => setCorrectOption(e.target.value)}
              className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="">Select correct option</option>
              {options.map((option, index) => (
                <option key={index} value={option}>Option {index + 1}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleAddQuestion}
          className="px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add Question
        </button>
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Questions</h2>
        <ul className="list-disc pl-5">
          {questions.map((q, index) => (
            <li key={index} className="mb-4">
              <strong>{q.question}</strong>
              {q.type === 'multiple-choice' && (
                <ul className="list-disc pl-5">
                  {q.options.map((opt, i) => (
                    <li key={i}>{opt} {opt === q.correctAnswer && <span className="text-green-500">(Correct)</span>}</li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleSaveQuiz}
        className="px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        Save Quiz
      </button>
    </div>
  );
};

export default AddQuiz;