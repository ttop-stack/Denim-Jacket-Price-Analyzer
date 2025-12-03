
import React, { useRef, useEffect, useState, useCallback } from 'react';
import Spinner from './Spinner';

interface CameraViewProps {
  onCapture: (base64Images: string[]) => void;
  isLoading: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onCapture, isLoading }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reviewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimeoutRef = useRef<number | null>(null);
  const capturedFramesRef = useRef<string[]>([]);
  const frameCaptureIntervalRef = useRef<number | null>(null);

  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);

  const cleanup = useCallback(() => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      if (videoBlobUrl) {
          URL.revokeObjectURL(videoBlobUrl);
      }
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
      }
      if (frameCaptureIntervalRef.current) {
        clearInterval(frameCaptureIntervalRef.current);
        frameCaptureIntervalRef.current = null;
      }
  }, [videoBlobUrl]);

  const startCamera = useCallback(async () => {
    try {
      cleanup(); // Clean up previous streams before starting a new one
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Could not access the camera. Please check your browser permissions.");
    }
  }, [cleanup]);

  useEffect(() => {
    startCamera();
    return cleanup;
  }, [startCamera]);
  
  const captureCurrentFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    // Ensure canvas has the same dimensions as the video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    capturedFramesRef.current.push(dataUrl.split(',')[1]);
  }, []);

  const handleStartRecording = () => {
    if (isRecording || !videoRef.current?.srcObject) return;
    
    setIsRecording(true);
    recordedChunksRef.current = [];
    capturedFramesRef.current = [];

    const stream = videoRef.current.srcObject as MediaStream;
    mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: 'video/webm' });

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };

    mediaRecorderRef.current.onstop = () => {
      if (frameCaptureIntervalRef.current) {
        clearInterval(frameCaptureIntervalRef.current);
        frameCaptureIntervalRef.current = null;
      }
      const videoBlob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(videoBlob);
      setVideoBlobUrl(url);
      setIsReviewing(true);
      setIsRecording(false);
    };

    mediaRecorderRef.current.start();
    
    // Start capturing frames from the live stream
    captureCurrentFrame(); // Capture one frame immediately
    frameCaptureIntervalRef.current = window.setInterval(captureCurrentFrame, 1000);

    recordingTimeoutRef.current = window.setTimeout(handleStopRecording, 5000);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimeoutRef.current) {
      clearTimeout(recordingTimeoutRef.current);
      recordingTimeoutRef.current = null;
    }
    if (frameCaptureIntervalRef.current) {
      clearInterval(frameCaptureIntervalRef.current);
      frameCaptureIntervalRef.current = null;
    }
  };

  const handleRetake = () => {
      cleanup();
      setIsReviewing(false);
      setVideoBlobUrl(null);
      setError(null);
      capturedFramesRef.current = [];
      startCamera();
  };

  const handleUseVideo = () => {
    if (capturedFramesRef.current.length > 0) {
      onCapture(capturedFramesRef.current);
    } else {
      setError("Could not capture frames from the video. Please try recording again.");
    }
  };

  const renderReviewScreen = () => (
    <div className="absolute inset-0 z-20 bg-black flex flex-col">
      <video ref={reviewVideoRef} src={videoBlobUrl!} autoPlay loop muted playsInline className="w-full flex-grow object-contain"></video>
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent flex justify-around items-center">
        <button onClick={handleRetake} className="text-white font-bold py-3 px-8 rounded-lg bg-white/20 hover:bg-white/30 transition-colors">Retake</button>
        <button 
          onClick={handleUseVideo} 
          disabled={isLoading} 
          className="text-white font-bold py-3 px-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors flex items-center justify-center min-w-[120px] disabled:bg-indigo-400 disabled:cursor-not-allowed"
        >
          {isLoading ? <Spinner size="small" /> : "Use Video"}
        </button>
      </div>
      {error && <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg text-center z-30">{error}</div>}
    </div>
  );
  
  const RecordButton = () => (
    <button
      onClick={handleStartRecording}
      disabled={isLoading || isRecording || !!error}
      className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 ease-in-out transform active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Record Video"
    >
      <div className={`w-18 h-18 rounded-full border-4 border-gray-800 p-1 transition-all duration-300 ${isRecording ? 'animate-pulse' : ''}`}>
         <div className={`w-12 h-12 rounded-full bg-red-500 transition-all duration-300 ${isRecording ? 'scale-75 rounded-md' : ''}`}></div>
      </div>
    </button>
  );

  if (isReviewing) {
      return renderReviewScreen();
  }

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center bg-black">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover"></video>
      <div className="absolute inset-0 bg-black bg-opacity-20"></div>
      
      {error && !isReviewing && <div className="absolute top-4 left-4 right-4 bg-red-500 text-white p-3 rounded-lg text-center z-20">{error}</div>}

      <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center z-10">
        <div className="bg-white/20 backdrop-blur-md p-4 rounded-xl text-center text-white mb-6">
            <h2 className="font-bold text-lg">Record a Short Video of your Jacket</h2>
            <p className="text-sm">Capture all angles, including tags and details.</p>
        </div>
        <RecordButton />
      </div>

      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default CameraView;
