import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebaseConfig';
import { useParams, useNavigate } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ClipLoader } from 'react-spinners';

const EditCourse = () => {
  const [course, setCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    category: '',
    numVideos: 0,
    additionalLectures: [],
    imageUrl: '',
    videoUrls: [],
    documentUrls: []
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadedLectureNames, setUploadedLectureNames] = useState([]);
  const { courseId } = useParams();
  const navigate = useNavigate();
  const storage = getStorage();

  useEffect(() => {
    const fetchCourse = async () => {
      const courseDoc = await getDoc(doc(db, 'courses', courseId));
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        setCourse(courseData);
        setFormData((prevState) => ({
          ...prevState,
          ...courseData,
          tags: courseData.tags.join(', '),
          additionalLectures: courseData.additionalLectures || []
        }));
        setSelectedImage(courseData.imageUrl);
      } else {
        console.error('No such course!');
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleAdditionalLecturesChange = (e) => {
    const { value } = e.target;
    const lectureCount = Math.max(Number(value), 0);
    setFormData((prevData) => {
      const newLectures = [...prevData.additionalLectures];
      while (newLectures.length < lectureCount) {
        newLectures.push({ video: null, document: null });
      }
      while (newLectures.length > lectureCount) {
        newLectures.pop();
      }
      return { ...prevData, additionalLectures: newLectures };
    });
  };

  const handleLectureFileChange = (index, type, file) => {
    setFormData((prevData) => {
      const newLectures = [...prevData.additionalLectures];
      newLectures[index][type] = file;
      return { ...prevData, additionalLectures: newLectures };
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (name === 'imageUrl') {
      setSelectedImage(URL.createObjectURL(files[0]));
      setFormData((prevData) => ({
        ...prevData,
        [name]: files[0]
      }));
    }
  };

  const handleSubmit = async () => {
    setShowConfirmation(false);
    setLoading(true);
    try {
      const courseRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseRef);
  
      if (!courseDoc.exists()) {
        console.error('Course not found');
        return;
      }
  
      const courseData = courseDoc.data();
      let oldImageUrl = courseData.imageUrl;
      let imageUrl = formData.imageUrl;
  
      // Handle image upload
      if (formData.imageUrl instanceof File) {
        if (oldImageUrl) {
          const oldImageRef = ref(storage, oldImageUrl);
          await deleteObject(oldImageRef).catch(error => {
            console.error('Failed to delete old image: ', error);
          });
        }
  
        const imageRef = ref(storage, `images/${Date.now()}_${formData.imageUrl.name}`);
        await uploadBytes(imageRef, formData.imageUrl);
        imageUrl = await getDownloadURL(imageRef);
      } else {
        imageUrl = oldImageUrl;
      }

      const existingAdditionalLectures = courseData.additionalLectures || [];
  
      // Handle additional lecture uploads
      const lecturePromises = formData.additionalLectures.map(async (lecture, index) => {
        const updatedLecture = { video: null, document: null };
        const lectureNames = { video: '', document: '' };
  
        if (lecture.video instanceof File) {
          const videoRef = ref(storage, `videos/${Date.now()}_${lecture.video.name}`);
          await uploadBytes(videoRef, lecture.video);
          updatedLecture.video = await getDownloadURL(videoRef);
          lectureNames.video = lecture.video.name;
        }
  
        if (lecture.document instanceof File) {
          const documentRef = ref(storage, `documents/${Date.now()}_${lecture.document.name}`);
          await uploadBytes(documentRef, lecture.document);
          updatedLecture.document = await getDownloadURL(documentRef);
          lectureNames.document = lecture.document.name;
        }
  
        return { ...updatedLecture, names: lectureNames };
      });
  
      const uploadedLectures = await Promise.all(lecturePromises);
  
      // Combine existing and new lectures
      const combinedAdditionalLectures = [
        ...existingAdditionalLectures,
        ...uploadedLectures
      ];
  
      await updateDoc(courseRef, {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()),
        imageUrl, // Update Firestore with the new image URL
        additionalLectures: combinedAdditionalLectures // Update Firestore with the combined lectures
      });
  
      alert('Course updated successfully');
      navigate('/admin/all-courses');
    } catch (error) {
      console.error('Error updating course: ', error);
      alert('Failed to update course');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmUpdate = () => {
    setShowConfirmation(true);
  };

  const handleCancelUpdate = () => {
    setShowConfirmation(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-3xl font-bold mb-4 text-center">Edit Course</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleConfirmUpdate(); }}>
        {/* Form Fields for Course Details */}
        <div className="mb-4">
          <label className="block text-gray-700">Course Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Tags</label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Category</label>
          <input
            type="text"
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700">Add {formData.additionalLectures.length} more Lectures</label>
          <input
            type="number"
            value={formData.additionalLectures.length}
            onChange={handleAdditionalLecturesChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          <p className="text-gray-600 mt-1">Adjust the number of lectures you want to add.</p>
        </div>

        {formData.additionalLectures.map((lecture, index) => (
          <div key={index} className="mb-10 shadow-lg bg-slate-100 rounded-xl">
            <h3 className="block text-gray-700 font-bold text-2xl text-center">Lecture {index + 1}</h3>
            <div className="mb-2">
              <label className="block text-gray-700 font-bold pl-4">Upload Video</label>
              <input
                type="file"
                onChange={(e) => handleLectureFileChange(index, 'video', e.target.files[0])}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {uploadedLectureNames[index]?.video && (
                <p className="mt-1 text-gray-600">Video: {uploadedLectureNames[index].video}</p>
              )}
            </div>
            <div className="mb-2">
              <label className="block text-gray-700 font-bold pl-4">Upload Document</label>
              <input
                type="file"
                onChange={(e) => handleLectureFileChange(index, 'document', e.target.files[0])}
                className="w-full px-4 py-2 border rounded-lg"
              />
              {uploadedLectureNames[index]?.document && (
                <p className="mt-1 text-gray-600">Document: {uploadedLectureNames[index].document}</p>
              )}
            </div>
          </div>
        ))}

        <div className="mb-4">
          <label className="block text-gray-700">Course Image</label>
          <input
            type="file"
            name="imageUrl"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
          {selectedImage && (
            <div className="mt-4 flex justify-center">
              <img
                src={selectedImage}
                alt="Course"
                className="w-full max-w-[100%] h-auto object-contain rounded-lg"
              />
            </div>
          )}
        </div>
        <div className="flex justify-between">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300"
          >
            Update Course
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/all-courses')}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-300"
          >
            Cancel
          </button>
        </div>
      </form>

      {showConfirmation && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-bold mb-4">Confirm Update</h2>
            <p>Are you sure you want to update this course?</p>
            <div className="flex justify-end mt-4">
              <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700 transition duration-300 mr-2"
              >
                Yes
              </button>
              <button
                onClick={handleCancelUpdate}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700 transition duration-300"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditCourse;
