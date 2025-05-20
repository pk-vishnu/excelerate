import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { Record } from '../types/Record';
import DatePicker from 'react-native-date-picker';
import { normalizeDate } from '../utils/excelParser';
import { formatDateForDisplay } from '../utils/excelParser';
import { TouchableOpacity } from 'react-native';

interface Props {
    form: Partial<Record>;
    onChange: (form: Partial<Record>) => void;
    onSave: () => void;
    onCancel: () => void;
    isEditing: boolean;
}

export default function RecordForm({ form, onChange, onSave, onCancel, isEditing }: Props) {
    const [open, setOpen] = useState(false);

    // Initialize date state from form.date or current date
    const [date, setDate] = useState(() => {
        if (form.date) {
            const parsedDate = new Date(form.date);
            return !isNaN(parsedDate.getTime()) ? parsedDate : new Date();
        }
        return new Date();
    });

    // Sync date when form.date changes externally
    useEffect(() => {
        if (form.date) {
            const parsedDate = new Date(form.date);
            if (!isNaN(parsedDate.getTime())) {
                setDate(parsedDate);
            }
        }
    }, [form.date]);

    const handleDateConfirm = (selectedDate: Date) => {
        setOpen(false);
        setDate(selectedDate);

        // Convert to ISO string for consistent storage
        const normalizedDate = normalizeDate(selectedDate);
        onChange({ ...form, date: normalizedDate });
    };


    return (
        <View style={styles.formContainer}>
            <Text style={styles.formHeader}>{isEditing ? 'Edit Record' : 'Add Record'}</Text>

            <TextInput
                placeholder="Item"
                value={form.item}
                onChangeText={(text) => onChange({ ...form, item: text })}
                style={styles.input}
                placeholderTextColor="#888"
            />

            <TextInput
                placeholder="Description"
                value={form.description}
                onChangeText={(text) => onChange({ ...form, description: text })}
                style={styles.input}
                placeholderTextColor="#888"
            />


            <View style={styles.dateContainer}>
                <Text style={styles.dateLabel}>Selected Date:</Text>
                <View style={styles.dateRow}>
                    <Text style={styles.dateText}>{formatDateForDisplay(date)}</Text>
                    <TouchableOpacity style={styles.dateButton} onPress={() => setOpen(true)}>
                        <Text style={styles.buttonText}>Select Date</Text>
                    </TouchableOpacity>
                </View>
            </View>


            <DatePicker
                modal
                open={open}
                date={date}
                mode="date"
                onConfirm={handleDateConfirm}
                onCancel={() => setOpen(false)}
            />


            <View style={styles.buttonRow}>
                <Button title={isEditing ? 'Update' : 'Add'} onPress={onSave} color="#BB86FC" />
                {isEditing && (
                    <Button title="Cancel" onPress={onCancel} color="#CF6679" />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    formContainer: {
        padding: 12,
        backgroundColor: '#1F1B24',
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    formHeader: {
        fontSize: 18,
        color: '#BB86FC',
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#444',
        backgroundColor: '#2C2C2C',
        borderRadius: 6,
        padding: 8,
        color: '#fff',
        marginBottom: 8,
        marginLeft: 8,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        marginLeft: 8,
    },
    dateContainer: {
        marginBottom: 16,
        paddingHorizontal: 12,
    },

    dateLabel: {
        fontSize: 14,
        color: '#ccc', // soft gray for dark background
        marginBottom: 4,
    },

    dateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: '#1e1e1e',
        padding: 12,
        borderRadius: 10,
    },

    dateText: {
        fontSize: 16,
        color: '#fff',
        flex: 1,
        marginRight: 10,
    },

    dateButton: {
        backgroundColor: '#3a3a3a',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 6,
    },

    buttonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
    },

});
