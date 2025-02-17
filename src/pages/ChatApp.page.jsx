
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Container, Form, Button, Card, Row, Col, Image } from "react-bootstrap";
import {
  FaPaperPlane,
  FaMoon,
  FaSun,
  FaRobot,
  FaCommentAlt,
  FaMicrophone,
  FaBars,
  FaEllipsisV,
} from "react-icons/fa";
import UserProfileModal from "../components/UserProfile.component";
import "../style/ChatApp.style.css";
import defualt_logo from '../assets/user.png';

// Web Speech API variables
let recognition = null;
if ("webkitSpeechRecognition" in window) {
  const SpeechRecognition = window.webkitSpeechRecognition;
  recognition = new SpeechRecognition();
  recognition.continuous = false; // Stop after one phrase
  recognition.interimResults = true; // Show partial transcripts
  recognition.lang = "en-US"; // Language
}

const ChatApp = () => {
  // State for chat sessions
  const [chatSessions, setChatSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState(null);
  const [newTitle, setNewTitle] = useState("");

  // State for messages & UI
  const [messages, setMessages] = useState([]);
  const [query, setQuery] = useState("");
  const [darkMode, setDarkMode] = useState(false);
  const [listening, setListening] = useState(false);

  // Refs
  const chatEndRef = useRef(null);
  const ws = useRef(null);
  
  const [showProfile, setShowProfile] = useState(false);
  const [userProfile, setUserProfile] = useState({
    avatar_url: "",
    theme: "light",
    language: "en",
    notifications: true,
  });

  const handleOpenProfile = () => {
    setShowProfile(true);
  };

  const handleCloseProfile = () => {
    setShowProfile(false);
  };

  const handleSaveProfile = () => {
    // Save logic, e.g., call backend
    console.log("Saving userProfile:", userProfile);
    // setShowProfile(false);
  };
// --------------------------------------------------------------------

  const API_URL = "https://powerbi-chatbot.onrender.com";

  const loadChatSessions = () => {
    const token = localStorage.getItem("token");
    // console.log(token);
    axios
      .get(API_URL+"/chat_sessions", {
        params: { token },
        withCredentials: true,
      })
      .then((res) => {
        setChatSessions(res.data);
      })
      .catch((err) => console.error(err));
  };

  // 2) Create New Chat Session
  const createSession = () => {
    const token = localStorage.getItem("token");
    console.log(token)
    if (!newTitle.trim() || !token) return;
    axios
      .post(
        API_URL+"/chat_sessions",
        { title: newTitle },
        {
          params: { token },
          withCredentials: true,
        }
      )
      .then((res) => {
        setChatSessions((prev) => [...prev, res.data]);
        setNewTitle("");
      })
      .catch((err) => console.error(err));
  };

  const openSocket = (sessionId) => {
    if (ws.current) {
      ws.current.onclose = () => {
        console.log("Old socket closed. Now opening new socket.");
        connectWebSocket(sessionId);
      };
      ws.current.close();
    } else {
      connectWebSocket(sessionId);
    }
  }

  // 3) Selecting a Chat Session
  const handleSelectSession = (sessionId) => {
    setSelectedSessionId(sessionId);
    loadMessages(sessionId);
    openSocket(sessionId);
  };

  // 4) Load Messages for a Session
  const loadMessages = (sessionId) => {
    const token = localStorage.getItem("token");
    console.log(token)
    axios
      .get(`${API_URL}/chat_sessions/${sessionId}/messages`, {
        params: { token },
        withCredentials: true,
      })
      .then((res) => {
        setMessages(
          res.data.map((m) => ({
            text: m.text,
            sender: m.sender,
            avatar:
              m.sender === "user"
                ? "https://i.pravatar.cc/50?img=1"
                : "/bot-avatar.png",
          }))
        );
      })
      .catch((err) => console.error(err));
  };

  let switchTimeout = null;
  // 5) Connect WebSocket to session
  const connectWebSocket = (sessionId) => {

      // Clear any pending switch
    if (switchTimeout) clearTimeout(switchTimeout);

    // Debounce: wait 300ms (or your chosen time)
    switchTimeout = setTimeout(() => {
      if (ws.current) ws.current.close();
      const token = localStorage.getItem("token");
      ws.current = new WebSocket(
        `wss://powerbi-chatbot.onrender.com/chat?token=${token}&session_id=${sessionId}`
      );

      ws.current.onopen = () => {
        console.log("WebSocket connected to session:", sessionId);
      };
  
      ws.current.onmessage = (event) => {
        // Each chunk is a single character from the bot
        const newChar = event.data;
        // console.log(event.data);
        // return;
        // handleSend(newChar);
        setMessages((prev) => {
          // If last message is from bot, append the char
          if (prev.length > 0 && prev[prev.length - 1].sender === "bot") {
            const updatedLast = {
              ...prev[prev.length - 1],
              text: prev[prev.length - 1].text + newChar,
            };
            return [...prev.slice(0, -1), updatedLast];
          } else {
            // Create a new bot message with the first char
            return [
              ...prev,
              { text: newChar, sender: "bot", avatar: "/bot-avatar.png" },
            ];
          }
        });
      };
  
      ws.current.onclose = () => {
        console.log("WebSocket disconnected, retrying in 2s...");
        setTimeout(() => connectWebSocket(sessionId), 2000);
      };
  
      ws.current.onerror = (err) => {
        console.error("WebSocket error:", err);
      };
    }, 500);
  };

  // 6) Send user message
  const sendQuery = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
      alert("WebSocket not connected. Please select a session or wait.");
      return;
    }

    // Add user message to UI
    const userMessage = {
      text: query,
      sender: "user",
      avatar: "https://i.pravatar.cc/50?img=1",
    };
    setMessages((prev) => [...prev, userMessage]);

    // Send to WebSocket
    ws.current.send(query);
    setQuery("");

    // Insert placeholder for bot's new message
    setMessages((prev) => [
      ...prev,
      { text: "", sender: "bot", avatar: "/bot-avatar.png" },
    ]);
  };

  // 7) Voice Input
  const startListening = () => {
    if (!recognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    setListening(true);
    recognition.start();

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setQuery(transcript);
    };

    recognition.onerror = (err) => {
      console.error("Speech recognition error:", err);
      setListening(false);
    };

    recognition.onend = () => {
      setListening(false);
      console.log("Speech recognition ended.");
    };
  };

  const stopListening = () => {
    if (recognition) {
      recognition.stop();
      setListening(false);
    }
  };

  const handleShowSideBar = () => {
    
  }

   // 1) Load Chat Sessions on Mount
  useEffect(() => {
    loadChatSessions();
    // loadProfile()
  }, []);

  // 8) Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Container fluid className={`chat-container ${darkMode ? "dark-mode" : ""}`}>
      <Row className={`chat-app ${darkMode ? "dark-mode" : ""}`}>
        <Row className={`top-bar ${darkMode ? "dark-mode" : ""} d-none d-md-flex flex-row`}>
        
        </Row>
        <Row className={`chat-box ${darkMode ? "dark-mode" : ""}`}>
          <Col md={4} className={`sidemenu d-none d-md-flex flex-column-reverse ${darkMode ? "dark-mode" : ""}`} >
          <div className="user" onClick={handleOpenProfile}>
                <Image
                  src={userProfile.avatar_url || defualt_logo}
                  roundedCircle
                  className="user-img"
                />
                {/* <div>
                  <span className="fw-bold">{userProfile.name || "John Doe"}</span>
                </div> */}
              </div>
          </Col>

          {/* Sidebar */}
          <Col md={4} className={`sidebar d-none d-md-flex flex-column ${darkMode ? "dark-mode" : ""}`}>
            <div className="sidebar-header">
              <h4 className="text-white">Chats</h4>
              <Button variant="outline-light" size="sm" onClick={() => setDarkMode(!darkMode)} className={`${darkMode ? "dark-mode" : ""}`}>
                {darkMode ? <FaSun /> : <FaMoon />}
              </Button>
            </div>
            <div className="sidebar-body">
              {/* List all chat sessions */}
               {chatSessions.map((session) => (
                 <div
                   key={session.id}
                   className="user"
                   onClick={() => handleSelectSession(session.id)}
                 >
                   <FaCommentAlt size={40} className="user-img" />
                   <div>
                     <span className="fw-bold">{session.title}</span>
                   </div>
                 </div>
               ))}

               {/* Create new chat session */}
               <div style={{ marginTop: "10px" }}>
                 <Form.Control
                   type="text"
                   placeholder="New chat title"
                   value={newTitle}
                   onChange={(e) => setNewTitle(e.target.value)}
                 />
                 <Button variant="success" className="mt-2" onClick={createSession}>
                   New Chat
                 </Button>
               </div>
             </div>
          </Col>

          {/* Main Chat Section */}
          <Col md={8} xs={12} className="chat-section">
            <div className={`chat-header ${darkMode ? "dark-mode" : ""}`}>
               {/* Button to toggle side nav on mobile */}
              <span className="bars" onClick={handleShowSideBar}>
                <FaBars size={20} className="me-2" />
              </span> 
              <span className="robot-status">
                <FaRobot size={30} className="me-2" />
                <small className="text-success">Online</small>
              </span>
              <span className="options">
                <FaEllipsisV size={20} className="me-2" />
              </span>
            </div>

            {/* Chat Messages */}
            <div className="chat-messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender === "user" ? "sent" : "received"}`}>
                  {msg.sender === "user" ? (
                    <Image src={msg.avatar} roundedCircle className="message-avatar" />
                  ) : (
                    <FaRobot size={40} className="me-2" />
                  )}
                  <Card className="p-2 message-bubble">{msg.text}</Card>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Field */}
            <Form onSubmit={sendQuery} className="chat-input">
              <Form.Control
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type a message..."
                className="rounded input"
              />
              <Button
                variant="secondary"
                type="button"
                className="rounded-circle mic-btn"
                onClick={listening ? stopListening : startListening}
              >
                {listening ? "🛑" : <FaMicrophone />}
              </Button>
              <Button variant="primary" type="submit" className="rounded-circle send-btn">
                <FaPaperPlane />
              </Button>
            </Form>
          </Col>
        </Row>
      </Row>

      {/* Include the user profile modal */}
      <UserProfileModal
        show={showProfile}
        handleClose={handleCloseProfile}
        handleSave={handleSaveProfile}
        userProfile={userProfile}
        setUserProfile={setUserProfile}
      />
    </Container>
  );
};

