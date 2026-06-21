import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, AlertTriangle, CheckCircle, Search, Download, Eye, Trash2, Loader2, X, FileDown, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import Markdown from 'react-markdown';

interface Report {
  _id: string; 
  filename: string;
  createdAt: string;
  mimeType: string;
  status: 'pending' | 'completed' | 'failed';
  analysis?: {
    summary: string;
    metrics: Array<{ name: string; value: string; status: 'Normal' | 'Low' | 'High' }>;
    alerts: Array<{ detail: string; severity: 'Low' | 'Moderate' | 'High' }>;
    trends: string;
    strengths: string[];
    concerns: string[];
    recommendations: {
      diet: string[];
      workout: string[];
      lifestyle: string[];
      mentalWellness: string[];
    };
  };
}

export function Reports() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch reports from Backend
  const fetchReports = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/v1/reports', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const result = await response.json();
      if (response.ok) {
        setReports(result.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleViewReport = (report: Report) => {
    setSelectedReport(report);
    setIsModalOpen(true);
  };

  const handleDownloadAnalysis = async (report: Report) => {
    try {
      const response = await fetch(`/api/v1/reports/${report._id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `MedSage_Analysis_${report.filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error: any) {
      alert(`Download Error: ${error.message}`);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (!confirm('Are you sure you want to delete this report?')) return;
    
    try {
      const response = await fetch(`/api/v1/reports/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      if (response.ok) {
        setReports(prev => prev.filter(r => r._id !== id));
        if (selectedReport?._id === id) setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAnalyze = async (id: string) => {
    setAnalyzingId(id);
    try {
      const response = await fetch(`/api/v1/reports/${id}/analyze`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });
      const result = await response.json();
      
      if (response.ok) {
        // Update local state with analysis
        setReports(prev => prev.map(r => r._id === id ? result.data : r));
        if (selectedReport?._id === id) setSelectedReport(result.data);
      } else {
        throw new Error(result.error || 'Analysis failed');
      }
    } catch (error: any) {
      alert(`Analysis Error: ${error.message}`);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const fileData = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
        reader.onerror = reject;
      });

      const base64Data = fileData.split(',')[1];

      const response = await fetch('/api/v1/reports/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          fileData: base64Data,
          mimeType: file.type,
          filename: file.name
        })
      });

      const result = await response.json();
      if (response.ok) {
        setReports(prev => [result.data, ...prev]);
        // Trigger analysis immediately for convenience, but it's now decoupled!
        handleAnalyze(result.data._id);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error: any) {
      alert(`Upload Error: ${error.message}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredReports = reports.filter(r =>
    r.filename.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-500 to-purple-500 tracking-tight">Report Analysis</h1>
          <p className="text-slate-500 mt-2 font-medium">Upload medical reports for AI extraction and insights.</p>
        </div>
        <div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,application/pdf"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
          >
            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isUploading ? 'Uploading...' : 'Upload Report'}
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Tips & Risk (Static placeholders for UI richness) */}
        <div className="space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-50/80 to-purple-50/80 backdrop-blur-2xl rounded-[2rem] p-8 border border-indigo-100/50 shadow-sm transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-white rounded-xl text-indigo-600 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Overall Health Insights</h2>
            </div>
            <div className="space-y-5">
              <div className="flex gap-3 items-start bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 font-medium leading-relaxed">AI analyzes your report history to detect <span className="font-bold text-slate-800">long-term trends</span>.</p>
              </div>
              <div className="flex gap-3 items-start bg-white/60 p-4 rounded-2xl border border-white shadow-sm">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-600 font-medium leading-relaxed">Instant alerts for <span className="font-bold text-slate-800">abnormal lab values</span> needing attention.</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/40 backdrop-blur-xl rounded-[2rem] p-8 border border-white/60 shadow-sm min-h-[400px]"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">Recent Reports</h2>
                {isLoading && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
              </div>
              <div className="relative w-full sm:w-auto">
                <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search filename..."
                  className="w-full sm:w-64 bg-white/80 backdrop-blur-md border border-white/80 rounded-xl pl-11 pr-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-400/50 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-4 pl-4">Filename</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredReports.map(report => (
                    <ReportRow
                      key={report._id}
                      report={report}
                      isAnalyzing={analyzingId === report._id}
                      onView={() => handleViewReport(report)}
                      onAnalyze={() => handleAnalyze(report._id)}
                      onDownload={() => handleDownloadAnalysis(report)}
                      onDelete={() => handleDeleteReport(report._id)}
                    />
                  ))}
                  {!isLoading && filteredReports.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-12 text-center text-slate-500 italic">
                        No reports found. Start by uploading one!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Analysis Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-[2rem] p-5 sm:p-8 w-full max-w-3xl shadow-2xl max-h-[90vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                    <FileText className="w-6 h-6" />
                  </div>
                  {selectedReport?.filename}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => { setIsModalOpen(false); setSelectedReport(null); }}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="overflow-y-auto pr-2 custom-scrollbar">
                {analyzingId === selectedReport?._id ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-4">
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                    <p className="text-slate-500 font-bold text-lg animate-pulse">AI is decoding your results...</p>
                    <p className="text-xs text-slate-400">This may take up to 30 seconds for complex PDFs</p>
                  </div>
                ) : selectedReport?.status === 'pending' ? (
                  <div className="flex flex-col items-center justify-center py-24 space-y-6 text-center">
                    <div className="p-4 bg-indigo-50 rounded-full">
                       <Play className="w-12 h-12 text-indigo-500 ml-1" />
                    </div>
                    <div className="max-w-xs">
                      <p className="text-slate-800 font-bold text-lg">Analysis Ready</p>
                      <p className="text-sm text-slate-500 mt-1">This report has been uploaded. Click below to generate clinical insights.</p>
                    </div>
                    <button
                      onClick={() => handleAnalyze(selectedReport!._id)}
                      className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                      Start Analysis
                    </button>
                  </div>
                ) : selectedReport?.analysis ? (
                   <div className="space-y-8 pb-4">
                      <section className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
                        <h3 className="text-sm font-bold text-indigo-900 uppercase tracking-wider mb-3">Clinical Summary</h3>
                        <p className="text-slate-700 leading-relaxed italic">
                          {selectedReport.analysis.summary}
                        </p>
                      </section>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedReport.analysis.metrics?.map((metric, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                            <div>
                              <p className="text-xs font-medium text-slate-500">{metric.name}</p>
                              <p className="text-lg font-bold text-slate-800">{metric.value}</p>
                            </div>
                            <span className={cn(
                              "px-2 py-1 rounded text-[10px] font-bold uppercase",
                              metric.status === 'Normal' ? "bg-emerald-100 text-emerald-700" :
                              metric.status === 'Low' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                            )}>
                              {metric.status}
                            </span>
                          </div>
                        ))}
                      </div>

                      {selectedReport.analysis.alerts.length > 0 && (
                        <section className="bg-red-50 p-6 rounded-2xl border border-red-100">
                          <h3 className="text-xs font-bold text-red-900 uppercase tracking-wider mb-3">High Priority Observations</h3>
                          <ul className="space-y-3">
                            {selectedReport.analysis.alerts.map((alert, i) => (
                              <li key={i} className="flex gap-3 text-sm text-red-700 font-medium">
                                <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
                                {alert.detail}
                              </li>
                            ))}
                          </ul>
                        </section>
                      )}

                      <section className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Recommended Actions</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Diet & Nutrition</p>
                              {selectedReport.analysis.recommendations.diet.map((r, i) => <p key={i} className="text-sm text-slate-600 mb-1">• {r}</p>)}
                           </div>
                           <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Lifestyle</p>
                              {selectedReport.analysis.recommendations.lifestyle.map((r, i) => <p key={i} className="text-sm text-slate-600 mb-1">• {r}</p>)}
                           </div>
                        </div>
                      </section>
                   </div>
                ) : (
                  <div className="py-24 text-center text-slate-400">
                    No data available.
                  </div>
                )}
              </div>

              {!analyzingId && selectedReport?.status === 'completed' && (
                <div className="mt-6 pt-6 border-t border-slate-100 flex justify-between">
                   <button
                    onClick={() => handleDownloadAnalysis(selectedReport!)}
                    className="flex items-center gap-2 text-indigo-600 font-bold hover:underline"
                  >
                    <Download className="w-4 h-4" /> Export as PDF
                  </button>
                   <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-slate-800 text-white px-6 py-2 rounded-xl font-bold"
                  >
                    Done
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface ReportRowProps {
  report: Report;
  isAnalyzing: boolean;
  onView: () => void;
  onAnalyze: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

function ReportRow({ report, isAnalyzing, onView, onAnalyze, onDownload, onDelete }: ReportRowProps) {
  const formattedDate = new Date(report.createdAt).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric'
  });

  return (
    <tr className="border-b border-slate-50 hover:bg-white/60 transition-colors group">
      <td className="py-5 pl-4 font-bold text-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform duration-300 shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="group-hover:text-indigo-600 transition-colors truncate max-w-[200px]">{report.filename}</span>
            <span className="text-[10px] text-slate-400 font-medium">{formattedDate}</span>
          </div>
        </div>
      </td>
      <td className="py-5">
        {isAnalyzing ? (
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-purple-600 px-3 py-1.5 bg-purple-50 rounded-lg w-fit">
            <Loader2 className="w-3 h-3 animate-spin" /> Analyzing...
          </div>
        ) : report.status === 'completed' ? (
          <button onClick={onView} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg w-fit hover:bg-emerald-100 transition-colors">
            <CheckCircle className="w-3 h-3" /> Analysis Complete
          </button>
        ) : (
          <button onClick={onAnalyze} className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg w-fit hover:bg-indigo-100 transition-colors">
            <Play className="w-3 h-3 fill-indigo-600" /> Start Analysis
          </button>
        )}
      </td>
      <td className="py-5 pr-4 text-right">
        <div className="flex justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
          {report.status === 'completed' && (
            <button onClick={onDownload} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
              <Download className="w-4 h-4" />
            </button>
          )}
          <button onClick={onView} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="View Details">
            <Eye className="w-4 h-4" />
          </button>
          <button onClick={onDelete} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}
