import VoiceChat from './components/VoiceChat'
import User from './components/User'
import Footer from './components/Footer'

function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow">
        <VoiceChat />
        <User />
      </div>
      <Footer />
    </div>
  )
}

export default App
