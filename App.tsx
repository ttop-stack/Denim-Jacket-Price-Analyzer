
import React, { useState } from 'react';
import CameraView from './components/CameraView';
import ResultDisplay from './components/ResultDisplay';
import Spinner from './components/Spinner';
import { estimateDenimJacketPrice } from './services/geminiService';
import { EstimationResult } from './types';

type View = 'camera' | 'loading' | 'result' | 'error';

const App: React.FC = () => {
  const [view, setView] = useState<View>('camera');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [result, setResult] = useState<EstimationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCapture = async (base64Images: string[]) => {
    if (base64Images.length === 0) {
      setError("Video processing failed. Please try again.");
      setView('error');
      return;
    }

    setView('loading');
    setCapturedImage(base64Images[0]); // Use the first frame as a thumbnail
    try {
      const estimation = await estimateDenimJacketPrice(base64Images);
      setResult(estimation);
      setView('result');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
      setView('error');
    }
  };

  const handleReset = () => {
    setView('camera');
    setCapturedImage(null);
    setResult(null);
    setError(null);
  };
  
  const renderLoadingScreen = () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white p-4">
      {capturedImage && (
        <img 
            src={`data:image/jpeg;base64,${capturedImage}`} 
            alt="Captured item for analysis" 
            className="w-48 h-48 object-cover rounded-lg mb-8 shadow-2xl opacity-50"
        />
      )}
      <Spinner />
      <h2 className="text-xl font-semibold mt-6">Analyzing Video...</h2>
      <p className="text-gray-300 mt-2 text-center">Our AI is inspecting your jacket from all angles. <br/>This might take a moment.</p>
    </div>
  );

  const renderErrorScreen = () => (
     <div className="w-full h-full flex flex-col items-center justify-center bg-red-50 text-red-800 p-8">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold mb-2">Something Went Wrong</h2>
      <p className="text-center text-red-700 mb-8 max-w-md">{error}</p>
      <button
        onClick={handleReset}
        className="bg-red-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
      >
        Try Again
      </button>
    </div>
  );


  const renderContent = () => {
    const isLoading = view === 'loading';
    switch (view) {
      case 'camera':
        return <CameraView onCapture={handleCapture} isLoading={isLoading} />;
      case 'loading':
        return renderLoadingScreen();
      case 'result':
        if (result && capturedImage) {
          return <ResultDisplay result={result} imageSrc={capturedImage} onReset={handleReset} />;
        }
        // Fallback to error if data is missing
        setError("Result data is missing.");
        return renderErrorScreen();
      case 'error':
        return renderErrorScreen();
      default:
        return <CameraView onCapture={handleCapture} isLoading={isLoading} />;
    }
  };

  return (
    <main className="h-screen w-screen font-sans">
      {renderContent()}
    </main>
  );
};

export default App;
