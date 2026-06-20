import React, { useState, useCallback, useRef } from 'react';
import Navbar from './Navbar';
import Content from './Content';
import SearchBar from './SearchBar';
import ResultsList from './ResultsList';
import Toast from './Toast';
import { searchInstagram } from './api';
import { exportToExcel } from './excelExport';
import './App.css';

function App() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [toast, setToast] = useState(null);
  const abortRef = useRef(null);

  const showToast = useCallback((message, type) => setToast({ message, type }), []);

  const handleSearch = useCallback(async (form) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setSearched(true);

    try {
      const data = await searchInstagram(form, abortRef.current.signal);
      setResults(data);
      if (data.length > 0) {
        try {
          const count = await exportToExcel(data, form);
          showToast(`Excel mein ${count} results save ho gaye ✓`, 'success');
        } catch {
          showToast('Excel export fail hua, manually download karo', 'error');
        }
      }
    } catch (err) {
      if (err.name === 'CanceledError' || err.code === 'ERR_CANCELED') return;
      showToast(err.response?.data?.error || 'Data fetch mein problem, please retry', 'error');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  return (
    <div className="app">
      <Navbar />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {!searched && <Content />}
      <ResultsList results={results} loading={loading} searched={searched} />
      <SearchBar onSearch={handleSearch} />
    </div>
  );
}

export default App;