export default ChatApp;


// import { useState, useRef, useEffect } from "react";
// import axios from "axios";
// import { Container, Form, Button, Card, Row, Col, Image } from "react-bootstrap";
// import {
//   FaPaperPlane,
//   FaMoon,
//   FaSun,
//   FaRobot,
//   FaCommentAlt,
//   FaCog,
//   FaMicrophone,
// } from "react-icons/fa";
// import "../style/ChatApp.style.css";

// // Web Speech API variables
// let recognition = null;
// if ("webkitSpeechRecognition" in window) {
//   const SpeechRecognition = window.webkitSpeechRecognition;
//   recognition = new SpeechRecognition();
//   recognition.continuous = false; // Stop after one phrase
//   recognition.interimResults = true; // Show partial transcripts
//   recognition.lang = "en-US"; // Language
// }

// const ChatApp = () => {
//   // State for chat sessions
//   const [chatSessions, setChatSessions] = useState([]);
//   const [selectedSessionId, setSelectedSessionId] = useState(null);
//   const [newTitle, setNewTitle] = useState("");

//   // State for messages & UI
//   const [messages, setMessages] = useState([]);
//   const [query, setQuery] = useState("");
//   const [darkMode, setDarkMode] = useState(false);
//   const [listening, setListening] = useState(false);

