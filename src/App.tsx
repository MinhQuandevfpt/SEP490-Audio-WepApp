import { RouterProvider } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { router } from './routes'
import { ChatProvider } from './contexts/ChatContext'
import FirebaseMessagingProvider from './components/common/FirebaseMessagingProvider'
import 'react-toastify/dist/ReactToastify.css'

function App() {
  return (
    <ChatProvider>
      <FirebaseMessagingProvider />
      <RouterProvider router={router} />
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
