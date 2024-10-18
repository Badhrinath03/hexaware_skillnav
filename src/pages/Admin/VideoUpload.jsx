import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { uploadBytes, getStorage, ref, getDownloadURL, getMetadata } from 'firebase/storage';
import { db } from '../../config/firebaseConfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import LectureCard from '../../components/LectureCard';
import { ClipLoader } from 'react-spinners';

const VideoUpload = () => {
  const { courseId, courseName } = useParams();
  const [numVideos, setNumVideos] = useState(0);
  const [additionalLectures, setAdditionalLectures] = useState([]);
  const [videoFiles, setVideoFiles] = useState([]);
  const [documentFiles, setDocumentFiles] = useState([]);
  const [videoArray, setVideoArray] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [uploadedVideoNames, setUploadedVideoNames] = useState([]);
  const [uploadedDocumentNames, setUploadedDocumentNames] = useState([]);
  const [isUploadComplete, setIsUploadComplete] = useState(false);
  const storage = getStorage();

  const fetchCourseData = async () => {
    setLoadingData(true);
    try {
      const courseDocRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseDocRef);
      if (courseDoc.exists()) {
        const courseData = courseDoc.data();
        const numVideos = parseInt(courseData.numVideos, 10) || 0;
        const existingAdditionalLectures = courseData.additionalLectures || [];
  
        setNumVideos(numVideos);
        setAdditionalLectures(existingAdditionalLectures);

        const totalLectures = [
          ...Array.from({ length: numVideos }, (_, index) => ({
            video: courseData.videoUrls?.[index],
            document: courseData.documentUrls?.[index],
          })),
          ...existingAdditionalLectures,
        ];
  
        setVideoArray(totalLectures);
  
        // Fetch video and document metadata for existing files
        const videoFiles = courseData.videoUrls
          ? await Promise.all(
              courseData.videoUrls.map(async (url) => {
                const metadata = await getMetadata(ref(storage, url));
                return { name: metadata.name, url };
              })
            )
          : [];
  
        const documentFiles = courseData.documentUrls
          ? await Promise.all(
              courseData.documentUrls.map(async (url) => {
                const metadata = await getMetadata(ref(storage, url));
                return { name: metadata.name, url };
              })
            )
          : [];
  
        // Fetch names from `additionalLectures`
        const additionalVideoNames = await Promise.all(
          existingAdditionalLectures.map(async (lecture) => {
            if (lecture.video) {
              const metadata = await getMetadata(ref(storage, lecture.video));
              return { name: metadata.name, url: lecture.video };
            }
            return null;
          })
        );
  
        const additionalDocumentNames = await Promise.all(
          existingAdditionalLectures.map(async (lecture) => {
            if (lecture.document) {
              const metadata = await getMetadata(ref(storage, lecture.document));
              return { name: metadata.name, url: lecture.document };
            }
            return null;
          })
        );
  
        setUploadedVideoNames([...videoFiles, ...additionalVideoNames.filter(Boolean)]);
        setUploadedDocumentNames([...documentFiles, ...additionalDocumentNames.filter(Boolean)]);
        setIsUploadComplete(videoFiles.length > 0 || documentFiles.length > 0);
      } else {
        console.log('No such document!');
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    setLoading(true); 
    fetchCourseData().finally(() => setLoading(false));
  }, [courseId]);

  const handleFileUpload = async (file, folder) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    const metadata = await getMetadata(storageRef);
    return { url, name: metadata.name };
  };

  const handleUpload = async () => {
    setLoading(true);
  
    try {
      const courseDocRef = doc(db, 'courses', courseId);
      const courseDoc = await getDoc(courseDocRef);
      const courseDocData = courseDoc.exists() ? courseDoc.data() : { videoUrls: [], documentUrls: [], additionalLectures: [] };
  
      const existingVideoUrls = Array.isArray(courseDocData.videoUrls) ? courseDocData.videoUrls : [];
      const existingDocumentUrls = Array.isArray(courseDocData.documentUrls) ? courseDocData.documentUrls : [];
  
      const videoResults = await Promise.all(
        videoFiles.map(file => handleFileUpload(file, 'videos'))
      );
      const documentResults = await Promise.all(
        documentFiles.map(file => handleFileUpload(file, 'documents'))
      );
  
      const videoUrls = videoResults.map(result => result.url);
      const documentUrls = documentResults.map(result => result.url);
  
      // Prepare the updated lectures with new URLs
      const newLectures = additionalLectures.map((lecture, index) => ({
        ...lecture,
        video: videoUrls[index] || lecture.video,
        document: documentUrls[index] || lecture.document,
      }));
  
      // Check if additionalLectures need to be updated in Firestore
      if (videoUrls.length || documentUrls.length) {
        await updateDoc(courseDocRef, {
          videoUrls: [...videoUrls, ...existingVideoUrls],
          documentUrls: [...documentUrls, ...existingDocumentUrls],
          additionalLectures: [...newLectures] // Update with new lectures
        });
  
        const updatedVideoNames = videoResults.map(result => ({ name: result.name, url: result.url }));
        const updatedDocumentNames = documentResults.map(result => ({ name: result.name, url: result.url }));
  
        setUploadedVideoNames(updatedVideoNames);
        setUploadedDocumentNames(updatedDocumentNames);
  
        // Ensure data is re-fetched and state is updated
        await fetchCourseData();
      } else {
        console.log('No new videos or documents uploaded.');
        alert('No new videos or documents uploaded.');
      }
    } catch (error) {
      console.error('Error uploading files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVideoChange = (index, file) => {
    const newVideoFiles = [...videoFiles];
    newVideoFiles[index] = file;
    setVideoFiles(newVideoFiles);
  };

  const handleDocumentChange = (index, file) => {
    const newDocumentFiles = [...documentFiles];
    newDocumentFiles[index] = file;
    setDocumentFiles(newDocumentFiles);
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-lg p-6">
        <h2 className="text-4xl font-extrabold mb-6 text-center text-indigo-600">
          {!isUploadComplete ? (`Upload Videos for ${courseName}`) : (`Videos Uploaded for ${courseName}`)}
        </h2>
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
          </div>
        ) : (
          <>
            {videoArray.length > 0 ? (
              videoArray.map((lecture, index) => (
                <LectureCard
                  key={index}
                  index={index}
                  loadingData={loadingData}
                  handleVideoChange={handleVideoChange}
                  handleDocumentChange={handleDocumentChange}
                  uploadedVideoName={uploadedVideoNames.find(video => video.url === lecture.video)?.name || `Lecture Video ${index + 1}`}
                  uploadedDocumentName={uploadedDocumentNames.find(doc => doc.url === lecture.document)?.name || `Lecture Document ${index + 1}`}
                  uploadedVideoUrl={lecture.video}
                  uploadedDocumentUrl={lecture.document}
                  isUploadComplete={isUploadComplete}
                />
              ))
            ) : (
              <p>No lectures to display.</p>
            )}
            {!isUploadComplete && videoArray.length > 0 && (
              <button onClick={handleUpload} className="bg-indigo-500 text-white py-3 px-6 rounded-lg hover:bg-indigo-600 transition duration-300">
                Upload All
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VideoUpload;
