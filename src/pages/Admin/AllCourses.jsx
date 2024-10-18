import React, { useEffect, useState } from 'react';
import { db } from '../../config/firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import { ClipLoader } from 'react-spinners';
import CourseCard from '../../components/CourseCard';

const AllCourses = () => {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState('');
  const [filterValue, setFilterValue] = useState(''); 
  const [searchTerm, setSearchTerm] = useState(''); 
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const coursesCollection = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesCollection);
        const coursesList = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCourses(coursesList);
        setFilteredCourses(coursesList);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Apply filtering and searching
  const applyFilters = () => {
    let filtered = courses;

    if (filterBy && filterValue) {
      filtered = filtered.filter(course => {
        const fieldValue = course[filterBy]?.toString().toLowerCase() || '';
        return fieldValue.includes(filterValue.toLowerCase());
      });
    }

    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  };

  useEffect(() => {
    applyFilters();
  }, [filterBy, filterValue, searchTerm, courses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 bg-gradient-to-br from-gray-300 to-slate-300">
      <h1 className="text-4xl font-bold mb-4 text-center">All Courses</h1>
      <div className="mb-4 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-4">
          <label className="text-gray-700">Filter By:</label>
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">Select Filter</option>
            <option value="tags">By Tags</option>
            <option value="category">By Category</option>
          </select>
          {filterBy && (
            <input
              type="text"
              value={filterValue}
              onChange={(e) => setFilterValue(e.target.value)}
              placeholder={`Enter ${filterBy}`}
              className="p-2 border rounded"
            />
          )}
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses..."
            className="p-2 border rounded w-full md:w-64"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.length > 0 ? (
          filteredCourses.map(course => (
            <CourseCard
              key={course.id}
              courseId={course.id}
              name={course.name}
              description={course.description}
              imageUrl={course.imageUrl}
            />
          ))
        ) : (
          <p className="text-gray-600 text-center">No courses available with the selected filters.</p>
        )}
      </div>
    </div>
  );
};

export default AllCourses;
