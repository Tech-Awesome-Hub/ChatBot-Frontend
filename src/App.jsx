
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginForm from "./pages/Login.page";
import SignupForm from "./pages/Signup.page";
import ChatApp from "./pages/ChatApp.page";
import "./style/Auth.style.css";

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Navigate replace to="/chat.ai" />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignupForm />} />
          <Route path="/chat.ai" element={<ChatApp />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