//   // Refs
//   const chatEndRef = useRef(null);
//   const ws = useRef(null);


//   const handleSend = async (userInput) => {
   
//     const completeMessage = userInput;

//     // 3. Simulate typing
//     simulateTyping(completeMessage);
//   };

//   const simulateTyping = (text) => {
//     let i = 0;
//     const interval = setInterval(() => {
//       i++;
//       // reveal up to i characters
//       addmessage(text.slice(0, i));
//       if (i >= text.length) {
//         clearInterval(interval);
//       }
//     }, 50); // 50ms per character
//   };

//   function addmessage(newChar){
//     setMessages((prev) => {
//       // If last message is from bot, append the char
//       if (prev.length > 0 && prev[prev.length - 1].sender === "bot") {
//         const updatedLast = {
//           ...prev[prev.length - 1],
//           text: prev[prev.length - 1].text + newChar,
//         };
//         return [...prev.slice(0, -1), updatedLast];
//       } else {
//         // Create a new bot message with the first char
//         return [
//           ...prev,
//           { text: newChar, sender: "bot", avatar: "/bot-avatar.png" },
//         ];
//       }
//     });
//   }

//   // 1) Load Chat Sessions on Mount
//   useEffect(() => {
//     loadChatSessions();
//   }, []);

//   const loadChatSessions = () => {
//     const token = localStorage.getItem("token");
//     // console.log(token);
//     axios
//       .get("http://localhost:8000/chat_sessions", {
//         params: { token },
//         withCredentials: true,
//       })
//       .then((res) => {
//         setChatSessions(res.data);
//       })
//       .catch((err) => console.error(err));
//   };

