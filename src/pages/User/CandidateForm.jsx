import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { db, storage } from '../../config/firebaseConfig'; // Adjust the import path as needed
import { doc, setDoc } from 'firebase/firestore';
import { uploadBytes, getDownloadURL } from 'firebase/storage';
import { ref } from 'firebase/storage';

const CandidateForm = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState({
    name: '',
    email: '',
    age: '',
    address: '',
    phone: '',
    education: '',
    specialization: '',
    degrees: '',
    certifications: '',
    internshipDetails: '',
    coursesCompleted: '',
    linkedInProfile: '',
    gitHubProfile: '',
    programmingLanguages: '',
    eCertificates: null,
    profilePicture: null,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCandidate((prevCandidate) => ({
      ...prevCandidate,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setCandidate((prevCandidate) => ({
      ...prevCandidate,
      [name]: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      console.error("User is not authenticated");
      return;
    }

    try {
      // Upload eCertificates to Firebase Storage and get URLs
      const eCertificateUploadPromises = Array.from(candidate.eCertificates).map(async (file) => {
        const fileRef = ref(storage, `eCertificates/${user.uid}/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      });

      const eCertificateURLs = await Promise.all(eCertificateUploadPromises);

      // Upload profile picture to Firebase Storage and get URL
      let profilePictureURL = '';
      if (candidate.profilePicture && candidate.profilePicture.length > 0) {
        const profilePictureFile = candidate.profilePicture[0];
        const profilePictureRef = ref(storage, `profilePictures/${user.uid}/${profilePictureFile.name}`);
        await uploadBytes(profilePictureRef, profilePictureFile);
        profilePictureURL = await getDownloadURL(profilePictureRef);
      }

      // Update candidate object with URLs
      const candidateData = {
        ...candidate,
        eCertificates: eCertificateURLs,
        profilePicture: profilePictureURL,
        isFormFilled: true
      };

      // Save candidate data to Firestore
      await setDoc(doc(db, 'users', user.uid), candidateData);
      alert('Form submitted successfully');

      // Navigate to dashboard
      navigate('/user');
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("Error submitting form: " + error.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white rounded shadow-md">
      <div className="mb-4">
        <label className="block text-gray-700">Name</label>
        <input
          type="text"
          name="name"
          value={candidate.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Email ID</label>
        <input
          type="email"
          name="email"
          value={candidate.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Age</label>
        <input
          type="number"
          name="age"
          value={candidate.age}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Address</label>
        <input
          type="text"
          name="address"
          value={candidate.address}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Phone Number</label>
        <input
          type="text"
          name="phone"
          value={candidate.phone}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Education</label>
        <input
          type="text"
          name="education"
          value={candidate.education}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Degree</label>
        <input
          type="text"
          name="degrees"
          value={candidate.degrees}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Specialization</label>
        <input
          type="text"
          name="specialization"
          value={candidate.specialization}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Certifications</label>
        <input
          type="text"
          name="certifications"
          value={candidate.certifications}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Internship Details</label>
        <input
          type="text"
          name="internshipDetails"
          value={candidate.internshipDetails}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Courses Completed</label>
        <input
          type="text"
          name="coursesCompleted"
          value={candidate.coursesCompleted}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">LinkedIn Profile Link</label>
        <input
          type="text"
          name="linkedInProfile"
          value={candidate.linkedInProfile}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">GitHub Profile Link</label>
        <input
          type="text"
          name="gitHubProfile"
          value={candidate.gitHubProfile}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Programming Languages Known</label>
        <input
          type="text"
          name="programmingLanguages"
          value={candidate.programmingLanguages}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Upload eCertificates</label>
        <input
          type="file"
          name="eCertificates"
          multiple
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <div className="mb-4">
        <label className="block text-gray-700">Upload Profile Picture</label>
        <input
          type="file"
          name="profilePicture"
          onChange={handleFileChange}
          className="w-full p-2 border rounded"
        />
      </div>
      <button type="submit" className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600">
        Submit
      </button>
    </form>
  );
};

export default CandidateForm;