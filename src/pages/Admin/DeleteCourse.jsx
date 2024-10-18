import React, { useState, useEffect } from 'react';
import { doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useParams, useNavigate } from 'react-router-dom';
import { getStorage, deleteObject, ref } from 'firebase/storage';
import { ClipLoader } from 'react-spinners';

const DeleteCourse = () => {
  const [showModal, setShowModal] = useState(false);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const { courseId } = useParams();
  const navigate = useNavigate();
  const storage = getStorage();
  const [showFullDescription, setShowFullDescription] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        setCourse(courseDoc.data());
      } else {
        console.error('No such course!');
      }
      setLoading(false);
    };

    fetchCourse();
  }, [courseId]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete the course image from storage first
      if (course.imageUrl) {
        const imageRef = ref(storage, course.imageUrl);
        await deleteObject(imageRef);
      }

      // Delete all associated videos from storage
      if (course.videoUrls && course.videoUrls.length > 0) {
        for (const videoUrl of course.videoUrls) {
          const videoRef = ref(storage, videoUrl);
          await deleteObject(videoRef);
        }
      }

      // Delete all associated documents from storage
      if (course.documentUrls && course.documentUrls.length > 0) {
        for (const docUrl of course.documentUrls) {
          const docRef = ref(storage, docUrl);
          await deleteObject(docRef);
        }
      }

      // Delete the course document from Firestore after storage files are deleted to avoid null issues you know
      await deleteDoc(doc(db, 'courses', courseId));

      setDeleting(false);
      alert('Course and associated files deleted successfully');
      setShowModal(false);
      navigate('/admin/all-courses');
    } catch (error) {
      console.error('Error deleting course: ', error);
      setDeleting(false);
      alert('Failed to delete course');
    }
  };

  if (loading || deleting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  const description = course.description || '';
  const isDescriptionLong = description.length > 100;

  return (
    <>
      <div className="max-w-4xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold text-gray-800 mb-2">{course.name}</h1>
            <p className="text-gray-600 mb-4">
              {showFullDescription ? description : `${description.slice(0, 100)}${isDescriptionLong ? '...' : ''}`}
              {isDescriptionLong && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="ml-2 text-indigo-500 hover:underline"
                >
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </button>
              )}
            </p>
            <div className="text-gray-700 mb-4">
              <strong>Category:</strong> {course.category}
            </div>
            <div className="flex flex-wrap gap-2 mb-4 text-gray-700 font-bold">Tags:
              {course.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-indigo-100 text-indigo-600 px-3 py-1 rounded-full text-sm font-semibold"
                >
                  {tag}
                </span>
              ))}
            </div>
            <div className="text-gray-700 mb-4">
              <strong>Number of Lectures:</strong> {Number(course.numVideos) + Number(course.additionalLectures?.length)}
            </div>
          </div>
          <img src={course.imageUrl} alt="Course Logo" className="w-48 h-48 object-cover rounded-lg shadow-md" />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="mt-6 bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition duration-300"
        >
          Delete Course
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4 text-gray-800">
              Are you sure you want to delete this course?
            </h2>
            <p className="text-gray-600 mb-6">
              This action cannot be undone and will permanently delete all associated files.
            </p>
            <div className="flex justify-between">
              <button
                onClick={handleDelete}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition duration-300"
              >
                Yes, Delete
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DeleteCourse;
