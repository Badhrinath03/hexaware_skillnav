import React, { useState } from 'react';
import { db } from '../../config/firebaseConfig';
import { collection, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';
import { ClipLoader } from 'react-spinners';

const AddCourse = () => {
  const [courseName, setCourseName] = useState('');
  const [courseDescription, setCourseDescription] = useState('');
  const [courseCategory, setCourseCategory] = useState('');
  const [courseTags, setCourseTags] = useState('');
  const [courseImage, setCourseImage] = useState(null);
  const [numVideos, setNumVideos] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const storage = getStorage();

  const handleFileUpload = async (file, folder) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  };

  const handleAddCourse = async () => {
    if (!courseName || !courseDescription || !courseCategory || !courseTags || numVideos === '') {
      alert("Please fill out all the fields.");
      return;
    }
  
    setLoading(true);
    const courseId = `course_${Date.now()}`;
    const imageUrl = courseImage ? await handleFileUpload(courseImage, 'images') : '';
    const courseData = {
      name: courseName,
      description: courseDescription,
      category: courseCategory,
      tags: courseTags.split(',').map(tag => tag.trim()),
      imageUrl,
      numVideos: parseInt(numVideos, 10) // Ensure numVideos is stored as a number
    };
  
    try {
      await setDoc(doc(collection(db, 'courses'), courseId), courseData);
      console.log(`Course ${courseName} added successfully!`);
      navigate(`/admin/all-courses/${courseId}`);
    } catch (error) {
      console.error('Error adding course: ', error);
    } finally {
      setLoading(false);
    }
  };  

  return (
    <div className="max-w-md mx-auto p-4 m-10 bg-gradient-to-br from-indigo-400 to-indigo-300 shadow-md rounded-lg">
      <h2 className="text-4xl font-bold mb-4 text-center">Add New Course</h2>
      {loading ? (
        <div className="flex items-center justify-center min-h-screen">
          <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
        </div>
      ) : (
        <>
          <input
            type="text"
            placeholder="Course Name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <textarea
            placeholder="Course Description"
            value={courseDescription}
            onChange={(e) => setCourseDescription(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="text"
            placeholder="Course Category"
            value={courseCategory}
            onChange={(e) => setCourseCategory(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="text"
            placeholder="Course Tags (comma separated)"
            value={courseTags}
            onChange={(e) => setCourseTags(e.target.value)}
            className="w-full p-2 mb-4 border rounded"
          />
          <label className='w-full p-2 mb-4 font-semibold rounded' htmlFor="image">Course Cover Image</label>
          <input
            name='image'
            type="file"
            onChange={(e) => setCourseImage(e.target.files[0])}
            className="w-full p-2 mb-4 border rounded"
          />
          <input
            type="number"
            placeholder="Number of Videos"
            value={numVideos}
            onChange={(e) => {
              const value = e.target.value;
              if (value === '' || (Number.isInteger(+value) && +value >= 0)) {
                setNumVideos(value);
              }
            }}
            className="w-full p-2 mb-4 border rounded"
          />
          <button
            onClick={handleAddCourse}
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add Course
          </button>
        </>
      )}
    </div>
  );
};

export default AddCourse;
