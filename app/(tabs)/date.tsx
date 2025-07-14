import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { RefreshControl, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function DateScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // カレンダーから選択された日付またはデフォルトで現在の日付
  const [targetDate, setTargetDate] = useState<Date>(() => {
    if (params.selectedDate && typeof params.selectedDate === 'string') {
      return new Date(params.selectedDate);
    }
    return new Date();
  });
  
  const [currentTime, setCurrentTime] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  // 日本語の曜日配列
  const weekdays = ['日', '月', '火', '水', '木', '金', '土'];
  
  // 現在時刻を1秒ごとに更新（選択された日付が今日の場合のみ）
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // パラメータが変更された時に対象日付を更新
  useEffect(() => {
    if (params.selectedDate && typeof params.selectedDate === 'string') {
      setTargetDate(new Date(params.selectedDate));
    }
  }, [params.selectedDate]);

  // 引っ張って更新
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setCurrentTime(new Date());
    if (isToday(targetDate)) {
      setTargetDate(new Date());
    }
    setTimeout(() => setRefreshing(false), 1000);
  }, [targetDate]);

  // カレンダーに戻る
  const goToCalendar = () => {
    router.push('/calendar');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 今日の日付かどうかを判定
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return date.getFullYear() === today.getFullYear() &&
           date.getMonth() === today.getMonth() &&
           date.getDate() === today.getDate();
  };

  // 日付フォーマット関数
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  // 時刻フォーマット関数（現在時刻用）
  const formatTime = (date: Date) => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  // 対象日付の詳細情報を取得
  const getDateDetails = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = weekdays[date.getDay()];
    
    // 年始からの経過日数
    const dayOfYear = Math.floor((date.getTime() - new Date(year, 0, 1).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // 月初からの経過日数
    const dayOfMonth = day;
    
    // 曜日番号
    const dayOfWeekNumber = date.getDay() + 1;
    
    return {
      year,
      month,
      day,
      dayOfWeek,
      dayOfYear,
      dayOfMonth,
      dayOfWeekNumber,
      formattedDate: formatDate(date)
    };
  };

  const dateDetails = getDateDetails(targetDate);
  const showCurrentTime = isToday(targetDate);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* カレンダーに戻るボタン */}
        <ThemedView style={styles.backButtonContainer}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}
            onPress={goToCalendar}
          >
            <IconSymbol size={20} name="chevron.left" color={Colors[colorScheme ?? 'light'].tint} />
            <ThemedText type="defaultSemiBold" style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
              カレンダーに戻る
            </ThemedText>
          </TouchableOpacity>
        </ThemedView>

        <ThemedView style={styles.headerContainer}>
          <IconSymbol 
            size={40} 
            name="calendar" 
            color={Colors[colorScheme ?? 'light'].tint}
            style={styles.headerIcon}
          />
          <ThemedText type="title" style={styles.headerTitle}>
            {showCurrentTime ? '今日の日付' : '選択した日付'}
          </ThemedText>
        </ThemedView>

        <ThemedView style={styles.dateContainer}>
          <ThemedText type="title" style={styles.dateText}>
            {dateDetails.formattedDate}
          </ThemedText>
          
          <ThemedText type="subtitle" style={styles.weekdayText}>
            {dateDetails.dayOfWeek}曜日
          </ThemedText>
          
          {showCurrentTime && (
            <ThemedText type="default" style={styles.timeText}>
              現在時刻: {formatTime(currentTime)}
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.infoContainer}>
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">年</ThemedText>
            <ThemedText type="default">{dateDetails.year}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">月</ThemedText>
            <ThemedText type="default">{dateDetails.month}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">日</ThemedText>
            <ThemedText type="default">{dateDetails.day}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoItem}>
            <ThemedText type="defaultSemiBold">曜日</ThemedText>
            <ThemedText type="default">{dateDetails.dayOfWeek}</ThemedText>
          </ThemedView>
        </ThemedView>

        <ThemedView style={styles.additionalInfo}>
          <ThemedText type="subtitle" style={styles.additionalTitle}>
            詳細情報
          </ThemedText>
          
          <ThemedText type="default">
            今年の経過日数: {dateDetails.dayOfYear}日
          </ThemedText>
          
          <ThemedText type="default">
            今月の経過日数: {dateDetails.dayOfMonth}日
          </ThemedText>
          
          <ThemedText type="default">
            今週の曜日番号: {dateDetails.dayOfWeekNumber}
          </ThemedText>
          
          {showCurrentTime && (
            <ThemedText type="default">
              ステータス: 今日の日付
            </ThemedText>
          )}
        </ThemedView>

        <ThemedView style={styles.footer}>
          <ThemedText type="default" style={styles.footerText}>
            下に引っ張って更新
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    marginLeft: 5,
    fontSize: 16,
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
    fontSize: 24,
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
