import { RouterProvider } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routes'
import { ChatProvider } from './contexts/ChatContext'
import { LanguageProvider } from './contexts/LanguageContext'
import FirebaseMessagingProvider from './components/common/FirebaseMessagingProvider'
import 'react-toastify/dist/ReactToastify.css'

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 0,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
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
      </LanguageProvider>
    </QueryClientProvider>
  )
}

export default App
