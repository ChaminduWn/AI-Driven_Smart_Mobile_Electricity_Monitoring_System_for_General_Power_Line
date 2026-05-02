import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Image,
} from 'react-native';
import { 
    User, Mail, Phone, MapPin, Hash, Save, Plus, 
    Trash2, Home, ArrowLeft, Camera, Calendar, Lock 
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api/authAPI';
import { householdAPI } from '../api/householdAPI';
import { COLORS, FONTS } from '../utils/theme';

const ProfileScreen = ({ navigation }) => {
    const { user, refreshUser } = useAuth();

    // Profile State
    const [profile, setProfile] = useState({
        full_name: user?.full_name || '',
        username: user?.username || '',
        email: user?.email || '',
        phone_number: user?.phone_number || '',
        birthday: user?.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
        address: user?.address || '',
        city: user?.city || '',
        country: user?.country || 'Sri Lanka',
        default_account_number: user?.default_account_number || '',
        profile_image: user?.profile_image || null,
        new_password: '',
    });

    // Household Members State
    const [members, setMembers] = useState([]);
    const [isLoadingMembers, setIsLoadingMembers] = useState(false);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [showAddMember, setShowAddMember] = useState(false);
    const [newMember, setNewMember] = useState({
        member_type: 'adult_male',
        age: '',
        occupation_status: 'Working',
    });

    const memberTypes = [
        { code: 'newborn', label: 'Newborn' },
        { code: 'toddler', label: 'Toddler' },
        { code: 'school_boy', label: 'School Boy' },
        { code: 'school_girl', label: 'School Girl' },
        { code: 'adult_male', label: 'Adult Male' },
        { code: 'adult_female', label: 'Adult Female' },
        { code: 'elder_male', label: 'Elderly Male' },
        { code: 'elder_female', label: 'Elderly Female' },
    ];

    useEffect(() => {
        const acctNum = profile.default_account_number || user?.default_account_number;
        if (acctNum) {
            fetchMembers(acctNum);
        }
    }, [user?.default_account_number]);

    const fetchMembers = async (accountNumber) => {
        if (!accountNumber) return;
        setIsLoadingMembers(true);
        try {
            const res = await householdAPI.getMembers(accountNumber);
            if (res.data.success) {
                setMembers(res.data.members);
            }
        } catch (error) {
            console.error('Fetch members error:', error);
        } finally {
            setIsLoadingMembers(false);
        }
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
            base64: true,
        });

        if (!result.canceled) {
            const base64Img = `data:image/jpeg;base64,${result.assets[0].base64}`;
            setProfile({ ...profile, profile_image: base64Img });
        }
    };

    const handleUpdateProfile = async () => {
        setIsUpdatingProfile(true);
        try {
            // Validate birthday if provided
            const updatePayload = { ...profile };
            if (updatePayload.birthday === '') delete updatePayload.birthday;
            if (updatePayload.new_password === '') delete updatePayload.new_password;

            await authAPI.updateProfile(updatePayload);
            await refreshUser();
            Alert.alert('Success', 'Profile updated successfully');
        } catch (error) {
            const msg = error.response?.data?.detail || 'Failed to update profile';
            Alert.alert('Error', msg);
            console.error('Update profile error:', error);
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handleAddMember = async () => {
        if (!newMember.age) {
            Alert.alert('Error', 'Please enter age');
            return;
        }
        const acctNum = profile.default_account_number || user?.default_account_number;
        if (!acctNum) {
            Alert.alert('Error', 'Please save your account number first');
            return;
        }
        try {
            await householdAPI.addMember({
                ...newMember,
                age: parseInt(newMember.age),
                account_number: acctNum,
            });
            setShowAddMember(false);
            setNewMember({ member_type: 'adult_male', age: '', occupation_status: 'Working' });
            fetchMembers(acctNum);
        } catch (error) {
            Alert.alert('Error', 'Failed to add member');
        }
    };

    const handleDeleteMember = async (id) => {
        const acctNum = profile.default_account_number || user?.default_account_number;
        
        universalAlert('Delete Member', 'Are you sure you want to remove this member from your household?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Delete', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await householdAPI.deleteMember(id);
                        fetchMembers(acctNum);
                    } catch (error) {
                        universalAlert('Error', 'Failed to delete member');
                    }
                }
            }
        ]);
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={styles.topHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.title}>Edit Profile</Text>
                <TouchableOpacity
                    style={styles.saveBtn}
                    onPress={handleUpdateProfile}
                    disabled={isUpdatingProfile}
                >
                    {isUpdatingProfile ? (
                        <ActivityIndicator size="small" color={COLORS.primary} />
                    ) : (
                        <Text style={styles.saveBtnText}>Save</Text>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Avatar Section */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper}>
                        {profile.profile_image ? (
                            <Image source={{ uri: profile.profile_image }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <User size={40} color={COLORS.textMuted} />
                            </View>
                        )}
                        <View style={styles.cameraBadge}>
                            <Camera size={14} color={COLORS.white} />
                        </View>
                    </TouchableOpacity>
                    <Text style={styles.userNameText}>{profile.full_name || 'Your Name'}</Text>
                    <Text style={styles.userEmailText}>{profile.email}</Text>
                </View>

                {/* Personal Details Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <User size={20} color={COLORS.primary} />
                        <Text style={styles.sectionTitle}>Personal Details</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Full Name</Text>
                        <View style={styles.inputContainer}>
                            <User size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={profile.full_name}
                                onChangeText={(text) => setProfile({ ...profile, full_name: text })}
                                placeholder="Full Name"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>Username</Text>
                            <View style={styles.inputContainer}>
                                <TextInput
                                    style={styles.input}
                                    value={profile.username}
                                    onChangeText={(text) => setProfile({ ...profile, username: text })}
                                    autoCapitalize="none"
                                    placeholder="username"
                                    placeholderTextColor={COLORS.textMuted}
                                />
                            </View>
                        </View>
                        <View style={[styles.inputGroup, { flex: 1.2, marginLeft: 8 }]}>
                            <Text style={styles.label}>Birthday</Text>
                            <View style={styles.inputContainer}>
                                <Calendar size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    value={profile.birthday}
                                    onChangeText={(text) => setProfile({ ...profile, birthday: text })}
                                    placeholder="YYYY-MM-DD"
                                    placeholderTextColor={COLORS.textMuted}
                                />
                            </View>
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email Address</Text>
                        <View style={styles.inputContainer}>
                            <Mail size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={profile.email}
                                onChangeText={(text) => setProfile({ ...profile, email: text })}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                placeholder="Email"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Phone Number</Text>
                        <View style={styles.inputContainer}>
                            <Phone size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={profile.phone_number}
                                onChangeText={(text) => setProfile({ ...profile, phone_number: text })}
                                keyboardType="phone-pad"
                                placeholder="Phone"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                    </View>
                </View>

                {/* Location & Energy Details */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Hash size={20} color={COLORS.secondary} />
                        <Text style={styles.sectionTitle}>Energy & Location</Text>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Electricity Account Number</Text>
                        <View style={styles.inputContainer}>
                            <Hash size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={profile.default_account_number}
                                onChangeText={(text) => setProfile({ ...profile, default_account_number: text })}
                                placeholder="Account Number"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Address</Text>
                        <View style={styles.inputContainer}>
                            <MapPin size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={profile.address}
                                onChangeText={(text) => setProfile({ ...profile, address: text })}
                                placeholder="Address"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                    </View>

                    <View style={styles.row}>
                        <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                            <Text style={styles.label}>City</Text>
                            <TextInput
                                style={styles.smallInput}
                                value={profile.city}
                                onChangeText={(text) => setProfile({ ...profile, city: text })}
                                placeholder="City"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                        <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                            <Text style={styles.label}>Country</Text>
                            <TextInput
                                style={styles.smallInput}
                                value={profile.country}
                                onChangeText={(text) => setProfile({ ...profile, country: text })}
                                placeholder="Country"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                    </View>
                </View>

                {/* Security Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Lock size={20} color={COLORS.danger} />
                        <Text style={styles.sectionTitle}>Security</Text>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>New Password</Text>
                        <View style={styles.inputContainer}>
                            <Lock size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                            <TextInput
                                style={styles.input}
                                value={profile.new_password}
                                onChangeText={(text) => setProfile({ ...profile, new_password: text })}
                                secureTextEntry
                                placeholder="Leave blank to keep current"
                                placeholderTextColor={COLORS.textMuted}
                            />
                        </View>
                    </View>
                </View>

                {/* Household Members Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Home size={20} color={COLORS.success} />
                        <Text style={styles.sectionTitle}>Household Members</Text>
                        <TouchableOpacity
                            style={styles.addBtn}
                            onPress={() => setShowAddMember(!showAddMember)}
                        >
                            <Plus size={20} color={COLORS.white} />
                        </TouchableOpacity>
                    </View>

                    {showAddMember && (
                        <View style={styles.addMemberCard}>
                            <Text style={styles.cardTitle}>Add Family Member</Text>
                            <View style={styles.memberTypeGrid}>
                                {memberTypes.map((type) => (
                                    <TouchableOpacity
                                        key={type.code}
                                        style={[
                                            styles.typeTag,
                                            newMember.member_type === type.code && styles.typeTagActive
                                        ]}
                                        onPress={() => setNewMember({ ...newMember, member_type: type.code })}
                                    >
                                        <Text style={[
                                            styles.typeTagText,
                                            newMember.member_type === type.code && styles.typeTagTextActive
                                        ]}>{type.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <View style={styles.row}>
                                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                    <Text style={styles.labelSmall}>Age</Text>
                                    <TextInput
                                        style={styles.smallInput}
                                        value={newMember.age}
                                        onChangeText={(text) => setNewMember({ ...newMember, age: text })}
                                        keyboardType="numeric"
                                        placeholder="Age"
                                        placeholderTextColor={COLORS.textMuted}
                                    />
                                </View>
                                <View style={[styles.inputGroup, { flex: 2, marginLeft: 8 }]}>
                                    <Text style={styles.labelSmall}>Occupation</Text>
                                    <TextInput
                                        style={styles.smallInput}
                                        value={newMember.occupation_status}
                                        onChangeText={(text) => setNewMember({ ...newMember, occupation_status: text })}
                                        placeholder="Working/Student"
                                        placeholderTextColor={COLORS.textMuted}
                                    />
                                </View>
                            </View>
                            <TouchableOpacity style={styles.submitMemberBtn} onPress={handleAddMember}>
                                <Text style={styles.submitMemberBtnText}>Add Member</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isLoadingMembers ? (
                        <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: 20 }} />
                    ) : members.length === 0 ? (
                        <View style={styles.emptyMembers}>
                            <Text style={styles.emptyText}>No members added. Adding members helps AI predict consumption patterns better.</Text>
                        </View>
                    ) : (
                        members.map((m) => (
                            <View key={m.id} style={styles.memberItem}>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberTypeLabel}>{m.member_type.replace('_', ' ').toUpperCase()}</Text>
                                    <Text style={styles.memberSubInfo}>Age: {m.age} | {m.occupation_status}</Text>
                                </View>
                                <TouchableOpacity onPress={() => handleDeleteMember(m.id)}>
                                    <Trash2 size={18} color={COLORS.danger} />
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </View>

                <View style={{ height: 100 }} />
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.bg0 },
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: Platform.OS === 'ios' ? 60 : 40,
        paddingBottom: 20,
        backgroundColor: COLORS.bg2,
    },
    backBtn: { padding: 4 },
    title: { ...FONTS.bold, fontSize: 20, color: COLORS.textPrimary },
    saveBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 8, backgroundColor: COLORS.primary + '20' },
    saveBtnText: { ...FONTS.bold, color: COLORS.primary, fontSize: 14 },
    content: { padding: 20 },
    avatarSection: { alignItems: 'center', marginBottom: 30 },
    avatarWrapper: { position: 'relative' },
    avatar: { width: 100, height: 100, borderRadius: 50, borderWidth: 3, borderColor: COLORS.primary },
    avatarPlaceholder: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.bg3, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
    cameraBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: COLORS.primary, width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: COLORS.bg2 },
    userNameText: { ...FONTS.bold, fontSize: 18, color: COLORS.textPrimary, marginTop: 12 },
    userEmailText: { ...FONTS.regular, fontSize: 14, color: COLORS.textMuted, marginTop: 4 },
    section: { backgroundColor: COLORS.bg2, borderRadius: 16, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: COLORS.border },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
    sectionTitle: { ...FONTS.bold, fontSize: 16, color: COLORS.textPrimary, marginLeft: 10, flex: 1 },
    inputGroup: { marginBottom: 16 },
    label: { ...FONTS.medium, fontSize: 14, color: COLORS.textSecondary, marginBottom: 8 },
    labelSmall: { ...FONTS.medium, fontSize: 12, color: COLORS.textMuted, marginBottom: 4 },
    inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.bg0, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, height: 44, color: COLORS.textPrimary, ...FONTS.regular },
    smallInput: { backgroundColor: COLORS.bg0, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, height: 40, color: COLORS.textPrimary, ...FONTS.regular },
    row: { flexDirection: 'row', alignItems: 'center' },
    addBtn: { backgroundColor: COLORS.success, width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    addMemberCard: { backgroundColor: COLORS.bg0, borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.success + '40' },
    cardTitle: { ...FONTS.bold, fontSize: 14, color: COLORS.textPrimary, marginBottom: 12 },
    memberTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
    typeTag: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 20, backgroundColor: COLORS.bg2, borderWidth: 1, borderColor: COLORS.border },
    typeTagActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
    typeTagText: { fontSize: 12, color: COLORS.textSecondary, ...FONTS.medium },
    typeTagTextActive: { color: COLORS.white },
    submitMemberBtn: { backgroundColor: COLORS.success, borderRadius: 8, height: 40, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
    submitMemberBtnText: { color: COLORS.white, ...FONTS.bold, fontSize: 14 },
    emptyMembers: { padding: 20, alignItems: 'center' },
    emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: 'center', lineHeight: 20 },
    memberItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    memberInfo: { flex: 1 },
    memberTypeLabel: { ...FONTS.bold, fontSize: 13, color: COLORS.textPrimary },
    memberSubInfo: { ...FONTS.regular, fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
});

export default ProfileScreen;
