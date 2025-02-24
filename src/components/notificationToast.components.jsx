// src/components/NotificationToast.js
import { Toast } from "react-bootstrap";

function NotificationToast({ show, onClose, message, variant = "white" }) {
  return (
    <Toast
      show={show}
      onClose={onClose}
      delay={3000}
      autohide
      className={`position-fixed top-0 end-0 m-3 bg-${variant}`}
      style={{ zIndex: 1050 }}
    >
      <Toast.Header closeButton>
        <strong className="me-auto">Notification</strong>
        <small>Just now</small>
      </Toast.Header>
      <Toast.Body>{message}</Toast.Body>
    </Toast>
  );
}

export default NotificationToast;
