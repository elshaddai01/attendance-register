/**
 * ExcelImportModal: Upload and parse Excel spreadsheets (.xlsx, .xls)
 * to bulk import students into the extra classes register.
 */
import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  RefreshCw,
  Info,
} from 'lucide-react';
import { downloadExcelTemplate, parseStudentsFromExcel, ParseResult } from '../lib/excelUtils';
import { Student } from '../types';
import { formatCFA } from '../lib/formatters';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (students: Omit<Student, 'id' | 'createdAt'>[]) => Promise<number>;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importSuccessCount, setImportSuccessCount] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setErrorMsg(null);
    setImportSuccessCount(null);
    setIsParsing(true);

    try {
      const result = await parseStudentsFromExcel(selected);
      setParseResult(result);
    } catch (err) {
      console.error('Failed to parse Excel file:', err);
      setErrorMsg('Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (!droppedFile) return;
    setFile(droppedFile);
    setErrorMsg(null);
    setImportSuccessCount(null);
    setIsParsing(true);

    try {
      const result = await parseStudentsFromExcel(droppedFile);
      setParseResult(result);
    } catch (err) {
      console.error('Failed to parse Excel file:', err);
      setErrorMsg('Failed to read Excel file. Please ensure it is a valid .xlsx or .xls file.');
      setParseResult(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.validStudents.length === 0) return;
    setIsImporting(true);
    setErrorMsg(null);

    try {
      const importedCount = await onImport(parseResult.validStudents);
      setImportSuccessCount(importedCount);
      // Wait 1.5 seconds then close
      setTimeout(() => {
        handleReset();
        onClose();
      }, 1500);
    } catch (err: unknown) {
      console.error('Import error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Failed to import students to database.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setParseResult(null);
    setErrorMsg(null);
    setImportSuccessCount(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-xl overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold">Import Students from Excel</h3>
              <p className="text-xs text-slate-300">
                THE BEST ACADEMY Extra Classes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Step 1: Download Template Callout */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-blue-600" />
                Step 1: Download the Excel Template
              </p>
              <p className="text-xs text-slate-500">
                Use our pre-formatted template with columns: Full Name, Level, Subjects, Phone, Termly Fee.
              </p>
            </div>
            <button
              type="button"
              onClick={downloadExcelTemplate}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-900 bg-white border border-slate-300 hover:bg-slate-100 shadow-2xs transition-colors shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              Download Template (.xlsx)
            </button>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />

          {/* Step 2: Upload Area */}
          {!file ? (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-slate-400 rounded-2xl p-8 text-center cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-all group"
            >
              <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform text-slate-700">
                <Upload className="w-6 h-6 text-emerald-600" />
              </div>
              <p className="text-sm font-bold text-slate-900">
                Choose an Excel spreadsheet (.xlsx, .xls) to upload
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Drag and drop your file here, or click to browse
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-slate-900 truncate max-w-sm">{file.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB • Ready for processing
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs font-medium text-slate-500 hover:text-slate-800 underline"
              >
                Change file
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Success Flash */}
          {importSuccessCount !== null && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Successfully imported {importSuccessCount} students into the register!</span>
            </div>
          )}

          {/* Parsing Spinner */}
          {isParsing && (
            <div className="py-6 text-center text-xs text-slate-600 flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
              Analyzing spreadsheet rows and validating levels...
            </div>
          )}

          {/* Step 3: Parse Results & Preview */}
          {parseResult && !isParsing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    {parseResult.validStudents.length} Valid Students
                  </span>
                  {parseResult.errorsCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                      {parseResult.errorsCount} Skipped (Errors)
                    </span>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  Total rows: {parseResult.parsedRows.length}
                </span>
              </div>

              {/* Preview Table */}
              <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-wider sticky top-0">
                    <tr>
                      <th className="py-2 px-3">Row</th>
                      <th className="py-2 px-3">Student Name</th>
                      <th className="py-2 px-3">Level</th>
                      <th className="py-2 px-3">Fee (FCFA)</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parseResult.parsedRows.map((row) => (
                      <tr
                        key={row.rowNumber}
                        className={row.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}
                      >
                        <td className="py-2 px-3 font-mono text-slate-400">{row.rowNumber}</td>
                        <td className="py-2 px-3 font-medium text-slate-900">{row.name || '—'}</td>
                        <td className="py-2 px-3">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-semibold">
                            {row.level}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-medium text-slate-700">
                          {formatCFA(row.termly_fee)}
                        </td>
                        <td className="py-2 px-3">
                          {row.isValid ? (
                            <span className="text-emerald-700 font-bold inline-flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Valid
                            </span>
                          ) : (
                            <span className="text-rose-700 font-bold text-[11px]" title={row.error}>
                              ✗ {row.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={downloadExcelTemplate}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 inline-flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            Get Template File
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={
                !parseResult ||
                parseResult.validStudents.length === 0 ||
                isImporting ||
                importSuccessCount !== null
              }
              className="px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors disabled:opacity-40 inline-flex items-center gap-1.5"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Importing to Database...
                </>
              ) : (
                `Import ${parseResult?.validStudents.length || 0} Students`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
