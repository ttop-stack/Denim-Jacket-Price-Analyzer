
import React from 'react';
import { EstimationResult } from '../types';

interface ResultDisplayProps {
  result: EstimationResult;
  imageSrc: string;
  onReset: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string }> = ({ label, value }) => (
  <div className="flex justify-between items-center py-3 border-b border-gray-200 last:border-b-0">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="text-sm text-gray-900 font-semibold">{value || 'N/A'}</dd>
  </div>
);

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, imageSrc, onReset }) => {
  return (
    <div className="w-full h-full flex flex-col bg-gray-50">
      <div className="flex-shrink-0">
        <img
          src={`data:image/jpeg;base64,${imageSrc}`}
          alt="Captured denim jacket"
          className="w-full h-64 object-cover"
        />
      </div>

      <div className="flex-grow p-6 overflow-y-auto">
        <div className="text-center mb-6">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Estimated Value</p>
          <h1 className="text-5xl font-bold text-gray-900 my-2">{result.priceRange}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Justification</h3>
          <p className="text-gray-600 text-sm">
            {result.justification}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 px-5 pt-4">Item Details</h3>
            <dl className="px-5">
                <DetailItem label="Style" value={result.details.style} />
                <DetailItem label="Condition" value={result.details.condition} />
                <DetailItem label="Brand" value={result.details.brand} />
            </dl>
        </div>
      </div>

      <div className="p-6 border-t border-gray-200 bg-white">
        <button
          onClick={onReset}
          className="w-full bg-indigo-600 text-white font-bold py-4 px-4 rounded-xl hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          Scan Another Item
        </button>
      </div>
    </div>
  );
};

export default ResultDisplay;
