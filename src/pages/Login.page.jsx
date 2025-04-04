import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, InputGroup } from "react-bootstrap";
import { FaEnvelope, FaLock } from "react-icons/fa";

import NotificationToast from "../components/notificationToast.components";

const LoginForm = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const navigate = useNavigate();
  
  const [showToast, setShowToast] = useState(false);
  const toggleToast = () => setShowToast(!showToast);
  const [alert, setAlert] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // navigate("/chat.ai");
    // return;
    try {
      const res = await axios.post("https://powerbi-chatbot.onrender.com/login", {
        email: formData.email,
        password: formData.password,
      });
      const { access_token } = res.data;
      // Store token in localStorage
      localStorage.setItem("token", access_token);
      setAlert("Login Successful!");
      navigate("/chat.ai");
    } catch (err) {
      setAlert(err.response?.data?.detail || "Login failed");
    }
    toggleToast();
  };

  return (
    <Container className="auth-container">
      <NotificationToast
      show={showToast}
      onClose={() => setShowToast(false)}
      message={alert}
      />
      <Card className="auth-card">
        <Card.Body>
          <h2 className="text-center">Welcome Back</h2>
          <p className="text-center text-muted">Login to continue</p>
          <Form className="auth-form" onSubmit={handleSubmit}>
            <InputGroup className="mb-3">
              <InputGroup.Text><FaEnvelope /></InputGroup.Text>
              <Form.Control
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </InputGroup>

            <InputGroup className="mb-3">
              <InputGroup.Text><FaLock /></InputGroup.Text>
              <Form.Control
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </InputGroup>

            <Button variant="primary" type="submit" className="w-100">Login</Button>
          </Form>
          <div className="mt-3 auth-others">
            <p className="text-center">
              {" "}
              <span className="switch-link" onClick={() => navigate("/signup")}>
                Sign Up
              </span>
            </p>
            <p className="text-center">
              {" "}
            <span className="switch-link" onClick={() => navigate("/reset-password")}>
              Forgot Password
            </span>
           </p>
          </div>
          
        </Card.Body>
      </Card>
    </Container>
  );
};

export default LoginForm;
