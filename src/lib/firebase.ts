import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, updateDoc, doc, onSnapshot, query, setDoc, getDocs, getDoc, arrayUnion, arrayRemove, where, limit, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendPasswordResetEmail as firebaseSendPasswordResetEmail } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBpOWwiB3JBDpR5gaKgvryLG0zkn4wdMNw",
  authDomain: "shoocl-7f62a.firebaseapp.com",
  projectId: "shoocl-7f62a",
  storageBucket: "shoocl-7f62a.firebasestorage.app",
  messagingSenderId: "565821680187",
  appId: "1:565821680187:web:6a216a6aca25d57798ca1e",
  measurementId: "G-MHGR4R8LVL"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// --- AUTH FUNCTIONS ---

export const loginUser = async (email: string, pass: string) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const uid = userCredential.user.uid;
  const userDoc = await getDoc(doc(db, 'users', uid));
  if (userDoc.exists()) {
    return userDoc.data().role;
  }
  throw new Error("لم يتم العثور على صلاحيات لهذا المستخدم");
};

export const registerUser = async (name: string, email: string, pass: string, key: string, phone?: string, level?: string) => {
  const cleanKey = key.trim().toUpperCase();
  let keyIdToMarkAsUsed: string | null = null;
  let detectedRole: 'student' | 'teacher' = 'student';
  let targetClassDocId: string | null = null;

  // 1. Check if key is a Subject Key for a Class (Teacher registration)
  const classKeyQuery = query(collection(db, 'classes'), where('subjectKey', '==', cleanKey), limit(1));
  const classSnap = await getDocs(classKeyQuery);

  if (!classSnap.empty) {
    detectedRole = 'teacher';
    targetClassDocId = classSnap.docs[0].id;
  } else if (cleanKey !== '000000') {
    // 2. Check if key is a Student Registration Key in 'keys' collection
    const keyQuery = query(collection(db, 'keys'), where('key', '==', cleanKey), where('used', '==', false), limit(1));
    const keySnap = await getDocs(keyQuery);
    
    if (keySnap.empty) {
      throw new Error("مفتاح التسجيل غير صحيح (تأكد من إدخال رمز المادة للأستاذ أو كود التسجيل للطالب)");
    }
    keyIdToMarkAsUsed = keySnap.docs[0].id;
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const uid = userCredential.user.uid;
  
  if (keyIdToMarkAsUsed) {
    await updateDoc(doc(db, 'keys', keyIdToMarkAsUsed), {
      used: true,
      usedBy: uid,
      usedAt: new Date().toISOString()
    });
  }

  // Create document in 'users' collection with appropriate role
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    role: detectedRole,
    createdAt: new Date().toISOString()
  });

  if (detectedRole === 'teacher') {
    // Link class to teacher automatically
    if (targetClassDocId) {
      await updateDoc(doc(db, 'classes', targetClassDocId), {
        teacherId: uid,
        teacher: name
      });
    }
    return 'teacher';
  } else {
    // Create student document
    await setDoc(doc(db, 'students', uid), {
      name,
      email,
      phone: phone || '',
      level: level || '',
      classIds: [], 
      studentCode: `STU-${uid.substring(0, 4).toUpperCase()}`,
      subjectAttendance: {},
      joinedAt: new Date().toISOString()
    });
    return 'student';
  }
};

export const logoutUser = async () => {
  await signOut(auth);
  localStorage.removeItem('userRole');
  window.location.hash = '#/login';
};

export const sendPasswordResetEmail = async (email: string) => {
  await firebaseSendPasswordResetEmail(auth, email);
};

// --- CLASS MANAGEMENT (FOR ADMIN & TEACHER) ---