//   // 2) Create New Chat Session
//   const createSession = () => {
//     const token = localStorage.getItem("token");
//     console.log(token)
//     if (!newTitle.trim() || !token) return;
//     axios
//       .post(
//         "http://localhost:8000/chat_sessions",
//         { title: newTitle },
//         {
//           params: { token },
//           withCredentials: true,
//         }
//       )
//       .then((res) => {
//         setChatSessions((prev) => [...prev, res.data]);
//         setNewTitle("");
//       })
//       .catch((err) => console.error(err));
//   };

//   const openSocket = (sessionId) => {
//     if (ws.current) {
//       ws.current.onclose = () => {
//         console.log("Old socket closed. Now opening new socket.");
//         connectWebSocket(sessionId);
//       };
//       ws.current.close();
//     } else {
//       connectWebSocket(sessionId);
//     }
//   }

//   // 3) Selecting a Chat Session
//   const handleSelectSession = (sessionId) => {
//     setSelectedSessionId(sessionId);
//     loadMessages(sessionId);
//     openSocket(sessionId);
//   };

//   // 4) Load Messages for a Session
//   const loadMessages = (sessionId) => {
//     const token = localStorage.getItem("token");
//     console.log(token)
//     axios
//       .get(`http://localhost:8000/chat_sessions/${sessionId}/messages`, {
//         params: { token },
//         withCredentials: true,
//       })
//       .then((res) => {
//         setMessages(
//           res.data.map((m) => ({
//             text: m.text,
//             sender: m.sender,
//             avatar:
//               m.sender === "user"
//                 ? "https://i.pravatar.cc/50?img=1"
//                 : "/bot-avatar.png",
//           }))
//         );
//       })
//       .catch((err) => console.error(err));
//   };

//   let switchTimeout = null;
//   // 5) Connect WebSocket to session
//   const connectWebSocket = (sessionId) => {

//       // Clear any pending switch
//     if (switchTimeout) clearTimeout(switchTimeout);

//     // Debounce: wait 300ms (or your chosen time)
//     switchTimeout = setTimeout(() => {
//       if (ws.current) ws.current.close();
//       const token = localStorage.getItem("token");
//       ws.current = new WebSocket(
//         `ws://localhost:8000/chat?token=${token}&session_id=${sessionId}`
//       );

//       ws.current.onopen = () => {
//         console.log("WebSocket connected to session:", sessionId);
//       };
  
//       ws.current.onmessage = (event) => {
//         // Each chunk is a single character from the bot
//         const newChar = event.data;
//         // console.log(event.data);
//         // return;
//         // handleSend(newChar);
//         setMessages((prev) => {
//           // If last message is from bot, append the char
//           if (prev.length > 0 && prev[prev.length - 1].sender === "bot") {
//             const updatedLast = {
//               ...prev[prev.length - 1],
//               text: prev[prev.length - 1].text + newChar,
//             };
//             return [...prev.slice(0, -1), updatedLast];
//           } else {
//             // Create a new bot message with the first char
//             return [
//               ...prev,
//               { text: newChar, sender: "bot", avatar: "/bot-avatar.png" },
//             ];
//           }
//         });
//       };
  
//       ws.current.onclose = () => {
//         console.log("WebSocket disconnected, retrying in 2s...");
//         setTimeout(() => connectWebSocket(sessionId), 2000);
//       };
  
//       ws.current.onerror = (err) => {
//         console.error("WebSocket error:", err);
//       };
//     }, 500);
//   };

