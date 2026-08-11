import { useState, useEffect } from 'react';
import { subscribeToCollection } from '../lib/firebase';
import AdminDashboard from './dashboards/AdminDashboard';
import TeacherDashboard from './dashboards/TeacherDashboard';
import StudentDashboard from './dashboards/StudentDashboard';

export default function Dashboard() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const role = localStorage.getItem('userRole') || 'student';

  useEffect(() => {
    // Real-time listener for transactions
    const unsubscribe = subscribeToCollection('transactions', (data: any[]) => {
      setTransactions(data);
    });
    return unsubscribe;
  }, []);

  return (
    <div className="container">
      {role === 'admin' && <AdminDashboard transactions={transactions} />}
      {role === 'teacher' && <TeacherDashboard transactions={transactions} />}
      {role === 'student' && <StudentDashboard />}
    </div>
  );
}
