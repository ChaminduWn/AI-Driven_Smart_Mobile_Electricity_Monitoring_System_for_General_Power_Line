import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert, Modal } from 'react-native';
import { Text, Avatar, Button, IconButton, Badge, TextInput, Portal, Dialog } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import PropTypes from 'prop-types';
import Header from '../../components/safety/Header';

const { width } = Dimensions.get('window');

const demo = [
  {
    id: '1',
    name: 'Washing Machine',
    status: 'flood',
    note: 'Ground floor flooding detected in your area.',
    icon: 'tumble-dryer',
    statusLabel: 'At Risk',
    statusColor: '#DC2626'
  },
  {
    id: '2',
    name: 'Refrigerator',
    status: 'unstable',
    note: 'Voltage fluctuations detected.',
    icon: 'fridge',
    statusLabel: 'Unstable',
    statusColor: '#F97316'
  },
  {
    id: '3',
    name: 'Smart TV',
    status: 'protected',
    note: 'Protected with surge protector.',
    icon: 'television',
    statusLabel: 'Protected',
    statusColor: '#10B981'
  },
  {
    id: '4',
    name: 'Air Conditioner',
    status: 'protected',
    note: 'All systems operating normally.',
    icon: 'fan',
    statusLabel: 'Protected',
    statusColor: '#10B981'
  },
  {
    id: '5',
    name: 'Microwave Oven',
    status: 'unstable',
    note: 'Minor power fluctuations detected.',
    icon: 'oven',
    statusLabel: 'Unstable',
    statusColor: '#F59E0B'
  }
];

// Available appliance icons
const AVAILABLE_ICONS = [
  { name: 'tumble-dryer', label: 'Washing Machine' },
  { name: 'fridge', label: 'Refrigerator' },
  { name: 'television', label: 'TV' },
  { name: 'fan', label: 'AC/Fan' },
  { name: 'oven', label: 'Oven' },
  { name: 'toaster', label: 'Toaster' },
  { name: 'coffee-maker', label: 'Coffee Maker' },
  { name: 'lamp', label: 'Lamp' },
  { name: 'hair-dryer', label: 'Hair Dryer' },
  { name: 'iron', label: 'Iron' },
];

