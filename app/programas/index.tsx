import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import {
  Program,
  getPrograms,
  createProgram,
  updateProgram,
  deleteProgram,
} from "../../database/db";
import { programasStyles as styles } from "../../styles/programasStyles";

type ProgramWithCount = Program & { total_students: number };

export default function ProgramasScreen() {
  const router = useRouter();
  const [programs, setPrograms] = useState<ProgramWithCount[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProgramId, setEditingProgramId] = useState<number | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");

  const loadPrograms = async () => {
    try {
      const data = await getPrograms();
      setPrograms(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los programas.");
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadPrograms();
    }, [])
  );

  const clearForm = () => {
    setCode("");
    setName("");
    setEditingProgramId(null);
  };

  const openCreateModal = () => {
    clearForm();
    setModalVisible(true);
  };

  const openEditModal = (program: ProgramWithCount) => {
    setEditingProgramId(program.id);
    setCode(program.code);
    setName(program.name);
    setModalVisible(true);
  };

  const handleSaveProgram = async () => {
    if (!code.trim() || !name.trim()) {
      Alert.alert("Atención", "Debes completar código y nombre.");
      return;
    }

    try {
      if (editingProgramId) {
        await updateProgram(editingProgramId, code.trim(), name.trim());
      } else {
        await createProgram(code.trim(), name.trim());
      }

      clearForm();
      setModalVisible(false);
      loadPrograms();
    } catch {
      Alert.alert(
        "Error",
        "No se pudo guardar el programa. Revisa si el código ya existe."
      );
    }
  };

  const handleDeleteProgram = (id: number) => {
    Alert.alert("Eliminar programa", "¿Seguro que quieres eliminar este programa?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteProgram(id);
            loadPrograms();
          } catch (error: any) {
            Alert.alert("No permitido", error.message);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Programas universitarios</Text>
      <Text style={styles.subtitle}>Selecciona un programa para ver sus estudiantes</Text>

      <TouchableOpacity style={styles.addButton} onPress={openCreateModal}>
        <Text style={styles.addButtonText}>+ Agregar programa</Text>
      </TouchableOpacity>

      <FlatList
        data={programs}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay programas registrados.</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.programName}>{item.name}</Text>
                <Text style={styles.programCode}>Código: {item.code}</Text>
                <Text style={styles.programCount}>Estudiantes: {item.total_students}</Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() =>
                  router.push({
                    pathname: "/estudiantes",
                    params: {
                      programId: String(item.id),
                      programName: item.name,
                    },
                  })
                }
              >
                <Text style={styles.buttonText}>Estudiantes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.editButton}
                onPress={() => openEditModal(item)}
              >
                <Text style={styles.buttonText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => handleDeleteProgram(item.id)}
              >
                <Text style={styles.buttonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingProgramId ? "Editar programa" : "Nuevo programa"}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="Código del programa"
              value={code}
              onChangeText={setCode}
            />

            <TextInput
              style={styles.input}
              placeholder="Nombre del programa"
              value={name}
              onChangeText={setName}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSaveProgram}>
                <Text style={styles.buttonText}>
                  {editingProgramId ? "Actualizar" : "Guardar"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  clearForm();
                  setModalVisible(false);
                }}
              >
                <Text style={styles.buttonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}