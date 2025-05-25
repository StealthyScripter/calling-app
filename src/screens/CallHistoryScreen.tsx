import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import CallService from '../services/CallService';

interface CallLogItem {
  id: string;
  toNumber: string;
  duration: number;
  callType: 'voice' | 'video';
  status: string;
  timestamp: any;
}

const CallHistoryScreen: React.FC = () => {
  const [callHistory, setCallHistory] = useState<CallLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadCallHistory();
  }, []);

  const loadCallHistory = async () => {
    try {
      const history = await CallService.getCallHistory();
      setCallHistory(history);
    } catch (error) {
      console.error('Load call history error:', error);
      Alert.alert('Error', 'Failed to load call history');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadCallHistory();
    setRefreshing(false);
  };

  const handleCallBack = async (phoneNumber: string) => {
    Alert.alert(
      'Call Back',
      `Call ${phoneNumber}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: () => CallService.initiateCall(phoneNumber),
        },
      ]
    );
  };

  const formatDuration = (seconds: number): string => {
    if (seconds === 0) {return 'Not connected';}
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {return `${secs}s`;}
    return `${mins}m ${secs}s`;
  };

  const formatTimestamp = (timestamp: any): string => {
    if (!timestamp) {return '';}

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return diffMins < 1 ? 'Just now' : `${diffMins}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getCallStatusIcon = (status: string, duration: number): string => {
    switch (status) {
      case 'completed':
        return duration > 0 ? '📞' : '📵';
      case 'missed':
        return '📵';
      case 'pstn_initiated':
        return '📱';
      default:
        return '📞';
    }
  };

  const renderCallItem = ({ item }: { item: CallLogItem }) => (
    <TouchableOpacity
      style={styles.callItem}
      onPress={() => handleCallBack(item.toNumber)}
      activeOpacity={0.7}
    >
      <View style={styles.callIcon}>
        <Text style={styles.callIconText}>
          {getCallStatusIcon(item.status, item.duration)}
        </Text>
      </View>

      <View style={styles.callDetails}>
        <Text style={styles.phoneNumber}>{item.toNumber}</Text>
        <View style={styles.callMeta}>
          <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
          <Text style={styles.separator}>•</Text>
          <Text style={styles.timestamp}>{formatTimestamp(item.timestamp)}</Text>
        </View>
        <Text style={styles.callType}>
          {item.callType === 'video' ? '📹 Video' : '🔊 Voice'} 
          {item.status === 'pstn_initiated' && ' (Cellular)'}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.callBackButton}
        onPress={() => handleCallBack(item.toNumber)}
      >
        <Text style={styles.callBackIcon}>📞</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading call history...</Text>
      </View>
    );
  }

  if (callHistory.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyIcon}>📞</Text>
        <Text style={styles.emptyTitle}>No Call History</Text>
        <Text style={styles.emptySubtitle}>
          Your recent calls will appear here
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={callHistory}
        keyExtractor={(item) => item.id}
        renderItem={renderCallItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  listContainer: {
    padding: 15,
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  callIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  callIconText: {
    fontSize: 20,
  },
  callDetails: {
    flex: 1,
  },
  phoneNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  separator: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
  timestamp: {
    fontSize: 14,
    color: '#666',
  },
  callType: {
    fontSize: 12,
    color: '#999',
  },
  callBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  callBackIcon: {
    fontSize: 16,
  },
});

export default CallHistoryScreen;
