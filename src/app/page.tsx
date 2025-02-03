"use client"

import React, { useEffect, useState, useCallback } from "react";
import { RxHamburgerMenu } from "react-icons/rx";
import { FiRefreshCw } from "react-icons/fi";
import { FiUpload, FiCheck, FiX, FiSearch, FiLoader, FiGlobe, FiTrash2 } from "react-icons/fi";
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Switch } from '@headlessui/react';
import { LeadData, EmailResponse } from './types/types';
import { FaLinkedin } from "react-icons/fa";
import { FiInfo } from 'react-icons/fi';
import { Popover } from '@headlessui/react';
import { toast } from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';

interface EmailProps {
  toggleComponentVisibility: () => void;
  isSidebarVisible: boolean;
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

interface ParsedContact {
  name: string;
  title: string;
  date: string;
  email: string;
}

const Email: React.FC<EmailProps> = ({
  toggleComponentVisibility,
  isSidebarVisible,
  onClose
}) => {
  const [leads, setLeads] = useState<LeadData[]>([]);
  const [isReloading, setIsReloading] = useState(false);
  const [emailResults, setEmailResults] = useState<Record<string, EmailResponse>>({});
  const [loadingEmails, setLoadingEmails] = useState<Record<string, boolean>>({});
  const [csvFiles, setCsvFiles] = useState<CSVData[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [mode, setMode] = useState('csv');
  const [isSwapping, setIsSwapping] = useState(false);
  const [deletingLeads, setDeletingLeads] = useState<{ [key: number]: boolean }>({});

  const fetchLeads = async () => {
    try {
      const response = await fetch('/api/leads/displaypull');
      if (!response.ok) {
        throw new Error('Failed to fetch leads');
      }
      const data = await response.json();
      setLeads(data);
    } catch (error) {
      console.error('Error fetching leads:', error);
    }
  };

  const handleSwap = async () => {
    setIsSwapping(true);
    try {
      const response = await fetch('/api/leads/swap', {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch leads from swap');
      }

      const data = await response.json();
      console.log('Leads fetched from swap:', data);
      await fetchLeads();
    } catch (error) {
      console.error('Error fetching leads from swap:', error);
    } finally {
      setIsSwapping(false);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        // First run the swap operation
        // await handleSwap(); // Removed this line
      } catch (error) {
        console.error('Error during initialization:', error);
      } finally {
        // setIsSwapping(false); // Removed this line
      }
    };

    initializeData();
  }, []); // Empty dependency array means this runs once when component mounts

  const handleReload = async () => {
    setIsReloading(true);
    await fetchLeads();
    setIsReloading(false);
  };

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

  const onDrop = useCallback((acceptedFiles: File[]) => {
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
  }, []);

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
      const response = await fetch('/api/autoDelete', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete records');
      }

      const result = await response.json();
      console.log('Delete successful:', result);
      setCsvFiles([]);
      setDeleteSuccess(true);
      await fetchLeads();
      setTimeout(() => {
        setDeleteSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error deleting records:', error);
    } finally {
      setIsDeleting(false);
    }
  };

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
                  <tr key={lead.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">{lead.id}</td>
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
            disabled={isUploading}
            className={`mt-4 w-full py-2 px-4 rounded-md text-white transition-colors
              ${isUploading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : uploadSuccess
                  ? 'bg-green-500'
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
          >
            {isUploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading...
              </span>
            ) : uploadSuccess ? (
              <span className="flex items-center justify-center">
                <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Uploaded!
              </span>
            ) : (
              'Upload Files'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

const capitalizeWords = (str: string) => {
  return str.replace(/\b\w/g, char => char.toUpperCase());
};

export default Email;




