import NavBar from "./components/NavBar"
import { Routes,Route, Navigate } from "react-router-dom" 

import HomePage from "./pages/HomePage"
import SignUpPage from "./pages/SignUpPage"
import LoginPage from "./pages/LoginPage"
import SettingsPage from "./pages/SettingsPage"
import ProfilePage from "./pages/ProfilePage"

import useAuthStore from "./store/useAuthStore"
import { useChatStore } from "./store/useChatStore"
import {useThemeStore} from "./store/useThemeStore"
import { useEffect } from "react"
import {Toaster} from "react-hot-toast"


// import {loader} from "lucide-react"

const App = () => {
  const {authUser,checkAuth, isCheckingAuth, onlineUsers} = useAuthStore()
  const {theme} = useThemeStore()

  const { subscribeToMessages, unsubscribeFromMessages } = useChatStore()

  console.log({onlineUsers})

  useEffect(()=>{
    checkAuth()
  },[checkAuth])

  console.log({authUser});

  useEffect(() => {
    if (authUser) {
      subscribeToMessages();
    }

    return () => unsubscribeFromMessages();
  }, [authUser, subscribeToMessages, unsubscribeFromMessages]);

  if(isCheckingAuth && !authUser)
  {
    return(
      <div className="flex items-center justify-center h-screen">
        <span className="size-10 loading loading-dots loading-lg"></span>
      </div>
    )
  }

  return (
    <div data-theme={theme}>
      <NavBar/>

      <Routes>
        <Route path="/" element={authUser ? <HomePage/> : <Navigate to="/login"/>} />
        <Route path="/signup" element={!authUser ? <SignUpPage/> : <Navigate to="/"/>} />
        <Route path="/login" element={!authUser ? <LoginPage/> : <Navigate to="/"/>} />
        <Route path="/settings" element={<SettingsPage/>} />
        <Route path="/profile" element={authUser ? <ProfilePage/> : <Navigate to="/login"/>} />
      </Routes>

      <Toaster/>

    </div>
  )
}

export default App