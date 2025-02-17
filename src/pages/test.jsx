import { useState } from "react";
import axios from "axios";

const ChatApp = () => {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);

  const sendQuery = async () => {
    if (!query.trim()) return;

    // Add user message to chat
    setMessages([...messages, { text: query, sender: "user" }]);

    try {
      const response = await axios.post("http://localhost:8000/query/", { query });
      const answer = response.data.results?.[0]?.tables?.[0]?.rows?.[0]?.join(" ") || "No data found";

      // Add Power BI response to chat
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: query, sender: "user" },
        { text: answer, sender: "bot" },
      ]);
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: query, sender: "user" },
        { text: "Error fetching data", sender: "bot" },
      ]);
    }

    setQuery(""); // Clear input field
  };

  return (
    <div style={styles.chatContainer}>
      <div style={styles.chatBox}>
        {messages.map((msg, index) => (
          <div key={index} style={msg.sender === "user" ? styles.userMessage : styles.botMessage}>
            {msg.text}
          </div>
        ))}
      </div>
      <div style={styles.inputContainer}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask a question..."
          style={styles.input}
        />
        <button onClick={sendQuery} style={styles.button}>Send</button>
      </div>
    </div>
  );
};

// Inline styles
const styles = {
  chatContainer: { width: "400px", margin: "50px auto", border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden" },
  chatBox: { height: "300px", overflowY: "auto", padding: "10px", backgroundColor: "#f9f9f9" },
  userMessage: { textAlign: "right", margin: "5px", padding: "8px", backgroundColor: "#007bff", color: "white", borderRadius: "8px" },
  botMessage: { textAlign: "left", margin: "5px", padding: "8px", backgroundColor: "#e1e1e1", borderRadius: "8px" },
  inputContainer: { display: "flex", borderTop: "1px solid #ccc", padding: "10px", backgroundColor: "#fff" },
  input: { flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid #ccc" },
  button: { marginLeft: "10px", padding: "8px 12px", backgroundColor: "#007bff", color: "white", borderRadius: "4px", cursor: "pointer", border: "none" },
};

export default ChatApp;
