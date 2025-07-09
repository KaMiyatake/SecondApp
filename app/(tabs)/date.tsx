import React, { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function DateScreen() {
  const colorScheme = useColorScheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // 日本語の曜日配列
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  
  // 1秒ごとに時刻を更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 引っ張って更新
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setCurrentDate(new Date());
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  // 日付フォーマット関数
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  // 時刻フォーマット関数
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <ThemedView style={styles.headerContainer}>
        <IconSymbol 
          size={60} 
          name="calendar" 
          color={Colors[colorScheme ?? 'light'].tint}
          style={styles.headerIcon}
        />
        <ThemedText type="title" style={styles.headerTitle}>
          今日の日付
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.dateContainer}>
        <ThemedText type="title" style={styles.dateText}>
          {formatDate(currentDate)}
        </ThemedText>
        
        <ThemedText type="subtitle" style={styles.weekdayText}>
          {weekdays[currentDate.getDay()]}曜日
        </ThemedText>
        
        <ThemedText type="default" style={styles.timeText}>
          {formatTime(currentDate)}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.infoContainer}>
        <ThemedView style={styles.infoItem}>
          <ThemedText type="defaultSemiBold">年</ThemedText>
          <ThemedText type="default">{currentDate.getFullYear()}</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.infoItem}>
          <ThemedText type="defaultSemiBold">月</ThemedText>
          <ThemedText type="default">{currentDate.getMonth() + 1}</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.infoItem}>
          <ThemedText type="defaultSemiBold">日</ThemedText>
          <ThemedText type="default">{currentDate.getDate()}</ThemedText>
        </ThemedView>
        
        <ThemedView style={styles.infoItem}>
          <ThemedText type="defaultSemiBold">曜日</ThemedText>
          <ThemedText type="default">{weekdays[currentDate.getDay()]}</ThemedText>
        </ThemedView>
      </ThemedView>

      <ThemedView style={styles.additionalInfo}>
        <ThemedText type="subtitle" style={styles.additionalTitle}>
          追加情報
        </ThemedText>
        
        <ThemedText type="default">
          今年の経過日数: {Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1}日
        </ThemedText>
        
        <ThemedText type="default">
          今月の経過日数: {currentDate.getDate()}日
        </ThemedText>
        
        <ThemedText type="default">
          今週の曜日番号: {currentDate.getDay() + 1}
        </ThemedText>
      </ThemedView>

      <ThemedView style={styles.footer}>
        <ThemedText type="default" style={styles.footerText}>
          下に引っ張って更新
        </ThemedText>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  headerIcon: {
    marginBottom: 10,
  },
  headerTitle: {
    textAlign: 'center',
  },
  dateContainer: {
    alignItems: 'center',
    marginBottom: 30,
    paddingHorizontal: 20,
    paddingVertical: 20,
    marginHorizontal: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  dateText: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  weekdayText: {
    fontSize: 20,
    marginBottom: 15,
  },
  timeText: {
    fontSize: 18,
    opacity: 0.8,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  infoItem: {
    alignItems: 'center',
    flex: 1,
  },
  additionalInfo: {
    marginHorizontal: 20,
    marginBottom: 30,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  additionalTitle: {
    marginBottom: 10,
  },
  footer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  footerText: {
    opacity: 0.6,
    fontSize: 14,
  },
});
