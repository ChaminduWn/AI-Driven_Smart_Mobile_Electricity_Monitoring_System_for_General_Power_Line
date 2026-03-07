import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { Card } from '../components/Card';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { useAuth } from '../context/AuthContext';
import { ActivityIndicator, Alert } from 'react-native';

export const ActivitiesScreen = ({ navigation }) => {
    const { user } = useAuth();
    const [activities, setActivities] = React.useState([]);
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchHistory = async () => {
            if (!user?.id) return;
            try {
                // Must ensure API URL targets standard localhost for ADB forwarding hook
                const response = await fetch(`http://192.168.8.101:8003/api/jobs/history/${user.id}`);
                const data = await response.json();
                if (data.success) {
                    setActivities(data.jobs);
                } else {
                    Alert.alert('Error', data.message || 'Failed to fetch history');
                }
            } catch (error) {
                console.error('Fetch history error', error);
                Alert.alert('Error', 'Could not connect to the server');
            } finally {
                setLoading(false);
            }
        };

        // Reload history every time screen comes into focus
        const unsubscribe = navigation.addListener('focus', () => {
            fetchHistory();
        });

        return unsubscribe;
    }, [user?.id, navigation]);
    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return theme.colors.success;
            case 'Ongoing': return theme.colors.warning;
            case 'Cancelled': return theme.colors.danger;
            default: return theme.colors.textMuted;
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Completed': return 'checkmark-circle';
            case 'Ongoing': return 'time';
            case 'Cancelled': return 'close-circle';
            default: return 'ellipse';
        }
    };

    const renderItem = ({ item }) => (
        <Card
            style={styles.card}
            onPress={() => navigation.navigate('ActivityDetail', { activity: item })}
        >
            <View style={styles.cardTop}>
                <View style={styles.typeInfo}>
                    <Text style={styles.issueType}>{item.category || item.title}</Text>
                    <Text style={styles.subType}>{item.subCategory || 'General Service'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '15' }]}>
                    <Ionicons name={getStatusIcon(item.status)} size={14} color={getStatusColor(item.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
            </View>

            <View style={styles.cardBottom}>
                <View style={styles.detailItem}>
                    <Ionicons name="person-outline" size={14} color={theme.colors.textMuted} />
                    <Text style={styles.detailText}>{user?.role === 'Electrician' ? 'Client ID: ' + item.householderId.substring(0, 4) : 'Tech ID: ' + (item.electricianId ? item.electricianId.substring(0, 4) : 'Pending')}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
                    <Text style={styles.detailText}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
                {item.finalCost || item.estimatedCost ? (
                    <Text style={styles.amount}>LKR {item.finalCost || item.estimatedCost}</Text>
                ) : null}
            </View>

            {item.rating && (
                <View style={styles.ratingRow}>
                    {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons key={s} name={s <= item.rating ? 'star' : 'star-outline'} size={14} color={theme.colors.warning} />
                    ))}
                    <Text style={styles.ratingText}>{item.rating}</Text>
                </View>
            )}
        </Card>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Activities</Text>
                <Text style={styles.headerSubtitle}>Your service history</Text>
            </View>
            {loading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={theme.colors.primary} />
                </View>
            ) : activities.length > 0 ? (
                <FlatList
                    data={activities}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Ionicons name="document-text-outline" size={64} color={theme.colors.textMuted} style={{ marginBottom: 16 }} />
                    <Text style={{ ...theme.typography.body, color: theme.colors.textSecondary }}>No past activities found.</Text>
                </View>
            )}
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
    },
    headerTitle: { ...theme.typography.h2 },
    headerSubtitle: { ...theme.typography.caption, marginTop: 2 },
    list: { padding: theme.spacing.md, paddingBottom: 100 },
    card: { marginBottom: theme.spacing.sm },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
    typeInfo: { flex: 1 },
    issueType: { ...theme.typography.body, fontWeight: '700' },
    subType: { ...theme.typography.caption, marginTop: 2 },
    statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: theme.borderRadius.sm },
    statusText: { fontSize: 12, fontWeight: '700', marginLeft: 4 },
    cardBottom: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12 },
    detailItem: { flexDirection: 'row', alignItems: 'center' },
    detailText: { ...theme.typography.caption, marginLeft: 4 },
    amount: { ...theme.typography.body, color: theme.colors.success, fontWeight: '700', marginLeft: 'auto' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.colors.border },
    ratingText: { color: theme.colors.warning, fontSize: 13, fontWeight: '700', marginLeft: 6 },
});