//   // 6) Send user message
//   const sendQuery = (e) => {
//     e.preventDefault();
//     if (!query.trim()) return;
//     if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
//       alert("WebSocket not connected. Please select a session or wait.");
//       return;
//     }

//     // Add user message to UI
//     const userMessage = {
//       text: query,
//       sender: "user",
//       avatar: "https://i.pravatar.cc/50?img=1",
//     };
//     setMessages((prev) => [...prev, userMessage]);

//     // Send to WebSocket
//     ws.current.send(query);
//     setQuery("");

//     // Insert placeholder for bot's new message
//     setMessages((prev) => [
//       ...prev,
//       { text: "", sender: "bot", avatar: "/bot-avatar.png" },
//     ]);
//   };

//   // 7) Voice Input
//   const startListening = () => {
//     if (!recognition) {
//       alert("Speech Recognition not supported in this browser.");
//       return;
//     }
//     setListening(true);
//     recognition.start();

//     recognition.onresult = (event) => {
//       let transcript = "";
//       for (let i = 0; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       setQuery(transcript);
//     };

//     recognition.onerror = (err) => {
//       console.error("Speech recognition error:", err);
//       setListening(false);
//     };

//     recognition.onend = () => {
//       setListening(false);
//       console.log("Speech recognition ended.");
//     };
//   };

//   const stopListening = () => {
//     if (recognition) {
//       recognition.stop();
//       setListening(false);
//     }
//   };

