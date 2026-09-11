import { useState } from 'react'
import RegisterStudent from "./components/RegisterStudent";

function App() {
  const [count, setCount] = useState<number>(0)

  return (
    <div className="container mt-5">
      <div className="card shadow-sm">
        <div className="card-body">
          <h1 className="card-title">Register Student</h1>
          <RegisterStudent />
        </div>
      </div>
    </div>
  )
}

export default App