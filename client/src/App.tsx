import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Members from './pages/Members';
import CharacterProfile from './pages/CharacterProfile';
import Boards from './pages/Boards';
import BoardDetail from './pages/BoardDetail';
import PostDetail from './pages/PostDetail';
import Battle from './pages/Battle';
import Shop from './pages/Shop';
import Quests from './pages/Quests';
import Map from './pages/Map';
import AdminCharacters from './pages/AdminCharacters';
import PrivateRoute from './components/PrivateRoute';
import AdminRoute from './components/AdminRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/battle" element={<PrivateRoute><Battle /></PrivateRoute>} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="members" element={<Members />} />
            <Route path="members/:id" element={<CharacterProfile />} />
            <Route path="boards" element={<Boards />} />
            <Route path="boards/:boardId" element={<BoardDetail />} />
            <Route path="posts/:id" element={<PostDetail />} />
            <Route path="shop" element={<PrivateRoute><Shop /></PrivateRoute>} />
            <Route path="quests" element={<PrivateRoute><Quests /></PrivateRoute>} />
            <Route path="map" element={<PrivateRoute><Map /></PrivateRoute>} />
            <Route path="admin/characters" element={<AdminRoute><AdminCharacters /></AdminRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;