//   // 8) Scroll to bottom on new messages
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   return (
//     <Container fluid className={`chat-container ${darkMode ? "dark-mode" : ""}`}>
//       <Row className={`chat-app ${darkMode ? "dark-mode" : ""}`}>
//         <Row className={`top-bar ${darkMode ? "dark-mode" : ""}`} />
//         <Row className={`chat-box ${darkMode ? "dark-mode" : ""}`}>
//           {/* SIDEBAR for sessions */}
//           <Col md={4} className={`sidebar d-none d-md-flex flex-column ${darkMode ? "dark-mode" : ""}`}>
//             <div className="sidebar-header">
//               <h4 className="text-white">Chats</h4>
//               <Button variant="outline-light" size="sm" onClick={() => setDarkMode(!darkMode)}>
//                 {darkMode ? <FaSun /> : <FaMoon />}
//               </Button>
//             </div>

//             <div className="sidebar-body">
//               {/* List all chat sessions */}
//               {chatSessions.map((session) => (
//                 <div
//                   key={session.id}
//                   className="user"
//                   onClick={() => handleSelectSession(session.id)}
//                 >
//                   <FaCommentAlt size={40} className="user-img" />
//                   <div>
//                     <span className="fw-bold">{session.title}</span>
//                   </div>
//                 </div>
//               ))}

//               {/* Create new chat session */}
//               <div style={{ marginTop: "10px" }}>
//                 <Form.Control
//                   type="text"
//                   placeholder="New chat title"
//                   value={newTitle}
//                   onChange={(e) => setNewTitle(e.target.value)}
//                 />
//                 <Button
//                   variant="success"
//                   className="mt-2"
//                   onClick={createSession}
//                 >
//                   New Chat
//                 </Button>
//               </div>
//             </div>
//           </Col>

//           {/* MAIN CHAT SECTION */}
//           <Col md={8} xs={12} className="chat-section">
//             {/* Header */}
//             <div className={`chat-header ${darkMode ? "dark-mode" : ""}`}>
//               <FaRobot size={40} className="me-2" />
//               <div>
//                 <small className="text-success">
//                   {selectedSessionId ? `Session #${selectedSessionId}` : "No session selected"}
//                 </small>
//               </div>
//               <div className="ms-auto me-2">
//                 <FaCog size={20} style={{ cursor: "pointer" }} />
//               </div>
//             </div>

//             {/* Chat Messages */}
//             <div className="chat-messages">
//               {messages.map((msg, index) => (
//                 <div
//                   key={index}
//                   className={`message ${msg.sender === "user" ? "sent" : "received"}`}
//                 >
//                   {msg.sender === "user" ? (
//                     <Image src={msg.avatar} roundedCircle className="message-avatar" />
//                   ) : (
//                     <FaRobot size={40} className="me-2" />
//                   )}
//                   <Card className="p-2 message-bubble">{msg.text}</Card>
//                 </div>
//               ))}
//               <div ref={chatEndRef} />
//             </div>

//             {/* Input Field */}
//             <Form onSubmit={sendQuery} className="chat-input">
//               <Button
//                 variant="secondary"
//                 type="button"
//                 className="rounded-circle me-2"
//                 onClick={listening ? stopListening : startListening}
//               >
//                 {listening ? "🛑" : <FaMicrophone />}
//               </Button>

//               <Form.Control
//                 type="text"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Type or speak a message..."
//                 className="rounded input"
//               />

//               <Button variant="primary" type="submit" className="rounded-circle send-btn">
//                 <FaPaperPlane />
//               </Button>
//             </Form>
//           </Col>
//         </Row>
//       </Row>
//     </Container>
//   );
// };

// export default ChatApp;


// import { useState, useRef, useEffect } from "react";
// import axios from "axios";
// import { Container, Form, Button, Card, Row, Col, Image } from "react-bootstrap";
// import {
//   FaPaperPlane,
//   FaMoon,
//   FaSun,
//   FaRobot,
//   FaCommentAlt,
//   FaCog,
//   FaMicrophone,
// } from "react-icons/fa";
// import "../style/ChatApp.style.css";

// // Web Speech API variables
// let recognition = null;
// if ("webkitSpeechRecognition" in window) {
//   const SpeechRecognition = window.webkitSpeechRecognition;
//   recognition = new SpeechRecognition();
//   recognition.continuous = false; // Stop after one phrase
//   recognition.interimResults = true; // Show partial transcripts
//   recognition.lang = "en-US"; // Language
// }

// const ChatApp = () => {
//   // State for chat sessions
//   const [chatSessions, setChatSessions] = useState([]);
//   const [selectedSessionId, setSelectedSessionId] = useState(null);
//   const [newTitle, setNewTitle] = useState("");

//   // State for messages & UI
//   const [messages, setMessages] = useState([]);
//   const [query, setQuery] = useState("");
//   const [darkMode, setDarkMode] = useState(false);
//   const [listening, setListening] = useState(false);

//   // Refs
//   const chatEndRef = useRef(null);
//   const ws = useRef(null);


//   const handleSend = async (userInput) => {
   
//     const completeMessage = userInput;

//     // 3. Simulate typing
//     simulateTyping(completeMessage);
//   };

//   const simulateTyping = (text) => {
//     let i = 0;
//     const interval = setInterval(() => {
//       i++;
//       // reveal up to i characters
//       addmessage(text.slice(0, i));
//       if (i >= text.length) {
//         clearInterval(interval);
//       }
//     }, 50); // 50ms per character
//   };

//   function addmessage(newChar){
//     setMessages((prev) => {
//       // If last message is from bot, append the char
//       if (prev.length > 0 && prev[prev.length - 1].sender === "bot") {
//         const updatedLast = {
//           ...prev[prev.length - 1],
//           text: prev[prev.length - 1].text + newChar,
//         };
//         return [...prev.slice(0, -1), updatedLast];
//       } else {
//         // Create a new bot message with the first char
//         return [
//           ...prev,
//           { text: newChar, sender: "bot", avatar: "/bot-avatar.png" },
//         ];
//       }
//     });
//   }

//   // 1) Load Chat Sessions on Mount
//   useEffect(() => {
//     loadChatSessions();
//   }, []);

//   const loadChatSessions = () => {
//     const token = localStorage.getItem("token");
//     // console.log(token);
//     axios
//       .get("http://localhost:8000/chat_sessions", {
//         params: { token },
//         withCredentials: true,
//       })
//       .then((res) => {
//         setChatSessions(res.data);
//       })
//       .catch((err) => console.error(err));
//   };

//   // 2) Create New Chat Session
//   const createSession = () => {
//     const token = localStorage.getItem("token");
//     console.log(token)
//     if (!newTitle.trim() || !token) return;
//     axios
//       .post(
//         "http://localhost:8000/chat_sessions",
//         { title: newTitle },
//         {
//           params: { token },
//           withCredentials: true,
//         }
//       )
//       .then((res) => {
//         setChatSessions((prev) => [...prev, res.data]);
//         setNewTitle("");
//       })
//       .catch((err) => console.error(err));
//   };

//   const openSocket = (sessionId) => {
//     if (ws.current) {
//       ws.current.onclose = () => {
//         console.log("Old socket closed. Now opening new socket.");
//         connectWebSocket(sessionId);
//       };
//       ws.current.close();
//     } else {
//       connectWebSocket(sessionId);
//     }
//   }

//   // 3) Selecting a Chat Session
//   const handleSelectSession = (sessionId) => {
//     setSelectedSessionId(sessionId);
//     loadMessages(sessionId);
//     openSocket(sessionId);
//   };

//   // 4) Load Messages for a Session
//   const loadMessages = (sessionId) => {
//     const token = localStorage.getItem("token");
//     console.log(token)
//     axios
//       .get(`http://localhost:8000/chat_sessions/${sessionId}/messages`, {
//         params: { token },
//         withCredentials: true,
//       })
//       .then((res) => {
//         setMessages(
//           res.data.map((m) => ({
//             text: m.text,
//             sender: m.sender,
//             avatar:
//               m.sender === "user"
//                 ? "https://i.pravatar.cc/50?img=1"
//                 : "/bot-avatar.png",
//           }))
//         );
//       })
//       .catch((err) => console.error(err));
//   };

//   let switchTimeout = null;
//   // 5) Connect WebSocket to session
//   const connectWebSocket = (sessionId) => {

//       // Clear any pending switch
//     if (switchTimeout) clearTimeout(switchTimeout);

//     // Debounce: wait 300ms (or your chosen time)
//     switchTimeout = setTimeout(() => {
//       if (ws.current) ws.current.close();
//       const token = localStorage.getItem("token");
//       ws.current = new WebSocket(
//         `ws://localhost:8000/chat?token=${token}&session_id=${sessionId}`
//       );

//       ws.current.onopen = () => {
//         console.log("WebSocket connected to session:", sessionId);
//       };
  
//       ws.current.onmessage = (event) => {
//         // Each chunk is a single character from the bot
//         const newChar = event.data;
//         // console.log(event.data);
//         // return;
//         // handleSend(newChar);
//         setMessages((prev) => {
//           // If last message is from bot, append the char
//           if (prev.length > 0 && prev[prev.length - 1].sender === "bot") {
//             const updatedLast = {
//               ...prev[prev.length - 1],
//               text: prev[prev.length - 1].text + newChar,
//             };
//             return [...prev.slice(0, -1), updatedLast];
//           } else {
//             // Create a new bot message with the first char
//             return [
//               ...prev,
//               { text: newChar, sender: "bot", avatar: "/bot-avatar.png" },
//             ];
//           }
//         });
//       };
  
//       ws.current.onclose = () => {
//         console.log("WebSocket disconnected, retrying in 2s...");
//         setTimeout(() => connectWebSocket(sessionId), 2000);
//       };
  
//       ws.current.onerror = (err) => {
//         console.error("WebSocket error:", err);
//       };
//     }, 500);
//   };

//   // 6) Send user message
//   const sendQuery = (e) => {
//     e.preventDefault();
//     if (!query.trim()) return;
//     if (!ws.current || ws.current.readyState !== WebSocket.OPEN) {
//       alert("WebSocket not connected. Please select a session or wait.");
//       return;
//     }

//     // Add user message to UI
//     const userMessage = {
//       text: query,
//       sender: "user",
//       avatar: "https://i.pravatar.cc/50?img=1",
//     };
//     setMessages((prev) => [...prev, userMessage]);

//     // Send to WebSocket
//     ws.current.send(query);
//     setQuery("");

//     // Insert placeholder for bot's new message
//     setMessages((prev) => [
//       ...prev,
//       { text: "", sender: "bot", avatar: "/bot-avatar.png" },
//     ]);
//   };

//   // 7) Voice Input
//   const startListening = () => {
//     if (!recognition) {
//       alert("Speech Recognition not supported in this browser.");
//       return;
//     }
//     setListening(true);
//     recognition.start();

//     recognition.onresult = (event) => {
//       let transcript = "";
//       for (let i = 0; i < event.results.length; i++) {
//         transcript += event.results[i][0].transcript;
//       }
//       setQuery(transcript);
//     };

//     recognition.onerror = (err) => {
//       console.error("Speech recognition error:", err);
//       setListening(false);
//     };

//     recognition.onend = () => {
//       setListening(false);
//       console.log("Speech recognition ended.");
//     };
//   };

//   const stopListening = () => {
//     if (recognition) {
//       recognition.stop();
//       setListening(false);
//     }
//   };

//   // 8) Scroll to bottom on new messages
//   useEffect(() => {
//     chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   }, [messages]);

//   return (
//     <Container fluid className={`chat-container ${darkMode ? "dark-mode" : ""}`}>
//       <Row className={`chat-app ${darkMode ? "dark-mode" : ""}`}>
//         <Row className={`top-bar ${darkMode ? "dark-mode" : ""}`} />
//         <Row className={`chat-box ${darkMode ? "dark-mode" : ""}`}>
//           {/* SIDEBAR for sessions */}
//           <Col
//             md={4}
//             className={`sidebar d-none d-md-flex flex-column ${
//               darkMode ? "dark-mode" : ""
//             }`}
//           >
//             <div className="sidebar-header">
//               <h4 className="text-white">Chats</h4>
//               <Button
//                 variant="outline-light"
//                 size="sm"
//                 onClick={() => setDarkMode(!darkMode)}
//               >
//                 {darkMode ? <FaSun /> : <FaMoon />}
//               </Button>
//             </div>

//             <div className="sidebar-body">
//               {/* List all chat sessions */}
//               {chatSessions.map((session) => (
//                 <div
//                   key={session.id}
//                   className="user"
//                   onClick={() => handleSelectSession(session.id)}
//                 >
//                   <FaCommentAlt size={40} className="user-img" />
//                   <div>
//                     <span className="fw-bold">{session.title}</span>
//                   </div>
//                 </div>
//               ))}

//               {/* Create new chat session */}
//               <div style={{ marginTop: "10px" }}>
//                 <Form.Control
//                   type="text"
//                   placeholder="New chat title"
//                   value={newTitle}
//                   onChange={(e) => setNewTitle(e.target.value)}
//                 />
//                 <Button variant="success" className="mt-2" onClick={createSession}>
//                   New Chat
//                 </Button>
//               </div>
//             </div>
//           </Col>

//           {/* MAIN CHAT SECTION */}
//           <Col md={8} xs={12} className="chat-section">
//             {/* Header */}
//             <div className={`chat-header ${darkMode ? "dark-mode" : ""}`}>
//               <FaRobot size={40} className="me-2" />
//               <div>
//                 <small className="text-success">
//                   {selectedSessionId
//                     ? `Session #${selectedSessionId}`
//                     : "No session selected"}
//                 </small>
//               </div>
//               <div className="ms-auto me-2">
//                 <FaCog size={20} style={{ cursor: "pointer" }} />
//               </div>
//             </div>

//             {/* Chat Messages */}
//             <div className="chat-messages">
//               {messages.map((msg, index) => (
//                 <div
//                   key={index}
//                   className={`message ${
//                     msg.sender === "user" ? "sent" : "received"
//                   }`}
//                 >
//                   {msg.sender === "user" ? (
//                     <Image
//                       src={msg.avatar}
//                       roundedCircle
//                       className="message-avatar"
//                     />
//                   ) : (
//                     <FaRobot size={40} className="me-2" />
//                   )}
//                   <Card className="p-2 message-bubble">{msg.text}</Card>
//                 </div>
//               ))}
//               <div ref={chatEndRef} />
//             </div>

//             {/* Input Field */}
//             <Form onSubmit={sendQuery} className="chat-input">
//               <Button
//                 variant="secondary"
//                 type="button"
//                 className="rounded-circle me-2"
//                 onClick={listening ? stopListening : startListening}
//               >
//                 {listening ? "🛑" : <FaMicrophone />}
//               </Button>

//               <Form.Control
//                 type="text"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Type or speak a message..."
//                 className="rounded input"
//               />

//               <Button variant="primary" type="submit" className="rounded-circle send-btn">
//                 <FaPaperPlane />
//               </Button>
//             </Form>
//           </Col>
//         </Row>
//       </Row>
//     </Container>
//   );
// };

// export default ChatApp;
