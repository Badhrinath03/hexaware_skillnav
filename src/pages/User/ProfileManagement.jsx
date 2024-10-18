import React, { useState, useEffect } from 'react';
import { db } from '../../config/firebaseConfig'; 
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';
import { ClipLoader } from 'react-spinners';

const ProfileManagement = () => {
  const storage = getStorage();
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    phone: '',
    address: '',
    education: '',
    profilePicture: '',
    degree: '',
    specialization: '',
    certifications: '',
    internshipDetails: '',
    coursesCompleted: '',
    linkedInProfile: '',
    gitHubProfile: '',
    programmingLanguages: '',
  });
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);
      fetchProfileData(user.uid);
    } else {
      console.error('No user is signed in');
    }
  }, []);

  const fetchProfileData = async (userId) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        setProfile(userDoc.data());
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let profilePictureUrl = profile.profilePicture;

      if (imageFile) {
        const imageRef = ref(storage, `profilePictures/${userId}`);
        await uploadBytes(imageRef, imageFile);
        profilePictureUrl = await getDownloadURL(imageRef);
      }

      const userDocRef = doc(db, 'users', userId);
      await setDoc(userDocRef, {
        ...profile,
        profilePicture: profilePictureUrl,
      });

      setIsEditing(false); 
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (loading || isFetching) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ClipLoader color="#3498db" size={100} cssOverride={{ borderWidth: '5px' }} />
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-gray-300 to-slate-300">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-4xl font-bold">Profile Management</h1>
        {profile.profilePicture && (
          <img
            src={profile.profilePicture}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover"
          />
        )}
      </div>
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block mb-2">Name</label>
          <input
            type="text"
            name="name"
            value={profile.name}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Age</label>
          <input
            type="text"
            name="age"
            value={profile.age}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Phone Number</label>
          <input
            type="text"
            name="phone"
            value={profile.phone}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Address</label>
          <input
            type="text"
            name="address"
            value={profile.address}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Education</label>
          <input
            type="text"
            name="education"
            value={profile.education}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Degree</label>
          <input
            type="text"
            name="degree"
            value={profile.degree}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Specialization</label>
          <input
            type="text"
            name="specialization"
            value={profile.specialization}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Certifications</label>
          <input
            type="text"
            name="certifications"
            value={profile.certifications}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Internship Details</label>
          <input
            type="text"
            name="internshipDetails"
            value={profile.internshipDetails}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Courses Completed</label>
          <input
            type="text"
            name="coursesCompleted"
            value={profile.coursesCompleted}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">LinkedIn Profile</label>
          <input
            type="text"
            name="linkedInProfile"
            value={profile.linkedInProfile}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">GitHub Profile</label>
          <input
            type="text"
            name="gitHubProfile"
            value={profile.gitHubProfile}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block mb-2">Programming Languages</label>
          <input
            type="text"
            name="programmingLanguages"
            value={profile.programmingLanguages}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded"
            disabled={!isEditing}
            required
          />
        </div>
        {isEditing && (
          <div className="mb-4">
            <label className="block mb-2">Profile Picture</label>
            <input
              type="file"
              onChange={handleImageChange}
              className="w-full p-2 border border-gray-300 rounded"
            />
          </div>
        )}
        <div className="flex justify-end">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancel}
                className="bg-gray-500 text-white p-2 rounded mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white p-2 rounded"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleEdit}
              className="bg-blue-500 text-white p-2 rounded"
            >
              Edit
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ProfileManagement;