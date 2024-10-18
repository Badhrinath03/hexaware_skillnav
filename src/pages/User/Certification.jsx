import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebaseConfig'; // Import Firestore
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { ClipLoader } from 'react-spinners';
import logoUrl from '../../images/4-bg.png'

const Certification = () => {
  const [completedCourses, setCompletedCourses] = useState([]);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCompletedCourses = async () => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (user) { 
      const userId = user.uid;
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserData(userData);
        const userCompletedCourses = userData.completedLectures || [];

        // Fetch all courses
        const coursesRef = collection(db, 'courses');
        const coursesSnapshot = await getDocs(coursesRef);
        const courses = coursesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter courses that the user has completed
        const completedCourses = courses.filter(course => {
          const completedLectureIndices = userCompletedCourses[course.id] || [];
          return completedLectureIndices.length >= (Number(course.numVideos) + Number(course.additionalLectures.length));
        });

        setCompletedCourses(completedCourses);
      }
    }
    setLoading(false);
  };

  const generatePDF = (course) => { //used chatgpt+jspdf documentations from npm to make this
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'pt',
      format: 'A4',
    });
  
    // Add background color
    doc.setFillColor(230, 245, 255); // Light blue background color
    doc.rect(0, 0, doc.internal.pageSize.getWidth(), doc.internal.pageSize.getHeight(), 'F');
  
    // Add double border
    doc.setLineWidth(4);
    doc.setDrawColor(0, 102, 204); // Dark blue color
    doc.rect(20, 20, doc.internal.pageSize.getWidth() - 40, doc.internal.pageSize.getHeight() - 40);
    doc.setLineWidth(1.5);
    doc.setDrawColor(255, 255, 255); // White color
    doc.rect(30, 30, doc.internal.pageSize.getWidth() - 60, doc.internal.pageSize.getHeight() - 60);
  
    // Add header
    doc.setFontSize(30);
    doc.setFont('helvetica', 'bold');
    doc.text('Certificate of Completion', doc.internal.pageSize.getWidth() / 2, 80, { align: 'center' });
  
    // Add logo
    if (logoUrl) {
      const logoWidth = 150; // Increased width
      const logoHeight = 150; // Increased height
      const logoX = doc.internal.pageSize.getWidth() - 20 - logoWidth; // 20 pt margin from the right edge
      const logoY = 30; // Margin from the top
      doc.addImage(logoUrl, 'PNG', logoX, logoY, logoWidth, logoHeight);
    }
  
    // Add recipient details
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text(`This is to certify that`, doc.internal.pageSize.getWidth() / 2, 160, { align: 'center' });
  
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text(`${userData.name}`, doc.internal.pageSize.getWidth() / 2, 200, { align: 'center' });
  
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text(`has successfully completed the course`, doc.internal.pageSize.getWidth() / 2, 240, { align: 'center' });
  
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(`${course.name}`, doc.internal.pageSize.getWidth() / 2, 280, { align: 'center' });
  
    doc.setFontSize(20);
    doc.setFont('helvetica', 'normal');
    doc.text(`on ${new Date().toLocaleDateString()}`, doc.internal.pageSize.getWidth() / 2, 320, { align: 'center' });
  
    // Add a paragraph acknowledging effort and hard work
    const message = `Through dedication, hard work, and consistent effort, ${userData.name} has successfully completed this course. We commend your perseverance and commitment to learning, which has led you to this significant achievement.`;
  
    doc.setFontSize(16);
    doc.text(message, doc.internal.pageSize.getWidth() / 2, 370, { align: 'center', maxWidth: 600 });
  
    // Add footer
    doc.setFontSize(14);
    doc.text('This certificate is issued by Hexaware AI Skill Team', doc.internal.pageSize.getWidth() / 2, 440, { align: 'center' });
  
    // Add stylish signature
    doc.setFontSize(18);
    doc.setFont('courier', 'italic'); // Using Courier Italic for a signature-like appearance
    doc.text(`Signed,`, doc.internal.pageSize.getWidth() - 150, doc.internal.pageSize.getHeight() - 60, { align: 'right' });
    doc.text(`Hexaware AI Skill Team`, doc.internal.pageSize.getWidth() - 150, doc.internal.pageSize.getHeight() - 40, { align: 'right' });
  
    // Save the document
    doc.save(`${course.name}_Certificate.pdf`);
  };
  
  

  useEffect(() => {
    fetchCompletedCourses();
  }, [completedCourses]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-4xl font-bold mb-4 text-center">Certificates of Completed Courses</h1>
      {completedCourses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedCourses.map((course, index) => (
            <div key={index} className="bg-slate-300 shadow-lg rounded-lg p-4 flex flex-col items-center transition-transform transform hover:scale-105 hover:shadow-lg justify-evenly">
              <img
                src={course.imageUrl}
                alt={course.name}
                className="w-full h-48 object-cover rounded-lg mb-4"
              />
              <h2 className="text-xl font-semibold mb-2 text-center">{course.name}</h2>
              <button
                onClick={() => generatePDF(course)}
                className="bg-blue-500 text-white p-2 rounded hover:bg-green-600 transition-colors duration-1000"
              >
                Download Certificate
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className='flex justify-center font-semibold'>No completed courses yet.</p>
      )}
    </div>
  );
};

export default Certification;
