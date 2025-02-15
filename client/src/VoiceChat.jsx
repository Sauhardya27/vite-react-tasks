import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

const VoiceChat = () => {
	const [isRecording, setIsRecording] = useState(false);
	const [transcript, setTranscript] = useState('');
	const [messages, setMessages] = useState([]);
	const [error, setError] = useState(null);
	const [isPaused, setIsPaused] = useState(false);
	const [isInitializing, setIsInitializing] = useState(false);

	const socketRef = useRef(null);
	const recognitionRef = useRef(null);
	const utteranceRef = useRef(null);
	const messagesEndRef = useRef(null);
	const currentResponseRef = useRef(null);
	const audioPositionRef = useRef(0);

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	const initializeSpeechRecognition = () => {
		if ('webkitSpeechRecognition' in window) {
			recognitionRef.current = new webkitSpeechRecognition();
			recognitionRef.current.continuous = true;
			recognitionRef.current.interimResults = true;

			recognitionRef.current.onresult = (event) => {
				const current = event.resultIndex;
				const transcript = event.results[current][0].transcript;
				setTranscript(transcript);

				if (event.results[current].isFinal) {
					setMessages(prev => [...prev, {
						type: 'user',
						text: transcript,
						timestamp: new Date().toLocaleTimeString()
					}]);
					socketRef.current.emit('voice-data', { transcript });
				}
			};

			recognitionRef.current.onend = () => {
				if (isRecording && !isInitializing) {
					try {
						recognitionRef.current.start();
					} catch (error) {
						if (error.error !== 'aborted') {
							setError('Error restarting recognition: ' + error.message);
						}
					}
				}
			};

			recognitionRef.current.onerror = (event) => {
				if (event.error === 'aborted' && isRecording) {
					return;
				}
				if (event.error !== 'no-speech') {
					setError('Error occurred in recognition: ' + event.error);
				}
			};
		}
	};

	useEffect(() => {
		socketRef.current = io('http://localhost:3000');
		initializeSpeechRecognition();
	
		const handleServerResponse = async (data) => {
			setMessages(prev => [...prev, {
				type: 'assistant',
				text: data.text,
				timestamp: new Date().toLocaleTimeString()
			}]);
			currentResponseRef.current = data;
			playResponse(data.text);
		};
	
		socketRef.current.on('server-response', handleServerResponse);
	
		socketRef.current.on('pause-audio', () => {
			if (utteranceRef.current) {
				window.speechSynthesis.pause();
				audioPositionRef.current = utteranceRef.current.currentTime || 0;
				setIsPaused(true);
			}
		});
	
		socketRef.current.on('resume-audio', () => {
			if (utteranceRef.current) {
				window.speechSynthesis.resume();
				setIsPaused(false);
			}
		});
	
		return () => {
			socketRef.current.off('server-response', handleServerResponse);
			socketRef.current.disconnect();
			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}
			window.speechSynthesis.cancel();
		};
	}, []);

	const playResponse = (text) => {
		window.speechSynthesis.cancel();
		utteranceRef.current = new SpeechSynthesisUtterance(text);

		utteranceRef.current.onend = () => {
			setIsPaused(false);
			if (isRecording && recognitionRef.current) {
				recognitionRef.current.start();
			}
		};

		utteranceRef.current.onpause = () => {
			audioPositionRef.current = utteranceRef.current.currentTime || 0;
		};

		window.speechSynthesis.speak(utteranceRef.current);
	};

	const startRecording = async () => {
		try {
			setIsInitializing(true);
			setError(null);

			if (recognitionRef.current) {
				recognitionRef.current.stop();
			}

			await new Promise(resolve => setTimeout(resolve, 100));

			initializeSpeechRecognition();

			await recognitionRef.current.start();
			setIsRecording(true);
		} catch (err) {
			setError('Error accessing microphone: ' + err.message);
		} finally {
			setIsInitializing(false);
		}
	};

	const stopRecording = () => {
		setIsInitializing(true);  
		if (recognitionRef.current) {
			recognitionRef.current.stop();
		}
		window.speechSynthesis.cancel();
		setIsRecording(false);
		setTranscript('');
		setIsPaused(false);
		setError(null);
		setIsInitializing(false);
	};

	const handleAudioControl = () => {
		if (isPaused) {
			socketRef.current.emit('resume');
		} else {
			socketRef.current.emit('interrupt');
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-indigo-100 via-purple-100 to-pink-100 p-6">
			<div className="max-w-3xl mx-auto">
				<div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
					<div className="mb-6">
						<h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 mb-2">
							Voice Chat Assistant
						</h1>
						<p className="text-gray-600">Speak your message and I'll respond instantly</p>
						<div className="h-px bg-gradient-to-r from-indigo-200 to-purple-200 w-full mt-4"></div>
					</div>

					{/* Chat Messages */}
					<div className="mb-6 h-[400px] overflow-y-auto bg-gray-100/70 rounded-xl p-4 shadow-inner">
						{messages.map((message, index) => (
							<div
								key={index}
								className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'
									}`}
							>
								<div className="flex flex-col">
									<small className="text-xs text-gray-500 mb-1">
										{message.timestamp}
									</small>
									<div
										className={`inline-block p-3 rounded-2xl max-w-[80%] ${message.type === 'user'
											? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white ml-auto'
											: 'bg-white/90 text-gray-800 shadow-md border border-gray-200'
											} shadow-md`}
									>
										{message.text}
									</div>
								</div>
							</div>
						))}
						<div ref={messagesEndRef} />
					</div>

					{/* Current Transcript */}
					{transcript && (
						<div className="mb-6 p-4 bg-indigo-50 rounded-xl shadow-inner border border-indigo-100">
							<p className="text-gray-600 italic">{transcript}</p>
						</div>
					)}

					{/* Controls */}
					<div className="flex justify-center gap-4">
						<button
							onClick={isRecording ? stopRecording : startRecording}
							disabled={isInitializing}
							className={`px-8 py-4 rounded-full font-semibold text-white transition-all transform hover:scale-105 shadow-lg ${isInitializing
								? 'bg-gray-400 cursor-not-allowed'
								: isRecording
									? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600'
									: 'bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600'
								}`}
						>
							{isInitializing
								? 'Initializing...'
								: isRecording
									? 'Stop Recording'
									: 'Start Recording'
							}
						</button>

						{isRecording && currentResponseRef.current && (
							<button
								onClick={handleAudioControl}
								className={`px-8 py-4 rounded-full font-semibold text-white transition-all transform hover:scale-105 shadow-lg ${isPaused
									? 'bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600'
									: 'bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600'
									}`}
							>
								{isPaused ? 'Resume' : 'Interrupt'}
							</button>
						)}
					</div>

					{/* Error Display */}
					{error && error !== 'Error occurred in recognition: aborted' && (
						<div className="mt-4 p-4 bg-red-100/80 text-red-700 rounded-xl border border-red-200">
							{error}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};

export default VoiceChat;