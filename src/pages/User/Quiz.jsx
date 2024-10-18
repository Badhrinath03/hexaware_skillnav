import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc, getDocs, updateDoc, addDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { ClipLoader } from 'react-spinners';
import { useNavigate } from 'react-router-dom';

const Quiz = () => {
    const [enrolledCourses, setEnrolledCourses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [quiz, setQuiz] = useState([]);
    const [userAnswers, setUserAnswers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(null);
    const [timer, setTimer] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchEnrolledCourses = async () => {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                console.log('User not logged in');
                return;
            }

            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const enrolledCourseIds = userDoc.data().enrolledCourses || [];

                const courseCollectionRef = collection(db, 'courses');
                const courseSnapshot = await getDocs(courseCollectionRef);

                const validCourses = courseSnapshot.docs
                    .filter(courseDoc => enrolledCourseIds.includes(courseDoc.id))
                    .map(courseDoc => ({
                        id: courseDoc.id,
                        ...courseDoc.data()
                    }));

                setEnrolledCourses(validCourses);
            }
        };

        fetchEnrolledCourses();
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
                    setUserAnswers(new Array(courseData.quiz?.length).fill(null));
                    setTimer(courseData.timer || 0);
                    setTimeLeft(courseData.timer * 60); // Convert minutes to seconds
                } else {
                    console.log('No such document!');
                    setQuiz([]);
                    setUserAnswers([]);
                }
            } catch (error) {
                console.error('Error fetching quiz:', error);
                setQuiz([]);
                setUserAnswers([]);
            }
            setLoading(false);
        };

        fetchQuiz();
    }, [selectedCourseId]);

    useEffect(() => {
        if (timeLeft === null || timeLeft <= 0) return;

        const timerId = setInterval(() => {
            setTimeLeft(prevTime => {
                if (prevTime <= 1) {
                    clearInterval(timerId);
                    handleSubmit();
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(timerId);
    }, [timeLeft]);

    const handleAnswerSelect = (questionIndex, selectedOption) => {
        const updatedAnswers = [...userAnswers];
        updatedAnswers[questionIndex] = selectedOption;
        setUserAnswers(updatedAnswers);
    };

    const handleSubmit = async () => {
        setSubmitted(true);
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
            console.log('User not logged in');
            return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            const quizzes = userDoc.data().quizzes || [];
            const courseIndex = quizzes.findIndex(quiz => quiz.courseId === selectedCourseId);

            if (courseIndex >= 0) {
                quizzes[courseIndex].userAnswered = userAnswers;
            } else {
                quizzes.push({
                    courseId: selectedCourseId,
                    userAnswered: userAnswers
                });
            }

            await updateDoc(userDocRef, { quizzes });

            calculateScore();

            // Store results in a separate Firestore collection
            await addDoc(collection(db, 'quizResults'), {
                userId: user.uid,
                courseId: selectedCourseId,
                userAnswers: userAnswers,
                score: calculateScore(),
                timestamp: new Date()
            });
        }
    };

    const calculateScore = () => {
        let correctAnswers = 0;
        quiz.forEach((q, index) => {
            if (q.correctAnswer === userAnswers[index]) {
                correctAnswers++;
            }
        });

        setScore(correctAnswers);
        return correctAnswers;
    };

    const goDashboard = () => {
        navigate(`/user`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
            </div>
        );
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-4xl text-center font-bold mb-6">Take a Quiz</h1>

            {loading ? (
                <div className="flex items-center justify-center min-h-screen">
                    <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
                </div>
            ) : (
                <>
                    <div className="mb-6">
                        <label className="block text-lg font-medium mb-2">Select Course:</label>
                        <select
                            value={selectedCourseId}
                            onChange={(e) => {
                                setSelectedCourseId(e.target.value);
                                setSubmitted(false);
                                setScore(null);
                            }}
                            className="block w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                            <option value="">Select a course</option>
                            {enrolledCourses.map(course => (
                                <option key={course.id} value={course.id}>{course.name}</option>
                            ))}
                        </select>
                    </div>

                    {selectedCourseId && quiz.length === 0 && !loading && (
                        <p className="text-red-500">No quiz available for this course.</p>
                    )}

                    {timeLeft !== null && (
                        <div className="mt-6 text-center">
                            <h2 className="text-xl font-semibold">Time Left: {Math.floor(timeLeft / 60)}:{timeLeft % 60}</h2>
                        </div>
                    )}

                    {quiz.length > 0 && !submitted && (
                        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                            <div className="space-y-6">
                                {quiz.map((q, index) => (
                                    <div key={index} className="border border-gray-300 rounded-md p-4">
                                        <h2 className="text-lg font-semibold mb-2">{q.question}</h2>
                                        <ul className="list-none space-y-2">
                                            {q.options.map((opt, i) => (
                                                <li key={i}>
                                                    <label className="inline-flex items-center">
                                                        <input
                                                            type="radio"
                                                            name={`question-${index}`}
                                                            value={opt}
                                                            checked={userAnswers[index] === opt}
                                                            onChange={() => handleAnswerSelect(index, opt)}
                                                            className="form-radio text-indigo-600"
                                                        />
                                                        <span className="ml-2">{opt}</span>
                                                    </label>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="submit"
                                className="mt-6 w-full bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Submit
                            </button>
                        </form>
                    )}

                    {submitted && score !== null && (
                        <div className="mt-6 text-center">
                            <h2 className="text-xl font-semibold">Your Score: {score} / {quiz.length}</h2>
                            <button
                                onClick={goDashboard}
                                className="mt-6 bg-indigo-600 text-white py-2 px-4 rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                                Dashboard
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default Quiz;