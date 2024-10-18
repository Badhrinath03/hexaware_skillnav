import React from 'react';
import { ClipLoader } from 'react-spinners';

const LectureCard = ({
  index,
  loadingData,
  isUploadComplete,
  handleVideoChange,
  handleDocumentChange,
  uploadedVideoName,
  uploadedDocumentName,
  uploadedVideoUrl,
  uploadedDocumentUrl
}) => {
  // Debugging logs
  // console.log('loadingData:', loadingData);
  // console.log('isUploadComplete:', isUploadComplete);

  return (
    <div className="mb-6">
      <h3 className="text-2xl font-bold mb-2">Lecture {index + 1}</h3>

      {/* Conditional Rendering for Spinner or Content */}
      {isUploadComplete ? (
        loadingData ? (
          <div className="flex items-center justify-center min-h-screen">
            <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
          </div>
        ) : (
          <div className="p-4 border rounded-lg shadow-lg bg-white">
            <div className="flex flex-wrap justify-between items-center mb-2">
              <p className="text-lg flex-1 mr-2 break-words">Video: {uploadedVideoName}</p>
              <button
                onClick={() => window.open(uploadedVideoUrl, "_blank", "noopener,noreferrer")}
                className="bg-blue-500 text-white py-2 px-5 rounded-lg hover:bg-blue-600 transition duration-300 flex-shrink-0"
              >
                Go to video
              </button>
            </div>
            <div className="flex flex-wrap justify-between items-center">
              <p className="text-lg flex-1 mr-2 break-words">Document: {uploadedDocumentName}</p>
              <button
                onClick={() => window.open(uploadedDocumentUrl, "_blank", "noopener,noreferrer")}
                className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300 flex-shrink-0"
              >
                Go to document
              </button>
            </div>
          </div>
        )
      ) : (
        <div>
          <label className='w-full p-2 mb-4 rounded font-semibold' htmlFor="video">Lecture Video</label>
          <input
            type="file"
            name='video'
            accept="video/*"
            onChange={(e) => handleVideoChange(index, e.target.files[0])}
            className="w-full p-2 mb-4 border rounded"
          />
          <label className='w-full p-2 mb-4 rounded font-semibold' htmlFor="document">Lecture Document</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => handleDocumentChange(index, e.target.files[0])}
            className="w-full p-2 mb-4 border rounded"
          />
        </div>
      )}
    </div>
  );
};

export default LectureCard;
