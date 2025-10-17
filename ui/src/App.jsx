import { NavLink, Outlet } from 'react-router-dom'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">COZY</div>
          <nav className="nav">
            <NavLink to="/order" className={({isActive})=> isActive? 'nav-link active':'nav-link'}>주문하기</NavLink>
            <NavLink to="/admin" className={({isActive})=> isActive? 'nav-link active':'nav-link'}>관리자</NavLink>
          </nav>
        </div>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  )
}

export default App
