import { RouterProvider } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { router } from './routes'
import AuthDebugger from './components/common/AuthDebugger'
import { ChatProvider } from './contexts/ChatContext'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <ChatProvider>
      <RouterProvider router={router} />
      <AuthDebugger />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
    </ChatProvider>
  )
}

export default App
