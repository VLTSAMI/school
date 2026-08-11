import { useState, useEffect, useRef } from 'react';
import { ScanLine, CheckCircle, AlertCircle, Camera, Loader2, Info } from 'lucide-react';
import { subscribeToCollection, processAdminScan } from '../lib/firebase';

export default function Scanner() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [libReady, setLibReady] = useState(false);
  const scannerRef = useRef<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if ((window as any).Html5QrcodeScanner || (window as any).Html5Qrcode) {
        setLibReady(true);
        clearInterval(interval);
      }
    }, 500);

    const unsubClasses = subscribeToCollection('classes', (data: any[]) => {
      setClasses(data);
      if (data.length > 0 && !selectedClassId) setSelectedClassId(data[0].id);
    });
    const unsubStudents = subscribeToCollection('students', (data: any[]) => setStudents(data));

    return () => {
      clearInterval(interval);
      unsubClasses();
      unsubStudents();
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch (err) {
        console.error("Cleanup error", err);
      }
      scannerRef.current = null;
    }
    setIsScanning(false);
  };

  const startScanner = () => {
    if (!selectedClassId) {
      alert("يرجى اختيار القسم أولاً");
      return;
    }
    
    setIsScanning(true);
    setScanResult(null);

    setTimeout(() => {
      try {
        const Html5QrcodeScanner = (window as any).Html5QrcodeScanner;
        if (!Html5QrcodeScanner) throw new Error("Library not loaded yet");

        const scanner = new Html5QrcodeScanner(
          "reader", 
          { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0, rememberLastUsedCamera: true },
          false
        );

        scanner.render(
          async (decodedText: string) => {
            await stopScanner();
            handleScanSuccess(decodedText);
          },
          () => { /* Ignore scan frame errors */ }
        );
        
        scannerRef.current = scanner;
      } catch (err) {
        console.error("Initialization error", err);
        setIsScanning(false);
      }
    }, 100);
  };

  const handleScanSuccess = async (decodedText: string) => {
    const result = await processAdminScan(decodedText, selectedClassId, students, classes);
    if (result.success && result.data) {
      setScanResult({ success: true, message: `تم تسجيل حضور: ${result.data.studentName}` });
      if (navigator.vibrate) navigator.vibrate(200);
    } else {
      setScanResult({ success: false, message: result.error || "خطأ في تسجيل الحضور" });
      if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
    }
  };

  return (
    <div className="container flex-col gap-lg items-center">
      <h2 className="flex items-center gap-sm mt-sm">
        <ScanLine color="var(--primary)" /> ماسح المسؤول
      </h2>

      <div className="input-group w-full">
        <label className="input-label">تحديد القسم</label>
        <select 
          className="input-field w-full"
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          disabled={isScanning}
          style={{ background: 'var(--surface-bright)', border: '1px solid var(--primary)' }}
        >
          {classes.map(cls => (
            <option key={cls.id} value={cls.id}>{cls.name} - أ. {cls.teacher}</option>
          ))}
        </select>
      </div>

      <div className="relative w-full aspect-square max-w-sm" style={{ background: '#0a0a0a', borderRadius: '32px', overflow: 'hidden', border: isScanning ? '2px solid var(--primary)' : '1px solid var(--surface-container-highest)' }}>
        {!isScanning ? (
          <div className="flex-col items-center justify-center h-full gap-md">
            <Camera size={64} className="text-secondary" style={{ opacity: 0.2 }} />
            {!libReady ? (
              <div className="flex items-center gap-sm text-secondary">
                <Loader2 size={18} className="animate-spin" />
                <span>جاري تحميل الكاميرا...</span>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={startScanner}>تنشيط الكاميرا</button>
            )}
          </div>
        ) : (
          <div id="reader" style={{ width: '100%', height: '100%' }}></div>
        )}

        {scanResult && (
          <div className="absolute inset-0 flex items-center justify-center p-lg" style={{ background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(12px)', zIndex: 100 }}>
            <div className="flex-col items-center gap-md text-center">
              {scanResult.success ? <CheckCircle size={80} color="#4ade80" /> : <AlertCircle size={80} color="#ff4d4d" />}
              <h3 style={{ margin: 0, color: scanResult.success ? '#4ade80' : '#ff4d4d' }}>{scanResult.success ? "نجحت العملية" : "فشلت العملية"}</h3>
              <p style={{ fontSize: '15px', color: '#fff' }}>{scanResult.message}</p>
              <button className="btn btn-secondary mt-md" onClick={() => setScanResult(null)}>مسح جديد</button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-sm text-secondary mt-md" style={{ fontSize: '12px' }}>
        <Info size={14} />
        <span>تأكد من السماح للكاميرا بالعمل.</span>
      </div>
      <div style={{ height: '80px' }}></div>
    </div>
  );
}
