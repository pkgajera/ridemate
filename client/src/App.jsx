import React, { lazy } from 'react'
import { useAuth } from './context/AllContext'
import Login from './pages/Login';
import { Route, Routes, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard'
import Header from './components/Header';
import Sidebar from './components/Sidebar';

const OnBoardingForm = lazy(() => import('./pages/OnBoarding'));
const Profile = lazy(() => import('./pages/Profile'));
const Notification = lazy(() => import('./pages/Notification'))
const Chat = lazy(() => import('./pages/Chat'))

const App = () => {

  const { isLoggedIn, sidebarOpen, toggleSidebar } = useAuth();

  const location = useLocation();

  return (
    <>
      {
        isLoggedIn ?
          <>
            <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
            <div className='w-screen h-screen overflow-x-hidden overflow-y-auto'>
              {location.pathname !== '/onboard' && <Header />}
              <div className='w-full' style={{ height: 'calc(100vh - 72px)' }}>
                <Routes>
                  <Route path='/' element={<Dashboard />} />
                  <Route path='/onboard' element={<OnBoardingForm />} />
                  <Route path='/profile' element={<Profile />} />
                  <Route path='/notification' element={<Notification />} />
                  <Route path='/chat' element={<Chat />} />
                </Routes>
              </div>
            </div>
          </>
          : <Login />
      }
    </>
  )
}

export default App