// File: apps/mobile/app/UserFormModal.tsx
import { useState, useEffect }
from 'react';
import { Modal, View, Text, TextInput, Button, StyleSheet, ScrollView, Platform } from 'react-native';
import RNPickerSelect from 'react-native-picker-select';

const initialFormData = {
  first_name: '', paternal_last_name: '', maternal_last_name: '', email: '',
  password: '', role: 'Conductor carga pesada', dni: '', drivers_license: '', date_of_birth: ''
};

export const UserFormModal = ({ isOpen, onClose, onSubmit, userToEdit, isLoading }: any) => {
  const [formData, setFormData] = useState(initialFormData);
  const isEditMode = !!userToEdit;

  useEffect(() => {
    if (isOpen) {
      if (userToEdit) setFormData({ ...userToEdit, password: '' });
      else setFormData(initialFormData);
    }
  }, [isOpen, userToEdit]);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = () => {
    // Aquí puedes añadir validaciones si quieres
    onSubmit(formData, formData.password.length > 0);
  };

  return (
    <Modal visible={isOpen} onRequestClose={onClose} animationType="slide">
      <ScrollView style={styles.container}>
        <Text style={styles.title}>{isEditMode ? 'Editar Usuario' : 'Crear Usuario'}</Text>

        <Text style={styles.label}>Nombres</Text>
        <TextInput style={styles.input} value={formData.first_name} onChangeText={(val) => handleChange('first_name', val)} />
        
        <Text style={styles.label}>Apellido Paterno</Text>
        <TextInput style={styles.input} value={formData.paternal_last_name} onChangeText={(val) => handleChange('paternal_last_name', val)} />

        <Text style={styles.label}>Apellido Materno</Text>
        <TextInput style={styles.input} value={formData.maternal_last_name} onChangeText={(val) => handleChange('maternal_last_name', val)} />

        <Text style={styles.label}>Correo Electrónico</Text>
        <TextInput style={styles.input} value={formData.email} onChangeText={(val) => handleChange('email', val)} keyboardType="email-address" autoCapitalize="none" editable={!isEditMode} />
        
        <Text style={styles.label}>{isEditMode ? 'Nueva Contraseña (Opcional)' : 'Contraseña'}</Text>
        <TextInput style={styles.input} secureTextEntry value={formData.password} onChangeText={(val) => handleChange('password', val)} placeholder={isEditMode ? "Dejar en blanco para no cambiar" : ""} />

        <Text style={styles.label}>Rol</Text>
        <RNPickerSelect
            onValueChange={(value) => handleChange('role', value)}
            items={[
              { label: 'Gerente', value: 'Gerente' },
              { label: 'Administrador', value: 'Administrador' },
              { label: 'Conductor carga pesada', value: 'Conductor carga pesada' },
            ]}
            value={formData.role}
            style={pickerSelectStyles}
        />

        <Text style={styles.label}>DNI</Text>
        <TextInput style={styles.input} value={formData.dni} onChangeText={(val) => handleChange('dni', val)} keyboardType="numeric" />
        
        <Text style={styles.label}>Brevete (Opcional)</Text>
        <TextInput style={styles.input} value={formData.drivers_license || ''} onChangeText={(val) => handleChange('drivers_license', val)} />

        <Text style={styles.label}>Fecha de Nacimiento</Text>
        <TextInput style={styles.input} value={formData.date_of_birth} onChangeText={(val) => handleChange('date_of_birth', val)} placeholder="YYYY-MM-DD" />


        <View style={styles.actions}>
          <Button title="Cancelar" onPress={onClose} color="#666" />
          <Button title={isLoading ? "Guardando..." : "Guardar"} onPress={handleSubmit} disabled={isLoading} />
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 20, paddingHorizontal: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  label: { fontSize: 16, marginBottom: 5, color: '#333' },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
  },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 30, marginBottom: 50 },
});

const pickerSelectStyles = StyleSheet.create({
    inputIOS: { ...styles.input },
    inputAndroid: { ...styles.input },
});