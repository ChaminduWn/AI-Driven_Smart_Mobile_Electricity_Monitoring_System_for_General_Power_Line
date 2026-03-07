import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../theme';
import { useAuth } from '../context/AuthContext';
import Ionicons from 'react-native-vector-icons/Ionicons';

export const AccountScreen = ({ navigation }) => {
    const { user, logout } = useAuth();

    const menuItems = [
        { id: 'profile', title: 'Profile Settings', icon: 'person-outline', screen: 'ProfileSettings' },
        { id: 'about', title: 'About Us', icon: 'information-circle-outline', screen: 'AboutUs' },
        { id: 'help', title: 'Help & Support', icon: 'headset-outline', screen: 'HelpSupport' },
    ];

    const handleLogout = () => {
        Alert.alert('Logout', 'Are you sure you want to logout?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', style: 'destructive', onPress: logout },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Account</Text>
            </View>

            {/* User Card */}
            <View style={styles.userCard}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={28} color={theme.colors.primary} />
                </View>
                <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user?.firstName} {user?.lastName}</Text>
                    <Text style={styles.userEmail}>{user?.email}</Text>
                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>
                            {user?.role === 'Electrician' ? '00E' : '00H'}#{user?.displayId || '1'}
                        </Text>
                    </View>
                </View>
            </View>

            {/* Document Verification Section (Electricians Only) */}
            {user?.role === 'Electrician' && (
                <View style={styles.documentCard}>
                    <View style={styles.documentHeader}>
                        <Ionicons name="document-text-outline" size={20} color={theme.colors.text} />
                        <Text style={styles.documentTitle}>KYC Document</Text>
                        <View style={[styles.statusBadge, { backgroundColor: user?.isVerified ? theme.colors.success + '20' : theme.colors.warning + '20' }]}>
                            <Text style={[styles.statusText, { color: user?.isVerified ? theme.colors.success : theme.colors.warning }]}>
                                {user?.isVerified ? 'Verified' : 'Pending Review'}
                            </Text>
                        </View>
                    </View>
                    {user?.nvqCertificateUrl ? (
                        <Image
                            source={{ uri: `http://192.168.8.101:8003${user.nvqCertificateUrl}` }}
                            style={styles.documentImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <Text style={styles.noDocText}>No document uploaded.</Text>
                    )}
                </View>
            )}

            {/* Menu */}
            <View style={styles.menuContainer}>
                {menuItems.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={styles.menuItem}
                        onPress={() => navigation.navigate(item.screen)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.menuIconContainer}>
                            <Ionicons name={item.icon} size={22} color={theme.colors.primary} />
                        </View>
                        <Text style={styles.menuTitle}>{item.title}</Text>
                        <Ionicons name="chevron-forward" size={20} color={theme.colors.textMuted} />
                    </TouchableOpacity>
                ))}

                {/* Logout */}
                <TouchableOpacity
                    style={[styles.menuItem, styles.logoutItem]}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <View style={[styles.menuIconContainer, { backgroundColor: theme.colors.danger + '15' }]}>
                        <Ionicons name="log-out-outline" size={22} color={theme.colors.danger} />
                    </View>
                    <Text style={[styles.menuTitle, { color: theme.colors.danger }]}>Logout</Text>
                    <Ionicons name="chevron-forward" size={20} color={theme.colors.danger} />
                </TouchableOpacity>
            </View>

            {/* App Version */}
            <Text style={styles.version}>PowerLink v1.0.0</Text>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    headerTitle: { ...theme.typography.h2 },
    userCard: {
        flexDirection: 'row', padding: theme.spacing.lg, marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.lg,
        backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center',
    },
    avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
    userInfo: { flex: 1 },
    userName: { ...theme.typography.h3 },
    userEmail: { ...theme.typography.caption, marginTop: 2 },
    idBadge: { alignSelf: 'flex-start', marginTop: 6, backgroundColor: theme.colors.primary + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: theme.borderRadius.xs },
    idText: { color: theme.colors.primary, fontSize: 11, fontWeight: '700' },
    documentCard: { marginHorizontal: theme.spacing.lg, marginTop: theme.spacing.md, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.lg, padding: theme.spacing.md, borderWidth: 1, borderColor: theme.colors.border },
    documentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
    documentTitle: { ...theme.typography.body, fontWeight: '600', marginLeft: 8, flex: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.borderRadius.sm },
    statusText: { fontSize: 12, fontWeight: '700' },
    documentImage: { width: '100%', height: 160, borderRadius: theme.borderRadius.md, marginTop: theme.spacing.sm, backgroundColor: theme.colors.background },
    noDocText: { ...theme.typography.caption, color: theme.colors.textMuted, fontStyle: 'italic', marginTop: theme.spacing.xs },
    menuContainer: { padding: theme.spacing.lg },
    menuItem: {
        flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface,
        padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.sm,
        borderWidth: 1, borderColor: theme.colors.border,
    },
    menuIconContainer: { width: 40, height: 40, borderRadius: theme.borderRadius.md, backgroundColor: theme.colors.primary + '15', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    menuTitle: { ...theme.typography.body, fontWeight: '600', flex: 1 },
    logoutItem: { marginTop: theme.spacing.md, borderColor: theme.colors.danger + '30' },
    version: { ...theme.typography.caption, textAlign: 'center', marginTop: 'auto', marginBottom: theme.spacing.xl },
});
