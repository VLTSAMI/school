import { useState, useEffect } from 'react';
import { BookOpen, Edit2, UserX, Users, ChevronDown, ChevronUp, Plus, Check, Search, Trash2, PlusCircle, X, Key, Copy } from 'lucide-react';
import { subscribeToCollection, updateStudentName, enrollInClass, unenrollFromClass, auth, addClass, deleteClass, generateSubjectKeyForClass } from '../lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export default function Classes() {
  const [role] = useState(localStorage.getItem('userRole') || 'student');
  const [currentUserUid, setCurrentUserUid] = useState<string | null>(auth.currentUser?.uid || null);
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('all'); 
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Admin Add Class Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newTeacherName, setNewTeacherName] = useState('');
  const [newClassFee, setNewClassFee] = useState('');

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) setCurrentUserUid(user.uid);
    });

    const unsubClasses = subscribeToCollection('classes', (data: any[]) => {
      setClasses(data);
    });
    
    const unsubStudents = subscribeToCollection('students', (data: any[]) => {
      const validData = data.filter(s => s.name && s.name.trim() !== "");
      setStudents(validData);
    });

    return () => { unsubAuth(); unsubClasses(); unsubStudents(); };
  }, []);

  const getVisibleStudents = () => {
    if (role === 'admin') return students;
    return students.filter(s => s.id === currentUserUid);
  };

  const getVisibleClasses = () => {
    if (role === 'admin') return classes;
    const myData = students.find(s => s.id === currentUserUid);
    return classes.filter(cls => myData?.classIds?.includes(cls.id));
  };

  const visibleStudents = getVisibleStudents();
  const visibleClasses = getVisibleClasses();

  useEffect(() => {
    if (role === 'student' && selectedTab === 'all' && visibleClasses.length > 0) {
      setSelectedTab(visibleClasses[0].id);
    }
  }, [role, visibleClasses, selectedTab]);

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName || !newTeacherName || !newClassFee) return;
    try {
      await addClass(newClassName, newTeacherName, '', Number(newClassFee));
      setShowAddModal(false);
      setNewClassName(''); setNewTeacherName(''); setNewClassFee('');
    } catch (err) {
      alert("خطأ في إضافة المادة");
    }
  };

  const handleDeleteClass = async (id: string, name: string) => {
    if (window.confirm(`هل أنت متأكد من حذف مادة ${name} نهائياً؟ سيتم إلغاء تسجيل جميع الطلاب منها.`)) {
      await deleteClass(id);
      if (selectedTab === id) setSelectedTab('all');
    }
  };

  const handleToggleEnrollment = async (uid: string, classId: string, isEnrolled: boolean) => {
    if (role !== 'admin') return;
    try {
      if (isEnrolled) {
        await unenrollFromClass(uid, classId);
      } else {
        await enrollInClass(uid, classId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditName = async (uid: string, currentName: string) => {
    const newName = prompt("تعديل اسم الطالب:", currentName);
    if (newName && newName.trim() !== "") await updateStudentName(uid, newName.trim());
  };

  const filteredStudents = visibleStudents.filter(s => {
    const name = s.name || "";
    const studentCode = s.studentCode || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || studentCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedTab === 'all') return matchesSearch;
    return matchesSearch && (s.classIds || []).includes(selectedTab);
  });

  const currentClassData = classes.find(c => c.id === selectedTab);

  return (
    <div className="container flex-col gap-lg">
      <div className="flex justify-between items-center mt-sm">
        <h2 className="flex items-center gap-sm" style={{ margin: 0 }}>
          <BookOpen color="var(--primary)" /> {role === 'admin' ? 'إدارة المدرسة' : 'حصصي الدراسية'}
        </h2>
        {role === 'admin' && (
          <button className="btn btn-primary" style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '14px' }} onClick={() => setShowAddModal(true)}>
            <PlusCircle size={18} /> إضافة مادة
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-sm" style={{ overflowX: 'auto', paddingBottom: '8px', margin: '0 -20px', padding: '0 20px' }}>
        {role === 'admin' && (
          <button
            className={`btn ${selectedTab === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 24px', flexShrink: 0, borderRadius: '12px' }}
            onClick={() => setSelectedTab('all')}
          >
            جميع الطلاب
          </button>
        )}
        {visibleClasses.map(cls => (
          <button
            key={cls.id}
            className={`btn ${selectedTab === cls.id ? 'btn-primary' : 'btn-secondary'}`}
            style={{ padding: '8px 16px', flexShrink: 0, borderRadius: '12px' }}
            onClick={() => setSelectedTab(cls.id)}
          >
            {cls.name}
          </button>
        ))}
      </div>

      {/* Class Info, Key & Delete (Admin Only) */}
      {role === 'admin' && selectedTab !== 'all' && currentClassData && (
        <div className="card flex-col gap-sm" style={{ background: 'rgba(255, 95, 31, 0.05)', border: '1px solid rgba(255, 95, 31, 0.2)' }}>
          <div className="flex justify-between items-center">
            <div className="flex-col">
              <span className="text-secondary" style={{ fontSize: '11px' }}>إدارة مادة</span>
              <h3 style={{ margin: 0, color: 'var(--primary)' }}>{currentClassData.name}</h3>
              <span className="text-secondary" style={{ fontSize: '11px' }}>
                الأستاذ: {currentClassData.teacher || 'غير محدد'} {currentClassData.teacherId ? ' (مربوط ✅)' : ' (غير مربوط ⚠️)'}
              </span>
            </div>
            <button className="btn-icon" style={{ background: 'rgba(255, 77, 77, 0.1)', color: 'var(--error)' }} onClick={() => handleDeleteClass(currentClassData.id, currentClassData.name)} title="حذف المادة">
              <Trash2 size={18} />
            </button>
          </div>

          {/* Subject Key Box */}
          <div className="flex items-center justify-between" style={{ padding: '10px 14px', background: 'rgba(0,0,0,0.3)', borderRadius: '14px', border: '1px solid rgba(255, 95, 31, 0.2)' }}>
            <div className="flex items-center gap-sm">
              <Key size={18} color="var(--primary)" />
              <div className="flex-col">
                <span className="text-secondary" style={{ fontSize: '10px' }}>مفتاح المادة للأستاذ (Subject Key):</span>
                <span className="number font-en" style={{ fontSize: '15px', fontWeight: 700, letterSpacing: '2px', color: 'var(--primary)' }}>
                  {currentClassData.subjectKey || 'لم يولد بعد'}
                </span>
              </div>
            </div>
            <button
              className="btn btn-secondary"
              style={{ padding: '6px 12px', fontSize: '11px', borderRadius: '10px' }}
              onClick={async () => {
                const key = currentClassData.subjectKey || (await generateSubjectKeyForClass(currentClassData.id));
                if (navigator.clipboard) {
                  await navigator.clipboard.writeText(key);
                }
                alert(`رمز المادة: ${key} (تم النسخ)`);
              }}
            >
              <Copy size={12} /> {currentClassData.subjectKey ? 'نسخ المفتاح' : 'توليد المفتاح'}
            </button>
          </div>
        </div>
      )}

      {role === 'admin' && (
        <div className="relative w-full">
          <span style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)' }}>
            <Search size={18} className="text-secondary" />
          </span>
          <input 
            type="text" 
            className="input-field w-full" 
            placeholder="ابحث عن اسم الطالب أو الكود..." 
            style={{ paddingRight: '48px' }}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      )}

      {/* Student List */}
      <div className="flex-col gap-sm">
        {filteredStudents.length === 0 ? (
          <p className="text-secondary text-center py-xl">لا يوجد نتائج</p>
        ) : (
          filteredStudents.map(student => {
            const isExpanded = expandedStudent === student.id || role === 'student';
            const studentClassIds = student.classIds || [];
            const subjectAttendance = student.subjectAttendance || {};
            const currentSubjectCount = selectedTab !== 'all' ? (subjectAttendance[selectedTab] || 0) : 0;

            return (
              <div key={student.id} className="card flex-col gap-sm" style={{ border: isExpanded ? '1px solid var(--primary)' : '1px solid var(--surface-container-highest)' }}>
                <div className="flex justify-between items-center" onClick={() => role === 'admin' && setExpandedStudent(isExpanded ? null : student.id)} style={{ cursor: role === 'admin' ? 'pointer' : 'default' }}>
                  <div className="flex-col">
                    <h4 style={{ margin: 0 }}>{student.name}</h4>
                    <div className="flex flex-wrap gap-xs mt-xs">
                      {studentClassIds.map((cid: string) => (
                        <span key={cid} className="chip primary" style={{ fontSize: '9px', padding: '2px 8px' }}>
                          {classes.find(c => c.id === cid)?.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  {role === 'admin' && (isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />)}
                </div>

                {isExpanded && (
                  <div className="mt-sm flex-col gap-md pt-md" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    {role === 'admin' && (
                      <div className="flex-col gap-sm">
                        <span style={{ fontSize: '12px', fontWeight: 600 }}>إدارة اشتراكات الطالب:</span>
                        <div className="flex flex-wrap gap-sm">
                          {classes.map(cls => {
                            const enrolled = studentClassIds.includes(cls.id);
                            return (
                              <button key={cls.id} className={`btn-tag ${enrolled ? 'active' : ''}`} onClick={() => handleToggleEnrollment(student.id, cls.id, enrolled)}>
                                {enrolled ? <Check size={12} /> : <Plus size={12} />} {cls.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {selectedTab !== 'all' && (
                      <div className="flex-col gap-sm">
                        <span style={{ fontSize: '12px' }}>الحضور في {currentClassData?.name}: <b>{currentSubjectCount}/30</b></span>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(10, 1fr)', gap: '6px' }}>
                          {Array.from({ length: 30 }).map((_, i) => (
                            <div key={i} style={{ aspectRatio: '1', borderRadius: '4px', background: i < currentSubjectCount ? 'var(--primary)' : 'var(--surface-container-high)' }} />
                          ))}
                        </div>
                      </div>
                    )}

                    {role === 'admin' && (
                      <div className="flex gap-sm mt-xs pt-sm" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                        <button className="btn-ghost flex-1 py-xs" onClick={() => handleEditName(student.id, student.name)}><Edit2 size={12}/> تعديل الاسم</button>
                        <button className="btn-ghost flex-1 py-xs" style={{ color: 'var(--error)' }}><UserX size={12}/> حذف الطالب</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add Class Modal */}
      {showAddModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card w-full flex-col gap-md" style={{ maxWidth: '400px', background: 'var(--surface-container-high)' }}>
            <div className="flex justify-between items-center">
              <h3 style={{ margin: 0 }}>إضافة مادة جديدة</h3>
              <button className="btn-icon" onClick={() => setShowAddModal(false)}><X /></button>
            </div>
            <form onSubmit={handleAddClass} className="flex-col gap-md">
              <div className="flex-col gap-xs">
                <label style={{ fontSize: '12px' }}>اسم المادة</label>
                <input type="text" className="input-field" placeholder="مثال: فيزياء 3 ثانوي" required value={newClassName} onChange={e => setNewClassName(e.target.value)} />
              </div>
              <div className="flex-col gap-xs">
                <label style={{ fontSize: '12px' }}>اسم الأستاذ</label>
                <input type="text" className="input-field" placeholder="مثال: أ. محمد سامي" required value={newTeacherName} onChange={e => setNewTeacherName(e.target.value)} />
              </div>
              <div className="flex-col gap-xs">
                <label style={{ fontSize: '12px' }}>سعر المادة (DA)</label>
                <input type="number" className="input-field" placeholder="مثال: 1500" required value={newClassFee} onChange={e => setNewClassFee(e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary w-full py-md mt-sm">تأكيد الإضافة</button>
            </form>
          </div>
        </div>
      )}

      <div style={{ height: '80px' }}></div>
    </div>
  );
}
