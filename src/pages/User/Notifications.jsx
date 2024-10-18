import React, { useState, useEffect, useRef } from 'react';
import { getAuth } from 'firebase/auth';
import { db } from '../../config/firebaseConfig'; 
import { collection, doc, addDoc, deleteDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import { FaTrash, FaEdit } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const Notifications = () => {
  const [notificationText, setNotificationText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [editId, setEditId] = useState(null);
  const auth = getAuth();
  const user = auth.currentUser;
  const timeouts = useRef([]);

  useEffect(() => {
    if (!user) {
      console.error('User is not authenticated');
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'users', user.uid, 'notifications'),
      (snapshot) => {
        const notificationsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notificationsData);
      },
      (error) => {
        console.error('Error fetching notifications:', error);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleAddNotification = async () => {
    if (notificationText && date && time) {
      const notification = {
        text: notificationText,
        date,
        time,
        timestamp: new Date(`${date}T${time}`).getTime(),
      };
      try {
        if (editId) {
          await updateDoc(doc(db, 'users', user.uid, 'notifications', editId), notification);
          setEditId(null);
        } else {
          await addDoc(collection(db, 'users', user.uid, 'notifications'), notification);
        }
        setNotificationText('');
        setDate('');
        setTime('');
      } catch (error) {
        console.error('Error adding notification:', error);
      }
    } else {
      console.warn('Notification text, date, or time is missing');
    }
  };

  const handleDeleteNotification = async (id) => {
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const handleEditNotification = (notification) => {
    setNotificationText(notification.text);
    setDate(notification.date);
    setTime(notification.time);
    setEditId(notification.id);
  };

  useEffect(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];

    const now = Date.now();

    notifications.forEach((notification) => {
      const delay = notification.timestamp - now;
      if (delay <= 0) {
        toast(notification.text, { toastId: notification.id });
        handleDeleteNotification(notification.id);
      } else {
        const timeoutId = setTimeout(async () => {
          toast(notification.text, { toastId: notification.id });
          try {
            await deleteDoc(doc(db, 'users', user.uid, 'notifications', notification.id));
          } catch (error) {
            console.error('Error deleting notification:', error);
          }
        }, delay);
        timeouts.current.push(timeoutId);
      }
    });
  }, [notifications]);

  return (
    <div className="p-6 max-w-lg mx-auto rounded-xl shadow-lg space-y-6 bg-gradient-to-br from-gray-300 to-slate-300">
      <h2 className="text-3xl font-bold text-center text-black">Schedule Reminders</h2>
      <textarea
        type="text"
        placeholder="Notification Text"
        value={notificationText}
        onChange={(e) => setNotificationText(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="date"
        value={date}
        onChange={(e) => setDate(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <input
        type="time"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      />
      <button
        onClick={handleAddNotification}
        className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-200"
      >
        {editId ? 'Update Notification' : 'Add Notification'}
      </button>

      <h2 className="text-xl font-bold text-blue-700">Upcoming Notifications</h2>
      <ul className="space-y-4">
        {notifications.map((notification) => (
          <li key={notification.id} className="p-3 bg-white border border-gray-300 rounded-lg shadow-md flex justify-between items-center">
            <span className="text-gray-800">{notification.text} - {new Date(notification.timestamp).toLocaleString()}</span>
            <div className="flex space-x-2">
              <button onClick={() => handleEditNotification(notification)} className="text-yellow-500 hover:text-yellow-600">
                <FaEdit />
              </button>
              <button onClick={() => handleDeleteNotification(notification.id)} className="text-red-500 hover:text-red-600">
                <FaTrash />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Notifications;
