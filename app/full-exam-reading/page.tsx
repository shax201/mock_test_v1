'use client';

import React, { useState, useEffect } from 'react';
import ReadingTestComponent from '../../components/test/ReadingTestComponent';
import { ReadingTestData } from '@/lib/types/reading-test';

const ReadingTest: React.FC = () => {
  const [testData, setTestData] = useState<ReadingTestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/full-exam-reading');

        if (!response.ok) {
          throw new Error(`Failed to fetch test data: ${response.status}`);
        }

        const data: ReadingTestData = await response.json();
        setTestData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching test data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load test data');
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading IELTS Reading Test...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#d32f2f',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{ marginBottom: '20px' }}>❌ Error loading test</div>
        <div style={{ fontSize: '14px', color: '#666' }}>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!testData) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        No test data available
      </div>
    );
  }

  return <ReadingTestComponent testData={testData} />;
};

export default ReadingTest;