export const generateClassSubjectKey = () => {
  const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SUB-${randomStr}`;
};

export const addClass = async (name: string, teacher: string, teacherId: string, fee: number, schedule?: string) => {
  const classId = `class_${Date.now()}`;
  const subjectKey = generateClassSubjectKey();
  await setDoc(doc(db, 'classes', classId), {
    id: classId,
    name,
    teacher,
    teacherId: teacherId || '',
    fee: Number(fee),
    schedule: schedule || '',
    subjectKey,
    createdAt: new Date().toISOString()
  });
  return { id: classId, subjectKey };
};

export const generateSubjectKeyForClass = async (classId: string) => {
  const subjectKey = generateClassSubjectKey();
  await updateDoc(doc(db, 'classes', classId), { subjectKey });
  return subjectKey;
};

export const claimClassWithKey = async (teacherUid: string, key: string, teacherName?: string) => {
  const cleanKey = key.trim().toUpperCase();
  const q = query(collection(db, 'classes'), where('subjectKey', '==', cleanKey), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    throw new Error('رمز المادة غير صحيح أو غير موجود');
  }
  const classDoc = snap.docs[0];
  const classData = classDoc.data();

  const updatePayload: any = {
    teacherId: teacherUid
  };
  if (teacherName && teacherName.trim()) {
    updatePayload.teacher = teacherName.trim();
  }

  await updateDoc(doc(db, 'classes', classDoc.id), updatePayload);
  return { id: classDoc.id, ...classData, ...updatePayload };
};

export const deleteClass = async (classId: string) => {
  await deleteDoc(doc(db, 'classes', classId));
};

// --- STUDENT MANAGEMENT ---

export const enrollInClass = async (uid: string, classId: string) => {
  const studentRef = doc(db, 'students', uid);
  await updateDoc(studentRef, {
    classIds: arrayUnion(classId)
  });
};

export const unenrollFromClass = async (uid: string, classId: string) => {
  const studentRef = doc(db, 'students', uid);
  await updateDoc(studentRef, {
    classIds: arrayRemove(classId)
  });
};

export const updateStudentName = async (uid: string, newName: string) => {
  const studentRef = doc(db, 'students', uid);
  await updateDoc(studentRef, { name: newName });
  await updateDoc(doc(db, 'users', uid), { name: newName });
};

export const updateStudentProfile = async (uid: string, data: { name?: string; phone?: string; level?: string }) => {
  const studentRef = doc(db, 'students', uid);
  await updateDoc(studentRef, data);
  if (data.name) {
    await updateDoc(doc(db, 'users', uid), { name: data.name });
  }
};

export const deleteStudent = async (uid: string) => {
  await deleteDoc(doc(db, 'students', uid));
  await deleteDoc(doc(db, 'users', uid));
};

// --- PAYMENTS & ATTENDANCE ---

export const resetStudentAttendance = async (uid: string, classId: string) => {
  const studentRef = doc(db, 'students', uid);
  await updateDoc(studentRef, {
    [`subjectAttendance.${classId}`]: 0
  });
  // Log a renewal transaction
  const studentSnap = await getDoc(studentRef);
  const studentData = studentSnap.data();
  const classSnap = await getDoc(doc(db, 'classes', classId));
  const classData = classSnap.data();
  
  await addDoc(collection(db, 'transactions'), {
    studentId: uid,
    studentName: studentData?.name || 'Unknown',
    classId,
    className: classData?.name || 'Unknown',
    type: 'renewal',
    totalFee: classData?.fee || 0,
    teacherShare: (classData?.fee || 0) * 0.8,
    adminShare: (classData?.fee || 0) * 0.2,
    attendanceCount: 0,
    timestamp: new Date().toISOString()
  });
};

export const addManualTransaction = async (studentId: string, classId: string, students: any[], classes: any[]) => {
  const student = students.find(s => s.id === studentId);
  const cls = classes.find(c => c.id === classId);
  if (!student || !cls) throw new Error("بيانات غير صحيحة");

  const studentRef = doc(db, 'students', studentId);
  const currentAttendance = student.subjectAttendance || {};
  const classAttendance = currentAttendance[classId] || 0;

  await updateDoc(studentRef, {
    [`subjectAttendance.${classId}`]: classAttendance + 1
  });

  await addDoc(collection(db, 'transactions'), {
    studentId: student.id,
    studentName: student.name,
    classId: cls.id,
    className: cls.name,
    type: 'manual',
    teacherShare: cls.fee * 0.8,
    adminShare: cls.fee * 0.2,
    totalFee: cls.fee,
    attendanceCount: classAttendance + 1,
    timestamp: new Date().toISOString()
  });
};

// --- SCHEDULE MANAGEMENT ---

export const addScheduleEntry = async (entry: {
  classId: string;
  className: string;
  teacher: string;
  day: string;
  time: string;
  room: string;
  teacherId?: string;
}) => {
  await addDoc(collection(db, 'schedule'), {
    ...entry,
    createdAt: new Date().toISOString()
  });
};

export const deleteScheduleEntry = async (entryId: string) => {
  await deleteDoc(doc(db, 'schedule', entryId));
};

// --- REAL FIRESTORE FUNCTIONS ---

export const subscribeToCollection = (collectionName: string, callback: Function) => {
  const q = query(collection(db, collectionName));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => {
      const item = doc.data() as any;
      const formattedItem: any = { ...item, id: doc.id };
      
      if (collectionName === 'students') {
        if (!formattedItem.studentCode && item.id) {
          formattedItem.studentCode = item.id;
        }
        formattedItem.subjectAttendance = item.subjectAttendance || {};
      }
      return formattedItem;
    });
    callback(data);
  });
};

export const subscribeToTeacherClasses = (teacherUid: string, callback: Function) => {
  if (!teacherUid) {
    callback([]);
    return () => {};
  }
  const q = query(collection(db, 'classes'), where('teacherId', '==', teacherUid));
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
    callback(data);
  });
};

export const processAdminScan = async (scannedCode: string, targetClassId: string, students: any[], classes: any[]) => {
  try {
    const student = students.find(s => s.id === scannedCode || s.studentCode === scannedCode);
    const targetClass = classes.find(c => c.id === targetClassId);

    if (!student) throw new Error("الطالب غير موجود في النظام");
    if (!targetClass) throw new Error("القسم غير موجود");

    if (!student.classIds?.includes(targetClassId)) {
      throw new Error(`الطالب غير مسجل في مادة ${targetClass.name}`);
    }

    const currentAttendance = student.subjectAttendance || {};
    const classAttendance = currentAttendance[targetClassId] || 0;

    if (classAttendance >= 30) {
      throw new Error(`اشتراك مادة ${targetClass.name} منتهي! يرجى الدفع وتجديد الاشتراك.`);
    }

    const studentRef = doc(db, 'students', student.id);
    const newCount = classAttendance + 1;
    
    await updateDoc(studentRef, { 
      [`subjectAttendance.${targetClassId}`]: newCount 
    });

    const transaction = {
      studentId: student.id,
      studentName: student.name,
      classId: targetClass.id,
      className: targetClass.name,
      type: 'scan',
      teacherShare: targetClass.fee * 0.8,
      adminShare: targetClass.fee * 0.2,
      totalFee: targetClass.fee,
      attendanceCount: newCount,
      timestamp: new Date().toISOString()
    };
    
    await addDoc(collection(db, 'transactions'), transaction);
    return { success: true, data: transaction };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const generateRegistrationKeys = async (count: number) => {
  const keys: string[] = [];
  for (let i = 0; i < count; i++) {
    const key = Math.random().toString(36).substring(2, 10).toUpperCase();
    await addDoc(collection(db, 'keys'), {
      key,
      used: false,
      createdAt: new Date().toISOString()
    });
    keys.push(key);
  }
  return keys;
};

export const seedInitialData = async () => {
  const classesCheck = await getDocs(collection(db, 'classes'));
  if (classesCheck.empty) {
    const classes = [
      { id: 'class_a', name: 'الفيزياء', teacher: 'أحمد', teacherId: '', fee: 1500, schedule: '' },
      { id: 'class_b', name: 'الرياضيات', teacher: 'سارة', teacherId: '', fee: 1800, schedule: '' },
      { id: 'class_c', name: 'العلوم', teacher: 'مراد', teacherId: '', fee: 1200, schedule: '' },
    ];
    for (const c of classes) {
      await setDoc(doc(db, 'classes', c.id), c);
    }
  }
};