function ApplianceCard({ appliance, onMarkSecured, onDelete }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'flood':
        return {
          bgColor: '#FEF2F2',
          borderColor: '#FECACA',
          iconBg: '#FEE2E2',
          badgeBg: '#DC2626',
          badgeText: '#FFFFFF'
        };
      case 'unstable':
        return {
          bgColor: '#FFF7ED',
          borderColor: '#FED7AA',
          iconBg: '#FFEDD5',
          badgeBg: '#F97316',
          badgeText: '#FFFFFF'
        };
      case 'protected':
        return {
          bgColor: '#F0FDF4',
          borderColor: '#BBF7D0',
          iconBg: '#D1FAE5',
          badgeBg: '#10B981',
          badgeText: '#FFFFFF'
        };
      default:
        return {
          bgColor: '#F8FAFC',
          borderColor: '#E2E8F0',
          iconBg: '#F1F5F9',
          badgeBg: '#64748B',
          badgeText: '#FFFFFF'
        };
    }
  };

  const config = getStatusConfig(appliance.status);
  const needsAction = appliance.status !== 'protected';

  const handleDelete = () => {
    Alert.alert(
      'Delete Appliance',
      `Are you sure you want to remove "${appliance.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete && onDelete(appliance.id)
        }
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.cardContainer}
      activeOpacity={0.9}
    >
      <View style={[styles.card, {
        backgroundColor: config.bgColor,
        borderColor: config.borderColor
      }]}>
        {/* Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconButton
            icon="close-circle"
            size={24}
            iconColor="#DC2626"
            style={styles.deleteIcon}
          />
        </TouchableOpacity>

        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.iconSection}>
            <View style={[styles.iconContainer, { backgroundColor: config.iconBg }]}>
              <IconButton
                icon={appliance.icon}
                size={32}
                iconColor={config.badgeBg}
                style={styles.iconButton}
              />
            </View>
          </View>

          <View style={styles.titleSection}>
            <Text style={styles.applianceName}>{appliance.name}</Text>
            <View style={styles.badgeContainer}>
              <View style={[styles.statusBadge, { backgroundColor: config.badgeBg }]}>
                <Text style={[styles.statusBadgeText, { color: config.badgeText }]}>
                  {appliance.statusLabel}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Card Body */}
        <View style={styles.cardBody}>
          <Text style={styles.noteText}>{appliance.note}</Text>
        </View>

        {/* Card Footer */}
        {needsAction && (
          <View style={styles.cardFooter}>
            <Button
              mode="contained"
              onPress={() => onMarkSecured && onMarkSecured(appliance.id)}
              style={[styles.actionButton, { backgroundColor: config.badgeBg }]}
              contentStyle={styles.buttonContent}
              labelStyle={styles.buttonLabel}
              icon="shield-check"
            >
              Mark as Secured
            </Button>
          </View>
        )}

        {!needsAction && (
          <View style={styles.cardFooter}>
            <View style={styles.protectedIndicator}>
              <IconButton
                icon="shield-check"
                size={20}
                iconColor="#10B981"
                style={styles.protectedIcon}
              />
              <Text style={styles.protectedText}>All systems secure</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

ApplianceCard.propTypes = {
  appliance: PropTypes.object.isRequired,
  onMarkSecured: PropTypes.func,
  onDelete: PropTypes.func
};

export default function AppliancesScreen({ navigation }) {
  const [items, setItems] = useState(demo);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    note: '',
    status: 'unstable',
    icon: 'tumble-dryer'
  });

  useEffect(() => {
    // Any initialization logic here
  }, []);

  const handleMarkSecured = (id) => {
    setItems(items.map(item =>
      item.id === id
        ? { ...item, status: 'protected', statusLabel: 'Protected', statusColor: '#10B981' }
        : item
    ));
  };

  const handleDelete = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleAddAppliance = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter an appliance name');
      return;
    }

    const statusConfig = {
      flood: { statusLabel: 'At Risk', statusColor: '#DC2626' },
      unstable: { statusLabel: 'Unstable', statusColor: '#F97316' },
      protected: { statusLabel: 'Protected', statusColor: '#10B981' }
    };

    const newAppliance = {
      id: Date.now().toString(),
      name: formData.name.trim(),
      note: formData.note.trim() || 'No additional notes.',
      status: formData.status,
      icon: formData.icon,
      ...statusConfig[formData.status]
    };

    setItems([...items, newAppliance]);
    setFormData({
      name: '',
      note: '',
      status: 'unstable',
      icon: 'tumble-dryer'
    });
    setModalVisible(false);
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'flood': return 'At Risk';
      case 'unstable': return 'Unstable';
      case 'protected': return 'Protected';
      default: return 'Unknown';
    }
  };

  return (
    <View style={styles.container}>
      <Header title="My Appliances" />
      <LinearGradient
        colors={['#f6fbff', '#ffffff', '#f6fbff']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Appliance Safety Status</Text>
            <Text style={styles.headerSubtitle}>
              Monitor and protect your electrical appliances
            </Text>
          </View>

          {/* Stats Summary */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{items.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#10B981' }]}>
                {items.filter(i => i.status === 'protected').length}
              </Text>
              <Text style={styles.statLabel}>Protected</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statNumber, { color: '#F97316' }]}>
                {items.filter(i => i.status !== 'protected').length}
              </Text>
              <Text style={styles.statLabel}>At Risk</Text>
            </View>
          </View>

          {/* Appliances List */}
          {items.length === 0 ? (
            <View style={styles.emptyState}>
              <IconButton
                icon="apps"
                size={64}
                iconColor="#94A3B8"
                style={styles.emptyIcon}
              />
              <Text style={styles.emptyText}>No appliances added yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to add your first appliance</Text>
            </View>
          ) : (
            <View style={styles.appliancesList}>
              {items.map((item) => (
                <ApplianceCard
                  key={item.id}
                  appliance={item}
                  onMarkSecured={handleMarkSecured}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          )}

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Floating Action Button */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.fabContent}>
            <IconButton
              icon="plus"
              size={28}
              iconColor="#FFFFFF"
              style={styles.fabIcon}
            />
            <Text style={styles.fabLabel}>Add Appliance</Text>
          </View>
        </TouchableOpacity>

        {/* Add Appliance Modal */}
        <Portal>
          <Modal
            visible={modalVisible}
            onDismiss={() => setModalVisible(false)}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add New Appliance</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                />
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {/* Appliance Name */}
                <TextInput
                  label="Appliance Name"
                  value={formData.name}
                  onChangeText={(text) => setFormData({ ...formData, name: text })}
                  mode="outlined"
                  style={styles.input}
                  placeholder="e.g., Washing Machine"
                />

                {/* Status Selection */}
                <Text style={styles.inputLabel}>Status</Text>
                <View style={styles.statusButtons}>
                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      formData.status === 'flood' && styles.statusButtonActive,
                      { backgroundColor: formData.status === 'flood' ? '#FEF2F2' : '#F8FAFC' }
                    ]}
                    onPress={() => setFormData({ ...formData, status: 'flood' })}
                  >
                    <View style={[styles.statusDot, { backgroundColor: '#DC2626' }]} />
                    <Text style={[
                      styles.statusButtonText,
                      formData.status === 'flood' && styles.statusButtonTextActive
                    ]}>
                      At Risk
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      formData.status === 'unstable' && styles.statusButtonActive,
                      { backgroundColor: formData.status === 'unstable' ? '#FFF7ED' : '#F8FAFC' }
                    ]}
                    onPress={() => setFormData({ ...formData, status: 'unstable' })}
                  >
                    <View style={[styles.statusDot, { backgroundColor: '#F97316' }]} />
                    <Text style={[
                      styles.statusButtonText,
                      formData.status === 'unstable' && styles.statusButtonTextActive
                    ]}>
                      Unstable
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.statusButton,
                      formData.status === 'protected' && styles.statusButtonActive,
                      { backgroundColor: formData.status === 'protected' ? '#F0FDF4' : '#F8FAFC' }
                    ]}
                    onPress={() => setFormData({ ...formData, status: 'protected' })}
                  >
                    <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                    <Text style={[
                      styles.statusButtonText,
                      formData.status === 'protected' && styles.statusButtonTextActive
                    ]}>
                      Protected
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Icon Selection */}
                <Text style={styles.inputLabel}>Icon</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.iconScroll}
                >
                  {AVAILABLE_ICONS.map((icon) => (
                    <TouchableOpacity
                      key={icon.name}
                      style={[
                        styles.iconOption,
                        formData.icon === icon.name && styles.iconOptionActive
                      ]}
                      onPress={() => setFormData({ ...formData, icon: icon.name })}
                    >
                      <IconButton
                        icon={icon.name}
                        size={32}
                        iconColor={formData.icon === icon.name ? '#0066cc' : '#94A3B8'}
                        style={styles.iconOptionButton}
                      />
                      <Text style={[
                        styles.iconOptionText,
                        formData.icon === icon.name && styles.iconOptionTextActive
                      ]}>
                        {icon.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Note */}
                <TextInput
                  label="Note (Optional)"
                  value={formData.note}
                  onChangeText={(text) => setFormData({ ...formData, note: text })}
                  mode="outlined"
                  style={styles.input}
                  multiline
                  numberOfLines={3}
                  placeholder="Add any additional information..."
                />
              </ScrollView>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <Button
                  mode="outlined"
                  onPress={() => setModalVisible(false)}
                  style={styles.modalButton}
                >
                  Cancel
                </Button>
                <Button
                  mode="contained"
                  onPress={handleAddAppliance}
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  icon="check"
                >
                  Add Appliance
                </Button>
              </View>
            </View>
          </Modal>
        </Portal>
      </LinearGradient>
    </View>
  );
}

AppliancesScreen.propTypes = { navigation: PropTypes.object };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6fbff',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 100,
  },
  headerSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#0066cc',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  appliancesList: {
    gap: 16,
  },
  cardContainer: {
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconSection: {
    marginRight: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButton: {
    margin: 0,
  },
  titleSection: {
    flex: 1,
    justifyContent: 'center',
  },
  applianceName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  badgeContainer: {
    alignSelf: 'flex-start',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cardBody: {
    marginBottom: 16,
    paddingLeft: 80,
  },
  noteText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  cardFooter: {
    paddingLeft: 80,
  },
  actionButton: {
    borderRadius: 12,
    elevation: 0,
    shadowOpacity: 0,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  protectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  protectedIcon: {
    margin: 0,
    marginRight: 4,
  },
  protectedText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  deleteIcon: {
    margin: 0,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 100,
    backgroundColor: '#0066cc',
    borderRadius: 28,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabIcon: {
    margin: 0,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    margin: 0,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  modalContainer: {
    backgroundColor: 'white',
    margin: 20,
    borderRadius: 20,
    maxHeight: '90%',
  },
  modalContent: {
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    margin: 0,
  },
  modalScroll: {
    maxHeight: 400,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
    marginTop: 8,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statusButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  statusButtonActive: {
    borderColor: '#0066cc',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  statusButtonTextActive: {
    color: '#0F172A',
  },
  iconScroll: {
    marginBottom: 24,
  },
  iconOption: {
    alignItems: 'center',
    marginRight: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    minWidth: 80,
  },
  iconOptionActive: {
    borderColor: '#0066cc',
    backgroundColor: '#E6F2FF',
  },
  iconOptionButton: {
    margin: 0,
  },
  iconOptionText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  iconOptionTextActive: {
    color: '#0066cc',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  modalButton: {
    flex: 1,
  },
  modalButtonPrimary: {
    backgroundColor: '#0066cc',
  },
});