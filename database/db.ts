import * as SQLite from "expo-sqlite";

const db = SQLite.openDatabaseSync("universidad.db");

export type Program = {
  id: number;
  code: string;
  name: string;
};

export type Student = {
  id: number;
  code: string;
  name: string;
  email: string;
  program_id: number;
  program_name?: string;
};

export const initDB = async () => {
  await db.execAsync(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS programs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      program_id INTEGER NOT NULL,
      FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE RESTRICT
    );
  `);

  await seedData();
};

const seedData = async () => {
  const countPrograms = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM programs`
  );

  if ((countPrograms?.total ?? 0) > 0) return;

  await db.runAsync(
    `INSERT INTO programs (code, name) VALUES (?, ?)`,
    ["ING-MUL", "Ingeniería Multimedia"]
  );
  await db.runAsync(
    `INSERT INTO programs (code, name) VALUES (?, ?)`,
    ["ING-SIS", "Ingeniería de Sistemas"]
  );
  await db.runAsync(
    `INSERT INTO programs (code, name) VALUES (?, ?)`,
    ["DIS-GRA", "Diseño Gráfico"]
  );

  const multimedia = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM programs WHERE code = ?`,
    ["ING-MUL"]
  );
  const sistemas = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM programs WHERE code = ?`,
    ["ING-SIS"]
  );
  const diseno = await db.getFirstAsync<{ id: number }>(
    `SELECT id FROM programs WHERE code = ?`,
    ["DIS-GRA"]
  );

  if (multimedia?.id) {
    await db.runAsync(
      `INSERT INTO students (code, name, email, program_id) VALUES (?, ?, ?, ?)`,
      ["MM001", "Cristian David", "cristian@uni.edu", multimedia.id]
    );
    await db.runAsync(
      `INSERT INTO students (code, name, email, program_id) VALUES (?, ?, ?, ?)`,
      ["MM002", "Laura Torres", "laura@uni.edu", multimedia.id]
    );
  }

  if (sistemas?.id) {
    await db.runAsync(
      `INSERT INTO students (code, name, email, program_id) VALUES (?, ?, ?, ?)`,
      ["IS001", "Andrés Gómez", "andres@uni.edu", sistemas.id]
    );
    await db.runAsync(
      `INSERT INTO students (code, name, email, program_id) VALUES (?, ?, ?, ?)`,
      ["IS002", "Natalia Pérez", "natalia@uni.edu", sistemas.id]
    );
  }

  if (diseno?.id) {
    await db.runAsync(
      `INSERT INTO students (code, name, email, program_id) VALUES (?, ?, ?, ?)`,
      ["DG001", "Sofía Martínez", "sofia@uni.edu", diseno.id]
    );
  }
};

export const getPrograms = async (): Promise<(Program & { total_students: number })[]> => {
  return await db.getAllAsync(
    `SELECT 
      p.id,
      p.code,
      p.name,
      COUNT(s.id) as total_students
     FROM programs p
     LEFT JOIN students s ON s.program_id = p.id
     GROUP BY p.id
     ORDER BY p.name ASC`
  );
};

export const createProgram = async (code: string, name: string) => {
  return await db.runAsync(
    `INSERT INTO programs (code, name) VALUES (?, ?)`,
    [code, name]
  );
};

export const updateProgram = async (id: number, code: string, name: string) => {
  return await db.runAsync(
    `UPDATE programs SET code = ?, name = ? WHERE id = ?`,
    [code, name, id]
  );
};

export const deleteProgram = async (id: number) => {
  const result = await db.getFirstAsync<{ total: number }>(
    `SELECT COUNT(*) as total FROM students WHERE program_id = ?`,
    [id]
  );

  if ((result?.total ?? 0) > 0) {
    throw new Error("No se puede eliminar un programa con estudiantes.");
  }

  return await db.runAsync(`DELETE FROM programs WHERE id = ?`, [id]);
};

export const getStudentsByProgram = async (
  programId: number,
  search: string
): Promise<Student[]> => {
  return await db.getAllAsync(
    `SELECT 
      s.id,
      s.code,
      s.name,
      s.email,
      s.program_id,
      p.name as program_name
     FROM students s
     INNER JOIN programs p ON p.id = s.program_id
     WHERE s.program_id = ?
       AND (s.name LIKE ? OR s.code LIKE ?)
     ORDER BY s.name ASC`,
    [programId, `%${search}%`, `%${search}%`]
  );
};

export const createStudent = async (
  code: string,
  name: string,
  email: string,
  programId: number
) => {
  return await db.runAsync(
    `INSERT INTO students (code, name, email, program_id) VALUES (?, ?, ?, ?)`,
    [code, name, email, programId]
  );
};

export const updateStudent = async (
  id: number,
  code: string,
  name: string,
  email: string,
  programId: number
) => {
  return await db.runAsync(
    `UPDATE students 
     SET code = ?, name = ?, email = ?, program_id = ?
     WHERE id = ?`,
    [code, name, email, programId, id]
  );
};

export const deleteStudent = async (id: number) => {
  return await db.runAsync(`DELETE FROM students WHERE id = ?`, [id]);
};

export default db;