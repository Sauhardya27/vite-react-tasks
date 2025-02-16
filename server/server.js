import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const httpServer = createServer(app);

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"]
}));
app.use(express.json());

const mongoURI = process.env.MONGODB_URI

mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log('Connected to MongoDB');
}).catch((error) => {
    console.error('MongoDB connection error:', error);
});

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

app.post('/api/users', async (req, res) => {
    try {
        const user = new User(req.body);
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

app.put('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        Object.assign(user, req.body);
        user.updatedAt = new Date();
        await user.save();
        
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

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

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});