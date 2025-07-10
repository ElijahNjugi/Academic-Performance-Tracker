// src/pages/StudentProfile.js
import React, { useEffect, useState } from 'react';
import '../styles/StudentDashboard.css';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function StudentProfile() {
  const navigate = useNavigate();
  const user_id = localStorage.getItem('user_id');
  const [studentInfo, setStudentInfo] = useState({});
  const [selectedSection, setSelectedSection] = useState('account');
  const [isEditing, setIsEditing] = useState(false);

  // 🔐 Password States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');

  useEffect(() => {
    axios.get(`http://localhost:5000/api/students/by-user/${user_id}`)
      .then(res => setStudentInfo(res.data))
      .catch(err => console.error(err));
  }, [user_id]);

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage('❌ New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMessage('❌ Password must be at least 6 characters');
      return;
    }

    try {
      const res = await axios.post('http://localhost:5000/api/students/change-password', {
        user_id,
        currentPassword,
        newPassword
      });

      if (res.data.success) {
        setPasswordMessage('✅ Password updated successfully');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPasswordMessage('❌ ' + res.data.message);
      }
    } catch (err) {
      console.error(err);
      setPasswordMessage('❌ Failed to change password');
    }
  };

  const renderSection = () => {
    switch (selectedSection) {
      case 'account':
        return (
          <div className="panel">
            <h3>🔐 Update Your Password</h3>
            <p>Password should be 8 characters and contain mix of letters, numbers and symbols</p>
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            /><br />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            /><br />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            /><br />
            <button onClick={handleChangePassword}>Update Password</button>
            {passwordMessage && <p className="message">{passwordMessage}</p>}
          </div>
        );
        case 'info':
  return (
    <div className="panel">
      <h3>📝 Personal Information</h3>
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="info-grid">
          <div>
            <label>Student No*</label>
            <input type="text" value={studentInfo.reg_no || ''} readOnly />
          </div>
          <div>
            <label>Full Name*</label>
            <input type="text" value={studentInfo.full_name || ''} readOnly />
          </div>
          <div>
            <label>Guardian Name</label>
            <input
              type="text"
              value={studentInfo.guardian_name || ''}
              disabled={!isEditing}
              onChange={(e) =>
                setStudentInfo({ ...studentInfo, guardian_name: e.target.value })
              }
            />
          </div>
          <div>
            <label>Mobile Phone</label>
            <input
              type="text"
              value={studentInfo.phone || ''}
              disabled={!isEditing}
              onChange={(e) =>
                setStudentInfo({ ...studentInfo, phone: e.target.value })
              }
            />
          </div>
          <div>
            <label>Guardian Contact</label>
            <input
              type="text"
              value={studentInfo.guardian_contact || ''}
              disabled={!isEditing}
              onChange={(e) =>
                setStudentInfo({ ...studentInfo, guardian_contact: e.target.value })
              }
            />
          </div>
          <div>
            <label>Department</label>
            <input
              type="text"
              value={studentInfo.department || ''}
              disabled={!isEditing}
              onChange={(e) =>
                setStudentInfo({ ...studentInfo, department: e.target.value })
              }
            />
          </div>
          <div>
            <label>Religion</label>
            <input
              type="text"
              value={studentInfo.religion || ''}
              disabled={!isEditing}
              onChange={(e) =>
                setStudentInfo({ ...studentInfo, religion: e.target.value })
              }
            />
          </div>
        </div>

        <div style={{ marginTop: '15px' }}>
          {!isEditing ? (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
            >
              Edit Info
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  await axios.put(`http://localhost:5000/api/students/update-profile/${user_id}`, {
                    phone: studentInfo.phone || '',
                    guardian_name: studentInfo.guardian_name || '',
                    guardian_contact: studentInfo.guardian_contact || '',
                    department: studentInfo.department || '',
                    religion: studentInfo.religion || ''
                  });
                  setIsEditing(false);
                  alert('✅ Info updated!');
                } catch (err) {
                  console.error(err);
                  alert('❌ Update failed');
                }
              }}
            >
              Save Changes
            </button>
          )}
        </div>
      </form>
    </div>
  );
      case 'fees':
        return (
          <div className="panel">
            <h3>💸 School Fees</h3>
            <p>Balance: <strong>KES 0.00</strong></p>
            <input type="file" accept="image/*" /><br />
            <button>Upload Proof</button><br />
            <button>Apply for Scholarship</button>
          </div>
        );
      case 'lostid':
        return (
          <div className="panel">
            <h3>🆔 Lost Student ID</h3>
            <p>Upload police abstract</p>
            <input type="file" accept="image/*" /><br />
            <p>Upload Receipt</p>
            <input type="file" accept="image/*" placeholder="Proof of Payment" /><br />
            <textarea placeholder="Reason for new ID"></textarea><br />
            <button>Submit Request</button>
          </div>
        );
      default:
        return <p>Select a section</p>;
    }
  };

  return (
    <div className="student-dashboard">
      <div className="top-bar">
        <button className="back-button" onClick={() => navigate('/student/dashboard')}>← Back</button>
        <h2>👤 Profile Page</h2>
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        {/* Left Sidebar */}
        <div style={{ width: '200px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <div className={`tile ${selectedSection === 'account' ? 'active' : ''}`} onClick={() => setSelectedSection('account')}>Account</div>
          <div className={`tile ${selectedSection === 'info' ? 'active' : ''}`} onClick={() => setSelectedSection('info')}>Personal Info</div>
          <div className={`tile ${selectedSection === 'fees' ? 'active' : ''}`} onClick={() => setSelectedSection('fees')}>School Fees</div>
          <div className={`tile ${selectedSection === 'lostid' ? 'active' : ''}`} onClick={() => setSelectedSection('lostid')}>Lost ID</div>
        </div>

        {/* Right Panel */}
        <div style={{ flex: 1 }}>
          {renderSection()}
        </div>
      </div>
    </div>
  );
}

export default StudentProfile;
