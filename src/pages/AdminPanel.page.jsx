import { useEffect, useState } from "react";
import { Table, Button, Container, Navbar, Nav } from "react-bootstrap";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../style/AdminPanel.style.css";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    fetchUsers();
    fetchChats();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get("/api/admin/users");
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  const fetchChats = async () => {
    try {
      const response = await axios.get("/api/admin/chats");
      setChats(response.data);
    } catch (error) {
      console.error("Error fetching chats", error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user", error);
    }
  };

  const deleteChat = async (chatId) => {
    try {
      await axios.delete(`/api/admin/chats/${chatId}`);
      fetchChats();
    } catch (error) {
      console.error("Error deleting chat", error);
    }
  };

  return (
    <Container>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand href="#">Admin Dashboard</Navbar.Brand>
        <Nav className="me-auto">
          <Nav.Link href="#users">Users</Nav.Link>
          <Nav.Link href="#chats">Chats</Nav.Link>
        </Nav>
      </Navbar>

      <h2 id="users" className="mt-4">Users</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Username</th>
            <th>Email</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.id}</td>
              <td>{user.username}</td>
              <td>{user.email}</td>
              <td>
                <Button variant="danger" onClick={() => deleteUser(user.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>

      <h2 id="chats" className="mt-4">Chats</h2>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>ID</th>
            <th>Chat Content</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {chats.map((chat) => (
            <tr key={chat.id}>
              <td>{chat.id}</td>
              <td>{chat.content}</td>
              <td>
                <Button variant="danger" onClick={() => deleteChat(chat.id)}>
                  Delete
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
};

export default AdminDashboard;
