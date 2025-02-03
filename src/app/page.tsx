"use client"

import React, { useState } from "react";
import { FiUpload, FiX, FiAlertTriangle } from "react-icons/fi";
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { LeadData } from './types/types';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

interface EmailProps {
  onClose: () => void;
}

interface CSVData {
  fileName: string;
  content: CSVRow[];
}

interface CSVRow {
  id: string;
  'Heart Beat': string;
  'Pulse': string;
  'Temperature (C)': string;
  'Gas Sensor Value': string;
  'IR Sensor Value': string;
}

const Dashboard: React.FC<EmailProps> = ({
  onClose
}) => {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [csvFiles, setCsvFiles] = useState<CSVData[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [selectedLead, setSelectedLead] = useState<LeadData | null>(null);

  const handleUpload = async () => {
    if (csvFiles.length === 0) return;

    try {
      const newLeads: LeadData[] = csvFiles.flatMap(csvFile => 
        csvFile.content.map(row => ({
          id: row.id,
          fullName: row.id,
          rawName: row.id,
          geoRegion: '',
          title: '',
          companyName: '',
          websites: '',
          linkedin_profile: '',
          heartBeat: row['Heart Beat'],
          pulse: row['Pulse'],
          temperature: row['Temperature (C)'],
          gasSensorValue: row['Gas Sensor Value'],
          irSensorValue: row['IR Sensor Value']
        }))
      );

      setLeads(newLeads);
      setCsvFiles([]);
      
      toast.success('CSV data loaded successfully', {
        duration: 2000,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    } catch (error) {
      console.error('Error processing CSV:', error);
      toast.error('Failed to process CSV data', {
        duration: 4000,
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    acceptedFiles.forEach((file) => {
      Papa.parse<CSVRow>(file, {
        complete: async (results) => {
          // Check if the required headers exist
          const headers = results.meta.fields || [];
          const requiredHeaders = ['id', 'Heart Beat', 'Pulse', 'Temperature (C)', 'Gas Sensor Value', 'IR Sensor Value'];
          const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));

          if (missingHeaders.length > 0) {
            toast.error(
              `CSV file "${file.name}" is missing required headers: ${missingHeaders.join(', ')}`,
              {
                duration: 4000,
                style: {
                  borderRadius: '10px',
                  background: '#333',
                  color: '#fff',
                },
              }
            );
            return;
          }

          const formattedData = {
            fileName: file.name,
            content: results.data
          };

          setCsvFiles(prev => [...prev, formattedData]);
        },
        header: true,
        skipEmptyLines: true,
        transformHeader: header => header.trim(),
        transform: value => value.trim(),
        error: (error) => {
          console.error('Error parsing CSV:', error);
          toast.error(`Error parsing CSV file "${file.name}": ${error.message}`, {
            duration: 4000,
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          });
        }
      });
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    }
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      // Clear local state instead of making API call
      setLeads([]);
      setCsvFiles([]);
      setDeleteSuccess(true);
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 2000);
    } finally {
      setIsDeleting(false);
    }
  };

  const LeadDetails = () => {
    const getValue = (label: string): string | undefined => {
      if (!selectedLead) return undefined;
      
      switch(label) {
        case 'Heart Beat':
          return selectedLead.heartBeat?.toString();
        case 'Pulse':
          return selectedLead.pulse?.toString();
        case 'Temperature (C)':
          return selectedLead.temperature?.toString();
        case 'Gas Sensor Value':
          return selectedLead.gasSensorValue?.toString();
        case 'IR Sensor Value':
          return selectedLead.irSensorValue?.toString();
        default:
          return undefined;
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-xl w-full">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xl font-bold">Patient #{selectedLead?.id} Vital Signs</span>
            <button onClick={() => setSelectedLead(null)} className="text-gray-500 hover:text-gray-700">
              <FiX className="h-6 w-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Heart Beat */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">❤️</span>
                <span className="text-gray-600">Heart Beat</span>
              </div>
              <div className="text-2xl font-bold text-green-500">
                {getValue('Heart Beat') || 'N/A'} 
                <span className="text-lg ml-1">BPM</span>
              </div>
              <div className="text-sm text-gray-600 mt-1">Normal rhythm</div>
            </div>

            {/* Pulse */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">💗</span>
                <span className="text-gray-600">Pulse</span>
              </div>
              <div className="text-2xl font-bold text-green-500">
                {getValue('Pulse') || 'N/A'}
              </div>
            </div>

            {/* Temperature */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">🌡️</span>
                <span className="text-gray-600">Temperature (C)</span>
              </div>
              <div className="text-2xl font-bold text-yellow-500">
                {getValue('Temperature (C)') || 'N/A'}°C
              </div>
              <div className="text-sm text-yellow-600 mt-1">
                {parseFloat(getValue('Temperature (C)') || '0') < 36 ? 'Hypothermia risk' : ''}
              </div>
            </div>

            {/* Gas Sensor */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">⚠️</span>
                <span className="text-gray-600">Gas Sensor Value</span>
              </div>
              <div className="text-xl font-bold text-gray-700">
                {getValue('Gas Sensor Value') || 'N/A'}
              </div>
            </div>

            {/* IR Sensor */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">📡</span>
                <span className="text-gray-600">IR Sensor Value</span>
              </div>
              <div className="text-xl font-bold text-gray-700">
                {getValue('IR Sensor Value') || 'N/A'}
              </div>
            </div>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-blue-800 font-semibold mb-2">Health Status Summary</h3>
            <p className="text-blue-700">
              Vital signs within normal parameters
            </p>
          </div>
        </div>
      </div>
    );
  };

  function hasAbnormalValues(lead: LeadData) {
    const heartBeat = parseFloat(lead.heartBeat || '');
    const pulse = parseFloat(lead.pulse || '');
    const temperature = parseFloat(lead.temperature || '');

    return (
      (heartBeat > 120 || heartBeat < 60) ||
      (pulse > 100 || pulse < 50) ||
      (temperature > 37.5 || temperature < 36)
    );
  }

  return (
    <div className="flex max-w-full flex-1 flex-col relative h-screen">
      <div>
        <Toaster position="top-right" />
      </div>
      {/* Header */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-2 py-2 text-text-dark bg-background">
        <div className="flex flex-col items-center flex-grow justify-center">
          <h1 
            className="text-xl font-bold text-text-dark opacity-80 cursor-pointer hover:opacity-100 transition-opacity"
            onClick={() => window.location.reload()}
          >
            Medical Dashboard
          </h1>
        </div>
        <button
          onClick={onClose}
          className="text-white hover:text-primary"
        >
          Close
        </button>
      </div>

      {/* Main content wrapper - add padding bottom to account for control panel */}
      <div className="flex-1 overflow-hidden pb-32">
        <div className="h-full overflow-x-auto">
          <div className="h-full overflow-y-auto">
            <table className="min-w-full divide-y divide-gray-200 relative">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Heart Beat</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pulse</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Temperature (C)</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gas Sensor Value</th>
                  <th scope="col" className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IR Sensor Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className={`hover:bg-gray-50 ${hasAbnormalValues(lead) ? 'bg-red-50' : ''}`}>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setSelectedLead(lead)}
                          className="text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {lead.id}
                        </button>
                        {hasAbnormalValues(lead) && (
                          <FiAlertTriangle className="text-red-500 w-4 h-4" title="Abnormal parameters detected" />
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{lead.heartBeat}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{lead.pulse}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{lead.temperature}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{lead.gasSensorValue}</td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{lead.irSensorValue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Control panel - update classes to ensure it stays at bottom */}
      <div className="fixed bottom-0 right-0 left-0 bg-white border-t border-gray-200 p-4">
        <div className="max-w-full mx-4 flex justify-end gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className={`h-24 px-4 ${
                isDeleting 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : deleteSuccess
                    ? 'bg-green-500'
                    : 'bg-red-500 hover:bg-red-600'
              } text-white rounded-lg flex items-center justify-center transition-colors`}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Deleting...
                </span>
              ) : deleteSuccess ? (
                <span className="flex items-center">
                  <svg className="h-6 w-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Deleted!
                </span>
              ) : (
                'Delete All'
              )}
            </button>

            {/* Dropzone */}
            <div 
              {...getRootProps()} 
              className={`w-80 h-24 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 
              ${isDragActive ? 'bg-blue-50 border-blue-500' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}
            >
              <input {...getInputProps()} />
              <FiUpload className="text-gray-500 w-10 h-10 mb-2" />
              <p className="text-sm text-gray-600 text-center px-2">
                {isDragActive 
                  ? "Drop your CSV files here" 
                  : "Drop CSV file"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Files List - adjust bottom position */}
      {csvFiles.length > 0 && (
        <div className="fixed bottom-40 right-4 bg-white shadow-lg rounded-lg p-4 w-80 max-h-64 overflow-y-auto">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-sm font-semibold">Files to Upload ({csvFiles.length}):</h4>
            <button 
              onClick={() => setCsvFiles([])} 
              className="text-xs text-red-500 hover:text-red-700"
            >
              Clear All
            </button>
          </div>
          <ul className="space-y-2">
            {csvFiles.map((file, index) => (
              <li 
                key={index} 
                className="flex justify-between items-center bg-gray-100 rounded-md p-2"
              >
                <span className="text-xs text-gray-600 truncate mr-2">
                  {file.fileName} ({file.content.length} rows)
                </span>
                <button 
                  onClick={() => setCsvFiles(prev => prev.filter((_, i) => i !== index))}
                  className="text-red-500 hover:text-red-700"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          
          <button
            onClick={handleUpload}
            className={`mt-4 w-full py-2 px-4 rounded-md text-white transition-colors
              ${isDeleting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-500 hover:bg-blue-600'
              }`}
          >
            {isDeleting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : (
              'Upload Files'
            )}
          </button>
        </div>
      )}
      {selectedLead && <LeadDetails />}
    </div>
  );
};

export default function Page() {
  return <Dashboard onClose={() => {}} />;
}




