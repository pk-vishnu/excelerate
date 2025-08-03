import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { parseExcelFile, saveExcelFile, formatDateForDisplay } from '../utils/excelParser';
import { Record } from '../types/Record';
import { checkPermission } from '../utils/permissions';
import { TouchableOpacity } from 'react-native';
import RecordForm from '../components/RecordForm';
import { Alert } from 'react-native';
import isUpcomingEvent from '../utils/upcomingDate';
import { sortRecords, SortKey, SortDirection } from '../utils/sortRecords';
import isOneMonthOld from '../utils/isOneMonth';

export default function HomeScreen() {
    const [records, setRecords] = useState<Record[]>([]);
    const [form, setForm] = useState<Partial<Record>>({ item: '', date: '', description: '', completed: false });
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [showUpcomingOnly, setShowUpcomingOnly] = useState(false);
    const [sortKey, setSortKey] = useState<SortKey>('date');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    useEffect(() => {
        async function loadData() {
            try {
                setLoading(true);
                const hasPermission = await checkPermission();

                if (hasPermission) {
                    const filename = 'data.xlsx';
                    const data = await parseExcelFile(filename);
                    console.log('Parsed data:', data);
                    setRecords(data);
                } else {
                    setError('Storage permission denied');
                }
            } catch (error) {
                console.error('Error loading data:', error);
                setError('Failed to load data');
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, []);

    function handleDelete(sl_no: number) {
        Alert.alert(
            "Confirm Delete",
            "Are you sure you want to delete this record?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Delete",
                    onPress: () => {
                        const updated = records
                            .filter((r) => r.sl_no !== sl_no)
                            .map((item, index) => ({ ...item, sl_no: index + 1 }));
                        setRecords(updated);
                        saveExcelFile(updated, 'data.xlsx');
                    },
                    style: "destructive"
                }
            ]
        );
    }

    function handleEdit(recordId: number) {
        setIsFormVisible(true);
        const recordToEdit = records.find(r => r.sl_no === recordId);
        if (!recordToEdit) return;
        const index = records.findIndex(r => r.sl_no === recordId);
        setForm({
            item: recordToEdit.item,
            date: recordToEdit.date,
            description: recordToEdit.description
        });
        setEditIndex(index);
    }

    function handleComplete(recordId: number) {
        Alert.alert(
            "Confirm Complete",
            "Are you sure you want to mark this record as completed?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Complete",
                    onPress: () => {
                        const updatedRecords = records.map(record => {
                            if (record.sl_no === recordId) {
                                const toggled = { ...record, completed: !record.completed };
                                return toggled;
                            }
                            return record;
                        });
                        setRecords(updatedRecords);
                        setSortKey('completed');
                        setSortDirection('desc');
                        saveExcelFile(updatedRecords, 'data.xlsx');
                    },
                    style: "default"
                }
            ]
        )
    }

    function handleSave() {
        if (!form.item || !form.date || !form.description) {
            Alert.alert('All fields are required.');
            return;
        }

        const updatedRecords = [...records];

        if (editIndex !== null) {
            // Edit existing
            updatedRecords[editIndex] = {
                ...updatedRecords[editIndex],
                item: form.item || '',
                date: form.date || '',
                description: form.description || '',
            };
        } else {
            // Add new
            updatedRecords.push({
                sl_no: updatedRecords.length + 1,
                item: form.item || '',
                date: form.date || '',
                description: form.description || '',
                completed: false,
            });
        }

        setRecords(updatedRecords);
        setForm({ item: '', date: '', description: '' });
        setEditIndex(null);

        // Save to Excel
        try {
            saveExcelFile(updatedRecords, 'data.xlsx')
                .then(() => {
                    Alert.alert(
                        editIndex !== null ? "Record Updated" : "Record Added",
                        editIndex !== null ? "The record has been updated successfully." : "A new record has been added successfully."
                    );
                })
                .catch(error => {
                    console.error("Error saving file:", error);
                    Alert.alert("Error", "Failed to save data to Excel.");
                });
        } catch (error) {
            console.error("Error saving file:", error);
            Alert.alert("Error", "Failed to save data to Excel.");
        }
        setIsFormVisible(false);
    }

    function handleCancel() {
        setForm({ item: '', date: '', description: '' });
        setEditIndex(null);
        setIsFormVisible(false);
    }

    function handleSort(field: keyof Record) {
        if (sortKey === field) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortKey(field);
            setSortDirection('asc');
        }
    }

    const renderForm = () => (

        <RecordForm
            form={form}
            onChange={setForm}
            onSave={handleSave}
            onCancel={handleCancel}
            isEditing={editIndex !== null}
        />
    );

    const renderTableHeader = () => (
        <View style={styles.tableHeader}>
            <TouchableOpacity
                onPress={() => handleSort('item')}
                style={{ flex: 1.5 }}
            >
                <Text style={styles.headerCell}>
                    Item {sortKey === 'item' && (sortDirection === 'asc' ? '⬆️' : '⬇️')}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => handleSort('date')}
                style={{ flex: 2 }}
            >
                <Text style={styles.headerCell}>
                    Date {sortKey === 'date' && (sortDirection === 'asc' ? '⬆️' : '⬇️')}
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                onPress={() => handleSort('description')}
                style={{ flex: 3 }}
            >
                <Text style={styles.headerCell}>
                    Description {sortKey === 'description' && (sortDirection === 'asc' ? '⬆️' : '⬇️')}
                </Text>
            </TouchableOpacity>

            <Text style={[styles.headerCell, { flex: 2 }]}>Actions</Text>
        </View>
    );

    const renderTableRows = () => {
        const filteredRecords = records
            .filter(
                record => !(record.completed === true && isOneMonthOld(record.date))
            )
            .filter(
                record => showUpcomingOnly ? isUpcomingEvent(record.date) && record.completed === false : true
            );

        const displayRecords = sortRecords(filteredRecords, sortKey, sortDirection);
        if (displayRecords.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>
                        {showUpcomingOnly
                            ? "No upcoming events in the next 2 days"
                            : "No records found"}
                    </Text>
                </View>
            );
        }

        return displayRecords.map((item, index) => (
            <View
                key={item.sl_no.toString()}
                style={[
                    isUpcomingEvent(item.date) ? styles.tableRowUpcoming : styles.tableRowNormal,
                    item.completed && { backgroundColor: '#225522' },
                ]}
            >
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.item}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{formatDateForDisplay(item.date)}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.description}</Text>
                <View style={[styles.actionContainer, { flex: 3 }]}>
                    <TouchableOpacity
                        onPress={() => handleEdit(item.sl_no)}
                        style={styles.actionButton}
                    >
                        <Text style={styles.actionText}>✏️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleDelete(item.sl_no)}
                        style={styles.actionButton}
                    >
                        <Text style={styles.actionText}>🗑️</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => handleComplete(item.sl_no)}
                        style={styles.actionButton}
                    >
                        <Text style={styles.actionText}>
                            {item.completed ? '✅' : '⭕'}
                        </Text>
                    </TouchableOpacity>

                </View>
            </View>
        ));
    };

    const renderContent = () => {
        if (loading) {
            return (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color="#BB86FC" />
                    <Text style={styles.loadingText}>Loading data...</Text>
                </View>
            );
        }

        if (error) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.tableContainer}>
                <View style={styles.buttonRow}>
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={toggleForm}
                    >
                        <Text style={styles.buttonText}>
                            {isFormVisible ? "Hide Form" : "Add New Record"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[
                            styles.filterButton,
                            showUpcomingOnly && styles.filterButtonActive
                        ]}
                        onPress={() => setShowUpcomingOnly(!showUpcomingOnly)}
                    >
                        <Text style={styles.filterButtonText}>
                            {showUpcomingOnly ? "Show All" : "Overdue Tasks"}
                        </Text>
                    </TouchableOpacity>
                </View>
                {isFormVisible && renderForm()}
                {records.length === 0 ? (
                    <View style={styles.centerContainer}>
                        <Text style={styles.emptyText}>No records found</Text>
                    </View>
                ) : (
                    <>
                        {renderTableHeader()}
                        {renderTableRows()}
                    </>
                )}
            </ScrollView>
        );
    };

    const toggleForm = () => {
        setIsFormVisible(!isFormVisible);
    }
    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Excelerate</Text>
                <Text style={styles.subHeader}>Excel CRUD + Alerts</Text>
            </View>
            {renderContent()}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
        width: '100%',
    },
    headerContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 4,
    },
    subHeader: {
        fontSize: 14,
        color: '#BB86FC',
        opacity: 0.8,
    },
    // Table styles
    tableContainer: {
        flex: 1,
        width: '100%',
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#2C2C2C',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 2,
        borderBottomColor: '#444',
    },
    headerCell: {
        color: '#BB86FC',
        fontWeight: 'bold',
        fontSize: 14,
        paddingHorizontal: 4,
    },
    tableRowNormal: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    tableRowUpcoming: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#BB86FC',
        backgroundColor: '#542125',
    },
    tableCell: {
        color: '#E1E1E1',
        fontSize: 14,
        paddingHorizontal: 4,
    },
    actionContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    actionButton: {
        padding: 4,
    },
    actionText: {
        fontSize: 16,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        minHeight: 200,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#BB86FC',
    },
    errorText: {
        fontSize: 16,
        color: '#CF6679',
        textAlign: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: '#aaa',
        textAlign: 'center',
    },
    addButton: {
        backgroundColor: '#BB86FC',
        padding: 12,
        borderRadius: 8,
        margin: 16,
        alignItems: 'center',
    },
    buttonText: {
        color: '#121212',
        fontWeight: 'bold',
        fontSize: 16,
    },
    filterButton: {
        flex: 1,
        backgroundColor: '#333',
        padding: 10,
        borderRadius: 6,
        margin: 16,
        alignItems: 'center',
    },
    filterButtonActive: {
        backgroundColor: '#BB86FC',
    },
    filterButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    }
});