import { Routes, Route } from 'react-router-dom'
import SignUp from './components/custom/pages/auth/SignUp'
import Login from './components/custom/pages/auth/Login'
import './App.css'

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<SignUp />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </div>
  )
}

export default App
