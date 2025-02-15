import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
}));

const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

function generateResponse(text) {
    text = text.toLowerCase();
    
    const patterns = [
        {
            keywords: ['hello', 'hi', 'hey'],
            response: "Hello! How can I help you today?"
        },
        {
            keywords: ['how are you', 'how do you do'],
            response: "I'm doing well, thank you for asking. How can I assist you?"
        },
        {
            keywords: ['time', 'what time'],
            response: "The current time is " + new Date().toLocaleTimeString()
        },
        {
            keywords: ['weather', 'temperature'],
            response: "I'm sorry, I don't have access to real-time weather data. Would you like me to connect to a weather service?"
        },
        {
            keywords: ['refresh', 'reload', 'update'],
            response: "To refresh the application, you can either click the refresh button in your browser or press F5. If you're having specific issues, could you tell me what exactly you're trying to refresh?"
        },
        {
            keywords: ['bye', 'goodbye', 'see you'],
            response: "Goodbye! Have a great day!"
        },
        {
            keywords: ['thank you', 'thanks', 'appreciate it'],
            response: "You're very welcome! Let me know if there's anything else I can do for you."
        }
    ];

    for (let pattern of patterns) {
        if (pattern.keywords.some(keyword => text.includes(keyword))) {
            return pattern.response;
        }
    }

    return "I understand you asked about '" + text + "'. Could you provide more details about what you'd like to know?";
}

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    let currentResponse = null;

    socket.on('voice-data', (data) => {
        const responseText = generateResponse(data.transcript);
        
        socket.emit('server-response', {
            text: responseText,
            timestamp: Date.now(),
            id: Date.now().toString()
        });

        currentResponse = responseText;
    });

    socket.on('interrupt', () => {
        socket.emit('pause-audio');
    });

    socket.on('resume', () => {
        socket.emit('resume-audio');
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});