// In-memory client-side mock store for interactive demonstration when backend is not running

let initialClasses = [
  { id: 'c_101', name: 'Class 6 – Morning Shift', totalSeats: 120, heldSeats: 12, confirmedSeats: 85, availableSeats: 23 },
  { id: 'c_102', name: 'Class 6 – Day Shift', totalSeats: 120, heldSeats: 8, confirmedSeats: 70, availableSeats: 42 },
  { id: 'c_103', name: 'Class 9 – Science Morning', totalSeats: 80, heldSeats: 5, confirmedSeats: 65, availableSeats: 10 }
];

let holds = [];

export const mockApi = {
  createClass: async (name, totalSeats) => {
    await new Promise(r => setTimeout(r, 200));
    const newClass = {
      id: `c_${Date.now().toString(36)}`,
      name,
      totalSeats: Number(totalSeats),
      heldSeats: 0,
      confirmedSeats: 0,
      availableSeats: Number(totalSeats)
    };
    initialClasses.push(newClass);
    return { id: newClass.id, name: newClass.name, totalSeats: newClass.totalSeats };
  },

  getClasses: async () => {
    await new Promise(r => setTimeout(r, 100));
    const now = Date.now();
    return initialClasses.map(c => {
      const activeHolds = holds.filter(h => h.classId === c.id && h.status === 'HELD' && new Date(h.expiresAt).getTime() > now);
      const confirmed = holds.filter(h => h.classId === c.id && h.status === 'CONFIRMED');
      const heldSeats = activeHolds.length + (c.heldSeats || 0);
      const confirmedSeats = confirmed.length + (c.confirmedSeats || 0);
      const availableSeats = Math.max(0, c.totalSeats - heldSeats - confirmedSeats);
      return { ...c, heldSeats, confirmedSeats, availableSeats };
    });
  },

  getClass: async (classId) => {
    await new Promise(r => setTimeout(r, 100));
    const classes = await mockApi.getClasses();
    const found = classes.find(c => c.id === classId);
    if (!found) throw { status: 404, message: 'Class not found' };
    return found;
  },

  createHold: async (classId, studentId) => {
    await new Promise(r => setTimeout(r, 200));
    const now = Date.now();
    
    // Check duplicate active hold for student
    const existing = holds.find(h => 
      h.classId === classId && 
      h.studentId === studentId && 
      (h.status === 'CONFIRMED' || (h.status === 'HELD' && new Date(h.expiresAt).getTime() > now))
    );
    if (existing) {
      throw { status: 409, message: 'Student already has an active hold or confirmed admission in this class' };
    }

    const cls = await mockApi.getClass(classId);
    if (cls.availableSeats <= 0) {
      throw { status: 409, message: 'No seats available in this class' };
    }

    const holdId = `h_${Date.now().toString(36)}`;
    const expiresAt = new Date(now + 600 * 1000).toISOString(); // 10 mins

    const newHold = {
      holdId,
      classId,
      className: cls.name,
      studentId,
      status: 'HELD',
      expiresAt
    };

    holds.push(newHold);
    return newHold;
  },

  getHold: async (holdId) => {
    await new Promise(r => setTimeout(r, 100));
    const found = holds.find(h => h.holdId === holdId);
    if (!found) throw { status: 404, message: 'Hold not found' };
    const now = Date.now();
    const effectiveStatus = (found.status === 'HELD' && new Date(found.expiresAt).getTime() <= now) 
      ? 'EXPIRED' 
      : found.status;
    return { ...found, status: effectiveStatus };
  },

  confirmHold: async (holdId, studentId) => {
    await new Promise(r => setTimeout(r, 200));
    const hold = holds.find(h => h.holdId === holdId);
    if (!hold) throw { status: 404, message: 'Hold not found' };
    if (hold.studentId !== studentId) throw { status: 403, message: 'Access denied' };
    if (hold.status === 'CONFIRMED') return { holdId, status: 'CONFIRMED' };
    if (new Date(hold.expiresAt).getTime() <= Date.now()) {
      hold.status = 'EXPIRED';
      throw { status: 400, message: 'Hold has expired and seat was released' };
    }
    hold.status = 'CONFIRMED';
    return { holdId, status: 'CONFIRMED' };
  },

  cancelHold: async (holdId, studentId) => {
    await new Promise(r => setTimeout(r, 200));
    const hold = holds.find(h => h.holdId === holdId);
    if (!hold) throw { status: 404, message: 'Hold not found' };
    if (hold.studentId !== studentId) throw { status: 403, message: 'Access denied' };
    if (hold.status === 'CONFIRMED') throw { status: 400, message: 'Cannot cancel a confirmed admission' };
    hold.status = 'CANCELLED';
    return { success: true };
  },

  getMyHolds: async (studentId) => {
    await new Promise(r => setTimeout(r, 100));
    const now = Date.now();
    return holds
      .filter(h => h.studentId === studentId)
      .map(h => ({
        ...h,
        status: (h.status === 'HELD' && new Date(h.expiresAt).getTime() <= now) ? 'EXPIRED' : h.status
      }))
      .reverse();
  }
};
