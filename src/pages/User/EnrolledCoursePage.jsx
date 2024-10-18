import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { ref, getMetadata, getStorage } from 'firebase/storage';
import EnrolledCourseLectureCard from '../../components/EnrolledCourseLectureCard';
import { ClipLoader } from 'react-spinners';
import { useParams } from 'react-router-dom';

const EnrolledCoursePage = () => {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);
  const storage = getStorage();

  useEffect(() => {
    const fetchCourseDetails = async () => {
      try {
        const courseRef = doc(db, 'courses', courseId);
        const courseDoc = await getDoc(courseRef);

        if (courseDoc.exists()) {
          const courseData = courseDoc.data();
          setCourse(courseData);

          // Function to clean up filenames for default types (we were storing files with date.now to make them unique in case if admin uploads same files, then firebase overwrites and makes 1)
          const cleanFilename = (filename) => {
            return filename.length > 14 ? filename.slice(14) : filename;
          };

          // Function to get metadata for video
          const getVideoMetadata = async (url) => {
            try {
              const videoRef = ref(storage, url);
              const metadata = await getMetadata(videoRef);
              const name = metadata.name;
              return courseData.videoUrls?.includes(url) ? cleanFilename(name) : name;
            } catch (error) {
              console.error('Error fetching video metadata:', error);
              return 'Unknown Video';
            }
          };

          // Function to get metadata for document
          const getDocumentMetadata = async (url) => {
            try {
              const documentRef = ref(storage, url);
              const metadata = await getMetadata(documentRef);
              const name = metadata.name;
              return courseData.documentUrls?.includes(url) ? cleanFilename(name) : name;
            } catch (error) {
              console.error('Error fetching document metadata:', error);
              return 'Unknown Document';
            }
          };

          // Gather video and document metadata
          const videoPromises = courseData.videoUrls?.map(async (url, index) => ({
            type: 'video',
            url,
            name: await getVideoMetadata(url) || `Video ${index + 1}`,
            document: courseData.documentUrls?.[index] || null,
            documentName: courseData.documentUrls?.[index] ? await getDocumentMetadata(courseData.documentUrls[index]) : `Document ${index + 1}`
          }));

          const documentPromises = courseData.documentUrls?.map(async (url, index) => ({
            type: 'document',
            url,
            name: await getDocumentMetadata(url) || `Document ${index + 1}`,
            video: courseData.videoUrls?.[index] || null,
            videoName: courseData.videoUrls?.[index] ? await getVideoMetadata(courseData.videoUrls[index]) : `Video ${index + 1}`
          }));

          const [videos, documents] = await Promise.all([Promise.all(videoPromises), Promise.all(documentPromises)]);

          // Map videos to documents
          const videoMap = new Map();
          videos.forEach((video) => {
            const doc = documents.find((d) => d.url === video.document);
            videoMap.set(video.url, {
              type: 'default',
              video: video.url,
              videoName: video.name,
              document: doc ? doc.url : null,
              documentName: doc ? doc.name : null
            });
          });

          // Combine all lectures
          const combinedLectures = [...videoMap.values()];

          // Combine additionalLectures
          const additionalLectures = courseData.additionalLectures || [];
          additionalLectures.forEach((lecture, index) => {
            combinedLectures.push({
              type: 'additional',
              video: lecture.video || null,
              document: lecture.document || null,
              videoName: lecture.names?.video || `Additional Video ${index + 1}`,
              documentName: lecture.names?.document || `Additional Document ${index + 1}`
            });
          });

          setLectures(combinedLectures);
        }
      } catch (error) {
        console.error('Error fetching course details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseDetails();
  }, [courseId, storage]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  if (!course) {
    return <p className="text-gray-600">Course not found.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-semibold text-gray-800 mb-6">{course.name}</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lectures.length > 0 ? (
          lectures.map((lecture, index) => (
            <EnrolledCourseLectureCard key={index} lectureIndex={index + 1} lecture={lecture} courseImage={course.imageUrl} />
          ))
        ) : (
          <p className="text-gray-600">No lectures available for this course.</p>
        )}
      </div>
    </div>
  );
};

export default EnrolledCoursePage;
