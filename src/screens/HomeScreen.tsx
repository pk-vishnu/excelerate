import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, SafeAreaView, ActivityIndicator, ScrollView } from 'react-native';
import { parseExcelFile, saveExcelFile } from '../utils/excelParser';
import { Record } from '../types/Record';
import { checkPermission } from '../utils/permissions';
import { TouchableOpacity } from 'react-native';

export default function HomeScreen() {
    const [records, setRecords] = useState<Record[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

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
        const updated = records
            .filter((r) => r.sl_no !== sl_no)
            .map((item, index) => ({ ...item, sl_no: index + 1 }));
        setRecords(updated);
        saveExcelFile(updated, 'data.xlsx');
    }

    const renderTableHeader = () => (
        <View style={styles.tableHeader}>
            <Text style={[styles.headerCell, { flex: 0.5 }]}>#</Text>
            <Text style={[styles.headerCell, { flex: 2 }]}>Item</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Date</Text>
            <Text style={[styles.headerCell, { flex: 3 }]}>Description</Text>
            <Text style={[styles.headerCell, { flex: 1.5 }]}>Actions</Text>
        </View>
    );

    const renderTableRows = () => (
        records.map((item, index) => (
            <View
                key={item.sl_no.toString()}
                style={[
                    styles.tableRow,
                    index % 2 === 0 ? styles.evenRow : styles.oddRow
                ]}
            >
                <Text style={[styles.tableCell, { flex: 0.5 }]}>{item.sl_no}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]}>{item.item}</Text>
                <Text style={[styles.tableCell, { flex: 1.5 }]}>{item.date}</Text>
                <Text style={[styles.tableCell, { flex: 3 }]}>{item.description}</Text>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => console.log('Edit', item)}>
                    <Text style={[styles.tableCell, { color: '#BB86FC' }]}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ flex: 1 }} onPress={() => console.log('Delete', item)} onPressIn={() => handleDelete(item.sl_no)}>
                    <Text style={[styles.tableCell, { color: '#CF6679' }]}>🗑️</Text>
                </TouchableOpacity>
            </View>
        ))
    );

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

        if (records.length === 0) {
            return (
                <View style={styles.centerContainer}>
                    <Text style={styles.emptyText}>No records found</Text>
                </View>
            );
        }

        return (
            <ScrollView style={styles.tableContainer}>
                {renderTableHeader()}
                {renderTableRows()}
            </ScrollView>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#121212" />
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Excelerate</Text>
                <Text style={styles.subHeader}>CRUD + Alerts</Text>
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
    tableRow: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    evenRow: {
        backgroundColor: '#1A1A1A',
    },
    oddRow: {
        backgroundColor: '#222222',
    },
    tableCell: {
        color: '#E1E1E1',
        fontSize: 14,
        paddingHorizontal: 4,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
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
});