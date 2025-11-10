import { useState, useEffect } from 'react';
import Head from 'next/head';
import axios from 'axios';

export default function Home({ initialChecks }) {
  const [checks, setChecks] = useState(initialChecks || []);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newInterval, setNewInterval] = useState('60000');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedCheck, setSelectedCheck] = useState(null);
  const [compactMode, setCompactMode] = useState(false);
  const [showAddForm, setShowAddForm] = useState(true);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchChecks();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchChecks = async () => {
    try {
      const response = await axios.get('/api/healthchecks');
      setChecks(response.data.checks);
    } catch (err) {
      console.error('Failed to fetch checks:', err);
    }
  };

  const addHealthCheck = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await axios.post('/api/healthchecks', {
        url: newUrl,
        name: newName || newUrl,
        interval: parseInt(newInterval),
      });

      setNewUrl('');
      setNewName('');
      setNewInterval('60000');
      await fetchChecks();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add health check');
    } finally {
      setLoading(false);
    }
  };

  const deleteHealthCheck = async (id) => {
    try {
      await axios.delete(`/api/healthchecks/${id}`);
      await fetchChecks();
      if (selectedCheck?.id === id) {
        setSelectedCheck(null);
      }
    } catch (err) {
      console.error('Failed to delete check:', err);
    }
  };

  const viewDetails = async (id) => {
    try {
      const response = await axios.get(`/api/healthchecks/${id}`);
      setSelectedCheck(response.data);
    } catch (err) {
      console.error('Failed to fetch check details:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  const getStatusBadge = (status) => {
    const color = status === 'online' ? 'bg-green-100 text-green-800' :
                  status === 'offline' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800';
    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
        {status.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Head>
        <title>LivelyHealthCheck - URL Monitoring Dashboard</title>
        <meta name="description" content="Monitor your URLs and measure performance" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-gray-800 mb-2">
                ⚡ LivelyHealthCheck
              </h1>
              <p className="text-gray-600">
                Monitor your URLs in real-time with performance metrics
              </p>
            </div>
            <button
              onClick={() => setCompactMode(!compactMode)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition duration-200 flex items-center gap-2"
            >
              {compactMode ? (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Full View
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
                  </svg>
                  Compact View
                </>
              )}
            </button>
          </div>
        </header>

        {/* Add New Health Check Form */}
        {showAddForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                Add New Health Check
              </h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition duration-200 text-sm font-medium"
              >
                Hide
              </button>
            </div>
          <form onSubmit={addHealthCheck} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL to Monitor *
                </label>
                <input
                  type="url"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Website"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Check Interval (ms) *
              </label>
              <select
                value={newInterval}
                onChange={(e) => setNewInterval(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="5000">5 seconds</option>
                <option value="10000">10 seconds</option>
                <option value="30000">30 seconds</option>
                <option value="60000">1 minute</option>
                <option value="300000">5 minutes</option>
                <option value="600000">10 minutes</option>
              </select>
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Adding...' : 'Add Health Check'}
            </button>
          </form>
        </div>
        )}

        {!showAddForm && (
          <div className="mb-8 text-center">
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
            >
              + Show Add New Health Check Form
            </button>
          </div>
        )}

        {/* Health Checks List */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-semibold mb-4 text-gray-800">
            Active Monitors ({checks.length})
          </h2>

          {checks.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-2">No health checks yet. Add one above to get started!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {checks.map((check) => (
                <div
                  key={check.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {compactMode ? (
                    // Compact Mode View
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(check.latestStatus)} animate-pulse`}></div>
                        <div className="flex-1">
                          <span className="text-sm font-medium text-gray-800">{check.url}</span>
                        </div>
                        {getStatusBadge(check.latestStatus)}
                      </div>

                    </div>
                  ) : (
                    // Full Mode View
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getStatusColor(check.latestStatus)} animate-pulse`}></div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {check.name}
                          </h3>
                          {getStatusBadge(check.latestStatus)}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-medium">URL:</span> {check.url}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <span>
                            <span className="font-medium">Interval:</span> {check.interval / 1000}s
                          </span>
                          {check.latestResponseTime && (
                            <span>
                              <span className="font-medium">Response Time:</span>{' '}
                              <span className={`font-semibold ${
                                check.latestResponseTime < 500 ? 'text-green-600' :
                                check.latestResponseTime < 1000 ? 'text-yellow-600' :
                                'text-red-600'
                              }`}>
                                {check.latestResponseTime}ms
                              </span>
                            </span>
                          )}
                          {check.lastChecked && (
                            <span>
                              <span className="font-medium">Last Check:</span>{' '}
                              {new Date(check.lastChecked).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                        <div className="flex gap-2 ml-4">

                        <button
                          onClick={() => viewDetails(check.id)}
                          className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition duration-200 text-sm font-medium"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => deleteHealthCheck(check.id)}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition duration-200 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Details Modal */}
        {selectedCheck && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedCheck.name}
                  </h3>
                  <button
                    onClick={() => setSelectedCheck(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>
                <p className="text-sm text-gray-600 mt-1">{selectedCheck.url}</p>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <h4 className="text-lg font-semibold mb-4">Check History</h4>

                {selectedCheck.results && selectedCheck.results.length > 0 ? (
                  <div className="space-y-2">
                    {[...selectedCheck.results].reverse().map((result, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${getStatusColor(result.status)}`}></div>
                          <span className="text-sm text-gray-600">
                            {new Date(result.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex gap-4 text-sm">
                          {getStatusBadge(result.status)}
                          {result.statusCode && (
                            <span className="text-gray-600">
                              Status: <span className="font-semibold">{result.statusCode}</span>
                            </span>
                          )}
                          <span className="text-gray-600">
                            Time: <span className={`font-semibold ${
                              result.responseTime < 500 ? 'text-green-600' :
                              result.responseTime < 1000 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>{result.responseTime}ms</span>
                          </span>
                          {result.error && (
                            <span className="text-red-600 text-xs">
                              Error: {result.error}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No check history available yet</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Server-side rendering to get initial data
export async function getServerSideProps() {
  try {
    // Fetch from our API endpoint (server-side)
    // In production, you'd use the full URL
    const response = await axios.get('http://localhost:3000/api/healthchecks');
    return {
      props: {
        initialChecks: response.data.checks || [],
      },
    };
  } catch (error) {
    // If server isn't ready yet, return empty array
    return {
      props: {
        initialChecks: [],
      },
    };
  }
}
