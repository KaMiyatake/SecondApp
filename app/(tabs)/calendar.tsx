import React, { useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: screenWidth } = Dimensions.get('window');

interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  fullDate: Date;
}

export default function CalendarScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
  const monthNames = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ];

  // カレンダーの日付データを生成
  const generateCalendarDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    
    // 月の最初の日と最後の日を取得
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    // 月の最初の日の曜日を取得（0=日曜日）
    const firstDayOfWeek = firstDay.getDay();
    
    // 前月の末尾の日付を取得
    const prevMonthLastDay = new Date(year, month, 0);
    
    const days: CalendarDay[] = [];
    
    // 前月の日付を追加（最初の週を埋めるため）
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayDate = new Date(year, month - 1, prevMonthLastDay.getDate() - i);
      days.push({
        date: dayDate.getDate(),
        isCurrentMonth: false,
        isToday: false,
        isSelected: selectedDate ? isSameDate(dayDate, selectedDate) : false,
        fullDate: dayDate,
      });
    }
    
    // 現在の月の日付を追加
    for (let day = 1; day <= lastDay.getDate(); day++) {
      const dayDate = new Date(year, month, day);
      days.push({
        date: day,
        isCurrentMonth: true,
        isToday: isSameDate(dayDate, today),
        isSelected: selectedDate ? isSameDate(dayDate, selectedDate) : false,
        fullDate: dayDate,
      });
    }
    
    // 次月の日付を追加（最後の週を埋めるため）
    const remainingDays = 42 - days.length; // 6週間 × 7日 = 42
    for (let day = 1; day <= remainingDays; day++) {
      const dayDate = new Date(year, month + 1, day);
      days.push({
        date: day,
        isCurrentMonth: false,
        isToday: false,
        isSelected: selectedDate ? isSameDate(dayDate, selectedDate) : false,
        fullDate: dayDate,
      });
    }
    
    return days;
  };

  // 日付が同じかどうかを判定
  const isSameDate = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
  };

  // 前月に移動
  const goToPrevMonth = () => {
    const prevMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(prevMonth);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 次月に移動
  const goToNextMonth = () => {
    const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(nextMonth);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 今月に戻る
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // 日付を選択
  const selectDate = (day: CalendarDay) => {
    setSelectedDate(day.fullDate);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 選択した日付のDateページに移動
  const goToSelectedDate = () => {
    if (selectedDate) {
      // 選択した日付をグローバルに保存（今回は簡易的にDateコンポーネントで処理）
      router.push({
        pathname: '/date',
        params: { selectedDate: selectedDate.toISOString() }
      });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  // 選択された日付の情報を取得
  const getSelectedDateInfo = () => {
    if (!selectedDate) return null;
    
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const date = selectedDate.getDate();
    const dayOfWeek = weekDays[selectedDate.getDay()];
    
    return {
      year,
      month,
      date,
      dayOfWeek,
      formattedDate: `${year}年${month}月${date}日 (${dayOfWeek})`
    };
  };

  // 月の詳細情報を取得
  const getMonthInfo = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const firstDayOfWeek = weekDays[firstDay.getDay()];
    
    return {
      daysInMonth,
      firstDayOfWeek,
      monthName: monthNames[month],
      year
    };
  };

  // カレンダーデータを更新
  useEffect(() => {
    const days = generateCalendarDays(currentDate);
    setCalendarDays(days);
  }, [currentDate, selectedDate]);

  const selectedDateInfo = getSelectedDateInfo();
  const monthInfo = getMonthInfo();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.headerContainer}>
          <IconSymbol 
            size={40} 
            name="calendar.badge.plus" 
            color={Colors[colorScheme ?? 'light'].tint}
            style={styles.headerIcon}
          />
          <ThemedText type="title" style={styles.headerTitle}>
            カレンダー
          </ThemedText>
        </ThemedView>

        {/* 月移動コントロール */}
        <ThemedView style={styles.monthControlContainer}>
          <TouchableOpacity
            style={[styles.monthButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}
            onPress={goToPrevMonth}
          >
            <IconSymbol size={24} name="chevron.left" color={Colors[colorScheme ?? 'light'].tint} />
          </TouchableOpacity>
          
          <ThemedView style={styles.monthTitleContainer}>
            <ThemedText type="title" style={styles.monthTitle}>
              {currentDate.getFullYear()}年 {monthNames[currentDate.getMonth()]}
            </ThemedText>
          </ThemedView>
          
          <TouchableOpacity
            style={[styles.monthButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}
            onPress={goToNextMonth}
          >
            <IconSymbol size={24} name="chevron.right" color={Colors[colorScheme ?? 'light'].tint} />
          </TouchableOpacity>
        </ThemedView>

        {/* カレンダーグリッド */}
        <ThemedView style={styles.calendarContainer}>
          {/* 曜日ヘッダー */}
          <View style={styles.weekDaysContainer}>
            {weekDays.map((day, index) => (
              <ThemedView key={index} style={styles.weekDayItem}>
                <ThemedText 
                  type="defaultSemiBold" 
                  style={[
                    styles.weekDayText,
                    index === 0 && { color: '#FF5252' }, // 日曜日
                    index === 6 && { color: '#2196F3' }  // 土曜日
                  ]}
                >
                  {day}
                </ThemedText>
              </ThemedView>
            ))}
          </View>

          {/* 日付グリッド */}
          <View style={styles.daysContainer}>
            {calendarDays.map((day, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayItem,
                  day.isToday && styles.todayItem,
                  day.isSelected && styles.selectedItem,
                  day.isSelected && { backgroundColor: Colors[colorScheme ?? 'light'].tint },
                ]}
                onPress={() => selectDate(day)}
              >
                <ThemedText 
                  type="default"
                  style={[
                    styles.dayText,
                    !day.isCurrentMonth && styles.otherMonthText,
                    day.isToday && styles.todayText,
                    day.isSelected && styles.selectedText, // 選択時は黒文字
                    index % 7 === 0 && day.isCurrentMonth && !day.isSelected && { color: '#FF5252' }, // 日曜日
                    index % 7 === 6 && day.isCurrentMonth && !day.isSelected && { color: '#2196F3' }  // 土曜日
                  ]}
                >
                  {day.date}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* 選択された日付の情報 */}
        {selectedDateInfo && (
          <ThemedView style={styles.selectedDateContainer}>
            <ThemedText type="subtitle" style={styles.selectedDateTitle}>
              選択中の日付
            </ThemedText>
            <ThemedText type="title" style={styles.selectedDateText}>
              {selectedDateInfo.formattedDate}
            </ThemedText>
            
            {/* 選択した日付のDateページに移動するボタン */}
            <TouchableOpacity
              style={[styles.goToDateButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={goToSelectedDate}
            >
              <ThemedText style={[styles.goToDateButtonText, { color: Colors[colorScheme ?? 'light'].background }]}>
                この日付の詳細を見る
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        )}

        {/* 月の情報 */}
        <ThemedView style={styles.monthInfoContainer}>
          <ThemedText type="subtitle" style={styles.monthInfoTitle}>
            📅 {monthInfo.monthName}の情報
          </ThemedText>
          
          <View style={styles.monthInfoGrid}>
            <ThemedView style={styles.monthInfoItem}>
              <ThemedText type="defaultSemiBold" style={styles.monthInfoLabel}>総日数</ThemedText>
              <ThemedText type="title" style={styles.monthInfoValue}>{monthInfo.daysInMonth}日</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.monthInfoItem}>
              <ThemedText type="defaultSemiBold" style={styles.monthInfoLabel}>開始曜日</ThemedText>
              <ThemedText type="title" style={styles.monthInfoValue}>{monthInfo.firstDayOfWeek}</ThemedText>
            </ThemedView>
          </View>
        </ThemedView>

        {/* 今日に戻るボタン */}
        <TouchableOpacity
          style={[styles.todayButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={goToToday}
        >
          <ThemedText style={[styles.todayButtonText, { color: Colors[colorScheme ?? 'light'].background }]}>
            今日に戻る
          </ThemedText>
        </TouchableOpacity>
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
  contentContainer: {
    paddingTop: 10,
    paddingBottom: 30,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  headerIcon: {
    marginBottom: 5,
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 24,
  },
  monthControlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  monthButton: {
    padding: 12,
    borderRadius: 8,
  },
  monthTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  calendarContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDayItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekDayText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayItem: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    marginBottom: 2,
  },
  todayItem: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  selectedItem: {
    backgroundColor: '#2196F3',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  selectedText: {
    color: '#000000', // 選択時は黒文字
    fontWeight: 'bold',
  },
  otherMonthText: {
    opacity: 0.3,
  },
  todayText: {
    fontWeight: 'bold',
  },
  selectedDateContainer: {
    alignItems: 'center',
    marginHorizontal: 15,
    marginBottom: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  selectedDateTitle: {
    marginBottom: 8,
    fontSize: 16,
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  goToDateButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  goToDateButtonText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  monthInfoContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  monthInfoTitle: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  monthInfoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  monthInfoItem: {
    alignItems: 'center',
    flex: 1,
  },
  monthInfoLabel: {
    fontSize: 12,
    marginBottom: 5,
  },
  monthInfoValue: {
    fontSize: 18,
  },
  todayButton: {
    marginHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  todayButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
