import type { AttendanceRepository } from "./domain/types";
import { attendanceRepository as mockAttendanceRepository } from "./infrastructure/mock-adapter";
export const attendanceRepositories: { attendance: AttendanceRepository } = { attendance: mockAttendanceRepository };
