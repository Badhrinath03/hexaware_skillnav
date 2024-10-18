import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const CourseCard = ({ courseId, name, description, imageUrl }) => {
  const [isTruncated, setIsTruncated] = useState(true);
  const navigate = useNavigate();

  const toggleTruncate = () => {
    setIsTruncated(!isTruncated);
  };

  const truncateDescription = (text, maxLength) => {
    if (text.length > maxLength) {
      return isTruncated ? text.substring(0, maxLength) + '...' : text;
    }
    return text;
  };

  const handleViewCourse = () => {
    navigate(`/admin/all-courses/${courseId}`);
  };

  const handleEditCourse = () => {
    navigate(`/admin/all-courses/edit-course/${courseId}`)
  }

  const handleDeleteCourse = () => {
    navigate(`/admin/all-courses/delete-course/${courseId}`)
  }

  return (
    <div className="bg-gray-200 shadow-md rounded-lg overflow-hidden flex flex-col justify-between transition-transform transform hover:scale-105 hover:shadow-lg">
      <img draggable={false} className="w-full h-48 object-cover" src={imageUrl} alt={name} />
      <div className="p-4 flex-grow">
        <h2 className="text-xl font-semibold text-center">{name}</h2>
        <p className="text-gray-700">
          {truncateDescription(description, 100)}
        </p>
        {description.length > 100 && (
          <button
            onClick={toggleTruncate}
            className="text-blue-500 hover:underline"
          >
            {isTruncated ? 'Read more' : 'Show less'}
          </button>
        )}
      </div>
      <div className="p-4 flex justify-around">
        <button
          onClick={handleViewCourse}
          className="bg-blue-500 hover:bg-blue-700 text-white flex text-center justify-center items-center font-bold py-2 px-4 rounded w-[30%] duration-500"
        >
          View Course
        </button>
        <button onClick={handleEditCourse} className="bg-green-500 hover:bg-green-700 text-white flex text-center justify-center items-center font-bold py-2 px-4 rounded w-[30%] duration-500">
          Edit Course
        </button>
        <button onClick={handleDeleteCourse} className="bg-red-500 hover:bg-red-700 text-white flex text-center justify-center items-center font-bold py-2 px-4 rounded w-[30%] duration-500">
          Delete Course
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
