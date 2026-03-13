import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Student,
  getStudentsByProgram,
  createStudent,
  updateStudent,
  deleteStudent,
} from "../../database/db";
import { estudiantesStyles as styles } from "../../styles/estudiantesStyles";

export default function EstudiantesScreen() {
  const params = useLocalSearchParams();
  const programId = Number(params.programId);
  const programName = String(params.programName ?? "Programa");

  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<number | null>(null);

  const loadStudents = async () => {
    try {
      if (!programId || Number.isNaN(programId)) return;
      const data = await getStudentsByProgram(programId, search);
      setStudents(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los estudiantes.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadStudents();
    }, [programId, search])
  );

  const clearForm = () => {
    setCode("");
    setName("");
    setEmail("");
    setEditingStudentId(null);
  };

  const openCreateModal = () => {
    clearForm();
    setModalVisible(true);
  };

  const openEditModal = (student: Student) => {
    setEditingStudentId(student.id);
    setCode(student.code);
    setName(student.name);
    setEmail(student.email);
    setModalVisible(true);
  };

  const handleSaveStudent = async () => {
    if (!code.trim() || !name.trim() || !email.trim()) {
      Alert.alert("Atención", "Completa código, nombre y email.");
      return;
    }

    try {
      if (editingStudentId) {
        await updateStudent(
          editingStudentId,
          code.trim(),
          name.trim(),
          email.trim(),
          programId
        );
      } else {
        await createStudent(code.trim(), name.trim(), email.trim(), programId);
      }

      clearForm();
      setModalVisible(false);
      loadStudents();
    } catch {
      Alert.alert(
        "Error",
        "No se pudo guardar el estudiante. Revisa si el código ya existe."
      );
    }
  };

  const handleDeleteStudent = (id: number) => {
    Alert.alert("Eliminar estudiante", "¿Seguro que deseas eliminar este estudiante?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteStudent(id);
            loadStudents();
          } catch {
            Alert.alert("Error", "No se pudo eliminar el estudiante.");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{programName}</Text>
      <Text style={styles.subtitle}>Estudiantes del programa</Text>

      <TextInput
        style={styles.searchInput}
        placeholder="Buscar por nombre o código"
        value={search}
        onChangeText={setSearch}
      />

      <TouchableOpacity
        style={styles.openModalButton}
        onPress={openCreateModal}
      >
        <Text style={styles.openModalButtonText}>+ Agregar estudiante</Text>
      </TouchableOpacity>

      <FlatList
        data={students}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 30 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay estudiantes para este programa.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.studentCard}>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentText}>Código: {item.code}</Text>
            <Text style={styles.studentText}>Email: {item.email}</Text>

            <View style={styles.cardActionsRow}>
              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(item)}
              >
                <Text style={styles.editButtonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteStudent(item.id)}
              >
                <Text style={styles.deleteButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingStudentId ? "Editar estudiante" : "Agregar estudiante"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Código"
              value={code}
              onChangeText={setCode}
            />

            <TextInput
              style={styles.input}
              placeholder="Nombre completo"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Correo electrónico"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleSaveStudent}
              >
                <Text style={styles.addButtonText}>
                  {editingStudentId ? "Actualizar" : "Guardar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  clearForm();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}