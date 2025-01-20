import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Switch, Linking, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme, ThemedText, ThemedView } from '../../components';
import Colors from '../../constants/Colors';
import { supabase } from '../../lib/supabase';

interface Settings {
  notifications: {
    rides: boolean;
    messages: boolean;
    promotions: boolean;
  };
  privacy: {
    showProfile: boolean;
    shareLocation: boolean;
  };
  language: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'sw', name: 'Swahili' },
  { code: 'lg', name: 'Luganda' },
];

export default function Settings() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      rides: true,
      messages: true,
      promotions: false,
    },
    privacy: {
      showProfile: true,
      shareLocation: true,
    },
    language: 'en',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // Settings don't exist yet, create with defaults
          await saveSettings(settings);
        } else {
          throw error;
        }
      } else if (data) {
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      Alert.alert('Error', 'Failed to load settings');
    }
  };

  const saveSettings = async (newSettings: Settings) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not found');

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          settings: newSettings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const updateNotificationSetting = (key: keyof Settings['notifications']) => {
    const newSettings = {
      ...settings,
      notifications: {
        ...settings.notifications,
        [key]: !settings.notifications[key],
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const updatePrivacySetting = (key: keyof Settings['privacy']) => {
    const newSettings = {
      ...settings,
      privacy: {
        ...settings.privacy,
        [key]: !settings.privacy[key],
      },
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLanguageSelect = (code: string) => {
    const newSettings = {
      ...settings,
      language: code,
    };
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/verify');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out');
    }
  };

  const openHelp = () => {
    Linking.openURL('https://makela.com/help');
  };

  return (
    <ScrollView style={styles.container}>
      {/* Notifications Section */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Notifications</ThemedText>
        <View style={styles.settingsList}>
          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Ride Updates</ThemedText>
            <Switch
              value={settings.notifications.rides}
              onValueChange={() => updateNotificationSetting('rides')}
              trackColor={{ false: Colors[colorScheme].border, true: Colors[colorScheme].tint }}
            />
          </View>
          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Messages</ThemedText>
            <Switch
              value={settings.notifications.messages}
              onValueChange={() => updateNotificationSetting('messages')}
              trackColor={{ false: Colors[colorScheme].border, true: Colors[colorScheme].tint }}
            />
          </View>
          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Promotions</ThemedText>
            <Switch
              value={settings.notifications.promotions}
              onValueChange={() => updateNotificationSetting('promotions')}
              trackColor={{ false: Colors[colorScheme].border, true: Colors[colorScheme].tint }}
            />
          </View>
        </View>
      </ThemedView>

      {/* Privacy Section */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Privacy</ThemedText>
        <View style={styles.settingsList}>
          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Show Profile to Others</ThemedText>
            <Switch
              value={settings.privacy.showProfile}
              onValueChange={() => updatePrivacySetting('showProfile')}
              trackColor={{ false: Colors[colorScheme].border, true: Colors[colorScheme].tint }}
            />
          </View>
          <View style={styles.settingItem}>
            <ThemedText style={styles.settingLabel}>Share Location</ThemedText>
            <Switch
              value={settings.privacy.shareLocation}
              onValueChange={() => updatePrivacySetting('shareLocation')}
              trackColor={{ false: Colors[colorScheme].border, true: Colors[colorScheme].tint }}
            />
          </View>
        </View>
      </ThemedView>

      {/* Language Section */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Language</ThemedText>
        <View style={styles.languageList}>
          {LANGUAGES.map((language) => (
            <Pressable
              key={language.code}
              style={[
                styles.languageItem,
                settings.language === language.code && styles.selectedLanguage,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <ThemedText style={styles.languageName}>{language.name}</ThemedText>
              {settings.language === language.code && (
                <Ionicons name="checkmark" size={24} color={Colors[colorScheme].tint} />
              )}
            </Pressable>
          ))}
        </View>
      </ThemedView>

      {/* Help Section */}
      <ThemedView style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Support</ThemedText>
        <Pressable style={styles.helpButton} onPress={openHelp}>
          <ThemedText style={styles.helpButtonText}>Help Center</ThemedText>
          <Ionicons name="open-outline" size={24} color={Colors[colorScheme].text} />
        </Pressable>
      </ThemedView>

      {/* Logout Button */}
      <Pressable
        style={styles.logoutButton}
        onPress={handleLogout}
      >
        <ThemedText style={styles.logoutButtonText}>Log Out</ThemedText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingsList: {
    gap: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLabel: {
    fontSize: 16,
  },
  languageList: {
    gap: 12,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  selectedLanguage: {
    borderColor: Colors.light.tint,
    borderWidth: 2,
  },
  languageName: {
    fontSize: 16,
  },
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  helpButtonText: {
    fontSize: 16,
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#DC3545',
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 