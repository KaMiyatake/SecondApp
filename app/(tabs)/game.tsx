import React, { useState } from 'react';
import { Animated, Dimensions, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import * as Haptics from 'expo-haptics';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

type Choice = 'rock' | 'paper' | 'scissors';
type GameResult = 'win' | 'lose' | 'draw';

interface GameStats {
  wins: number;
  losses: number;
  draws: number;
  totalGames: number;
}

const CHOICES: { [key in Choice]: { icon: string; name: string; emoji: string } } = {
  rock: { icon: '🗿', name: 'グー', emoji: '✊' },
  paper: { icon: '📄', name: 'パー', emoji: '✋' },
  scissors: { icon: '✂️', name: 'チョキ', emoji: '✌️' },
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function GameScreen() {
  const colorScheme = useColorScheme();
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [computerChoice, setComputerChoice] = useState<Choice | null>(null);
  const [result, setResult] = useState<GameResult | null>(null);
  const [gameStats, setGameStats] = useState<GameStats>({
    wins: 0,
    losses: 0,
    draws: 0,
    totalGames: 0,
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [animationValue] = useState(new Animated.Value(0));

  // じゃんけんの勝敗判定
  const determineWinner = (player: Choice, computer: Choice): GameResult => {
    if (player === computer) return 'draw';
    
    const winConditions: { [key in Choice]: Choice } = {
      rock: 'scissors',
      paper: 'rock',
      scissors: 'paper',
    };

    return winConditions[player] === computer ? 'win' : 'lose';
  };

  // コンピューターの選択をランダムに決定
  const getComputerChoice = (): Choice => {
    const choices: Choice[] = ['rock', 'paper', 'scissors'];
    return choices[Math.floor(Math.random() * choices.length)];
  };

  // アニメーション開始
  const startAnimation = () => {
    Animated.sequence([
      Animated.timing(animationValue, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(animationValue, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // ゲーム開始
  const startGame = (choice: Choice) => {
    if (isPlaying) return;

    setIsPlaying(true);
    setPlayerChoice(choice);
    setResult(null);
    setComputerChoice(null);

    // 触覚フィードバック
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // カウントダウン開始
    let count = 3;
    setCountdown(count);

    const countdownTimer = setInterval(() => {
      count--;
      if (count > 0) {
        setCountdown(count);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        setCountdown(null);
        clearInterval(countdownTimer);
        
        // ゲーム実行
        const compChoice = getComputerChoice();
        setComputerChoice(compChoice);
        
        const gameResult = determineWinner(choice, compChoice);
        setResult(gameResult);
        
        // 統計更新
        setGameStats(prev => ({
          ...prev,
          [gameResult === 'win' ? 'wins' : gameResult === 'lose' ? 'losses' : 'draws']: 
            prev[gameResult === 'win' ? 'wins' : gameResult === 'lose' ? 'losses' : 'draws'] + 1,
          totalGames: prev.totalGames + 1,
        }));

        // 結果に応じた触覚フィードバック
        if (gameResult === 'win') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (gameResult === 'lose') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }

        startAnimation();
        setIsPlaying(false);
      }
    }, 1000);
  };

  // 統計リセット
  const resetStats = () => {
    setGameStats({
      wins: 0,
      losses: 0,
      draws: 0,
      totalGames: 0,
    });
    setResult(null);
    setPlayerChoice(null);
    setComputerChoice(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // 結果メッセージ
  const getResultMessage = () => {
    if (!result) return '';
    switch (result) {
      case 'win': return '🎉 あなたの勝ち！';
      case 'lose': return '😅 あなたの負け...';
      case 'draw': return '🤝 引き分け！';
    }
  };

  // 勝率計算
  const getWinRate = () => {
    if (gameStats.totalGames === 0) return 0;
    return Math.round((gameStats.wins / gameStats.totalGames) * 100);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* <ThemedView style={styles.headerContainer}>
          <IconSymbol 
            size={40} 
            name="gamecontroller.fill" 
            color={Colors[colorScheme ?? 'light'].tint}
            style={styles.headerIcon}
          />
          <ThemedText type="title" style={styles.headerTitle}>
            じゃんけんゲーム
          </ThemedText>
        </ThemedView> */}

        {/* カウントダウン表示 */}
        {countdown && (
          <ThemedView style={styles.countdownContainer}>
            <ThemedText type="title" style={styles.countdownText}>
              {countdown}
            </ThemedText>
          </ThemedView>
        )}

        {/* ゲーム結果表示 */}
        {result && !isPlaying && (
          <Animated.View
            style={[
              styles.resultContainer,
              {
                transform: [{
                  scale: animationValue.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.1],
                  }),
                }],
              },
            ]}
          >
            <ThemedView style={[
              styles.resultBox,
              { backgroundColor: result === 'win' ? '#4CAF50' : result === 'lose' ? '#F44336' : '#FF9800' }
            ]}>
              <ThemedText type="subtitle" style={styles.resultText}>
                {getResultMessage()}
              </ThemedText>
            </ThemedView>
          </Animated.View>
        )}

        {/* 選択表示 */}
        {playerChoice && computerChoice && (
          <ThemedView style={styles.choicesContainer}>
            <ThemedView style={styles.choiceBox}>
              <ThemedText type="defaultSemiBold" style={styles.choiceLabel}>あなた</ThemedText>
              <ThemedText style={styles.choiceEmoji}>{CHOICES[playerChoice].emoji}</ThemedText>
              <ThemedText type="default" style={styles.choiceName}>{CHOICES[playerChoice].name}</ThemedText>
            </ThemedView>
            
            <ThemedText type="subtitle" style={styles.vsText}>VS</ThemedText>
            
            <ThemedView style={styles.choiceBox}>
              <ThemedText type="defaultSemiBold" style={styles.choiceLabel}>コンピューター</ThemedText>
              <ThemedText style={styles.choiceEmoji}>{CHOICES[computerChoice].emoji}</ThemedText>
              <ThemedText type="default" style={styles.choiceName}>{CHOICES[computerChoice].name}</ThemedText>
            </ThemedView>
          </ThemedView>
        )}

        {/* ゲームボタン */}
        <ThemedView style={styles.gameButtonsContainer}>
          <ThemedText type="defaultSemiBold" style={styles.instructionText}>
            じゃんけんぽい！　※選択してください
          </ThemedText>
          
          <View style={styles.buttonRow}>
            {(Object.keys(CHOICES) as Choice[]).map((choice) => (
              <TouchableOpacity
                key={choice}
                style={[
                  styles.gameButton,
                  { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' },
                  isPlaying && styles.gameButtonDisabled,
                ]}
                onPress={() => startGame(choice)}
                disabled={isPlaying}
              >
                <ThemedText style={styles.buttonEmoji}>{CHOICES[choice].emoji}</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.buttonText}>{CHOICES[choice].name}</ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </ThemedView>

        {/* 統計表示 */}
        <ThemedView style={styles.statsContainer}>
          <ThemedText type="defaultSemiBold" style={styles.statsTitle}>
            📊 ゲーム統計
          </ThemedText>
          
          <View style={styles.statsGrid}>
            <ThemedView style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statLabel}>総ゲーム数</ThemedText>
              <ThemedText type="title" style={styles.statValue}>{gameStats.totalGames}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statLabel}>勝利</ThemedText>
              <ThemedText type="title" style={[styles.statValue, styles.winText]}>{gameStats.wins}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statLabel}>敗北</ThemedText>
              <ThemedText type="title" style={[styles.statValue, styles.loseText]}>{gameStats.losses}</ThemedText>
            </ThemedView>
            
            <ThemedView style={styles.statItem}>
              <ThemedText type="defaultSemiBold" style={styles.statLabel}>引き分け</ThemedText>
              <ThemedText type="title" style={[styles.statValue, styles.drawText]}>{gameStats.draws}</ThemedText>
            </ThemedView>
          </View>
          
          <ThemedView style={styles.winRateContainer}>
            <ThemedText type="defaultSemiBold" style={styles.winRateText}>勝率: {getWinRate()}%</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* リセットボタン */}
        <TouchableOpacity
          style={[styles.resetButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={resetStats}
        >
          <ThemedText style={[styles.resetButtonText, { color: Colors[colorScheme ?? 'light'].background }]}>
            統計をリセット
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
  countdownContainer: {
    alignItems: 'center',
    marginBottom: 15,
    minHeight: 80,
    justifyContent: 'center',
  },
  countdownText: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  resultContainer: {
    alignItems: 'center',
    marginBottom: 15,
  },
  resultBox: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginHorizontal: 20,
  },
  resultText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
  },
  choicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  choiceBox: {
    alignItems: 'center',
    flex: 1,
  },
  choiceLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  choiceEmoji: {
    fontSize: 36,
    marginVertical: 5,
  },
  choiceName: {
    fontSize: 14,
  },
  vsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 10,
  },
  gameButtonsContainer: {
    marginBottom: 20,
    paddingHorizontal: 15,
  },
  instructionText: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gameButton: {
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  gameButtonDisabled: {
    opacity: 0.5,
  },
  buttonEmoji: {
    fontSize: 32,
    marginBottom: 5,
  },
  buttonText: {
    fontSize: 14,
  },
  statsContainer: {
    marginHorizontal: 15,
    marginBottom: 20,
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  statsTitle: {
    textAlign: 'center',
    marginBottom: 15,
    fontSize: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  statItem: {
    alignItems: 'center',
    width: '48%',
    marginBottom: 10,
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 20,
  },
  winText: {
    color: '#4CAF50',
  },
  loseText: {
    color: '#F44336',
  },
  drawText: {
    color: '#FF9800',
  },
  winRateContainer: {
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  winRateText: {
    fontSize: 14,
  },
  resetButton: {
    marginHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
