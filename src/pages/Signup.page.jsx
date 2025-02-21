import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Card, InputGroup } from "react-bootstrap";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa";

const SignupForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    try {
      await axios.post("https://powerbi-chatbot.onrender.com/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      },
      {
        withCredentials: true
      }
    );
      // alert("Signup Successful!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.detail || "Signup failed");
    }
  };

  return (
    <Container className="auth-container">
      <Card className="auth-card">
        <Card.Body>
          <h2 className="text-center">Create Account</h2>
          <p className="text-center text-muted">Join us today!</p>
          <Form className="auth-form" onSubmit={handleSubmit}>
            {/* Name */}
            <InputGroup className="mb-3">
              <InputGroup.Text><FaUser /></InputGroup.Text>
              <Form.Control
                type="text"
                name="name"
                placeholder="Full Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </InputGroup>
            {/* Email */}
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
            {/* Password */}
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
            {/* Confirm Password */}
            <InputGroup className="mb-3">
              <InputGroup.Text><FaLock /></InputGroup.Text>
              <Form.Control
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </InputGroup>
            <Button variant="primary" type="submit" className="w-100">Sign Up</Button>
          </Form>

          <p className="text-center mt-3">
            Already have an account?{" "}
            <span className="switch-link" onClick={() => navigate("/login")}>
              Login
            </span>
          </p>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SignupForm;
