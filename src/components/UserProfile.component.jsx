
import axios from "axios";
import "../style/UserProfile.style.css";
import { useState, useRef } from "react";
import defualt_logo from '../assets/user.png';

const UserProfileModal = ({
  show,
  handleClose,
  handleSave,
  userProfile = {},
  setUserProfile,
}) => {

     // For immediate preview if you want
  const [previewSrc, setPreviewSrc] = useState(userProfile.avatar_url || "");
  
   // We'll store a reference to the hidden file input
   const hiddenFileInput = useRef(null);

  // Called when the user picks a file
  const handleAvatarFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        //Update userProfile's avatar_url
        setUserProfile({ ...userProfile, avatar_url: event.target.result });
    };
    reader.readAsDataURL(file);

    try {
      // 1) Create FormData
      const formData = new FormData();
      formData.append("avatar", file);

      // 2) Upload to server
      const res = await axios.post("http://localhost:8000/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      print(res.success)


      // 3) For immediate preview
      setPreviewSrc(userProfile.avatar_url);
    } catch (err) {
      console.error("Error uploading file:", err);
      alert("Failed to upload avatar. Check console.");
    }
  };

   // Called when the user clicks the avatar
   const handleAvatarClick = () => {
     // Trigger a click on the hidden file input
     hiddenFileInput.current.click();
   };
 
  return (
    <div className={`user-profile-modal ${show ? "show" : ""}`}>
      <div className="profile-modal-content">
        <div className="profile-modal-header">
          <h5>User Profile</h5>
          <button className="close-btn" onClick={handleClose}>×</button>
        </div>

        <div className="profile-modal-body">
          {/* Example form fields */}
          <div className="form-group">
                {/* Preview the avatar */}
                <div className="avatar-preview">
                    <img
                        src={previewSrc || defualt_logo}
                        alt="Avatar"
                        style={{
                        width: "100px",
                        height: "100px",
                        borderRadius: "50%",
                        objectFit: "cover",
                        cursor: "pointer",
                        }}
                        onClick={handleAvatarClick}
                    />
                    {/* Hidden file input */}
                    <input
                        type="file"
                        accept="image/*"
                        ref={hiddenFileInput}
                        style={{ display: "none" }}
                        onChange={handleAvatarFileChange}
                    />
                </div>
          </div>

          <div className="form-group">
            <label>Theme</label>
            <select
              value={userProfile.theme || "light"}
              onChange={(e) => {
                setUserProfile({ ...userProfile, theme: e.target.value })
                handleSave();
              }}
            >
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </select>
          </div>

          <div className="form-group">
            <label>Language</label>
            <select
              value={userProfile.language || "en"}
              onChange={(e) => {
                setUserProfile({ ...userProfile, language: e.target.value })
                handleSave();
              }}
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
              {/* Add more as needed */}
            </select>
          </div>

          <div className="form-group">
            <div className="notify-setup">
              <label>Notifications</label>
              <input
                type="checkbox"
                checked={userProfile.notifications !== false}
                onChange={(e) => {
                  setUserProfile({
                    ...userProfile,
                    notifications: e.target.checked,
                  })
                  handleSave();
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
