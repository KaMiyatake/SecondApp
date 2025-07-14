import React, { useEffect, useState } from 'react';
import { Alert, Dimensions, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const { width: screenWidth } = Dimensions.get('window');

interface IllustData {
  imageUrl: string;
  articleUrl: string;
  articleTitle: string;
  publishedDate: string;
  illustNumber: number;
  sortKey: string;
}

export default function IllustScreen() {
  const colorScheme = useColorScheme();
  const [illusts, setIllusts] = useState<IllustData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 記事情報を取得
  const fetchArticleData = async () => {
    try {
      const response = await fetch('https://www.gamesanpi.com/');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const html = await response.text();
      const articles: {url: string, title: string, slug: string, sortKey: string}[] = [];
      const seenUrls = new Set<string>();
      
      // 記事情報を抽出
      const articleBlockRegex = /<a[^>]*href="\/news\/([a-zA-Z0-9-]+)"[^>]*>[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<\/a>/g;
      let blockMatch;
      
      while ((blockMatch = articleBlockRegex.exec(html)) !== null) {
        const slug = blockMatch[1];
        const title = blockMatch[2]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/')
          .trim();
        
        const fullUrl = `https://gamesanpi.com/news/${slug}`;
        
        if (seenUrls.has(fullUrl)) continue;
        seenUrls.add(fullUrl);
        
        if (title.length > 5 && 
            title !== 'カテゴリー' && 
            title !== '人気記事' && 
            title !== 'ゲーム賛否' &&
            title !== '人気タグ' &&
            !title.includes('span') &&
            !title.includes('記事') &&
            !title.includes('タグ') &&
            !title.includes('カテゴリ')) {
          
          // 日付部分を抽出してソートキーを作成
          const dateMatch = slug.match(/^(\d{2})(\d{2})(\d{2})(\d{2})/);
          let sortKey = '';
          
          if (dateMatch) {
            const year = `20${dateMatch[1]}`;
            const month = dateMatch[2];
            const day = dateMatch[3];
            sortKey = `${year}${month}${day}${dateMatch[4]}`;
          }
          
          articles.push({
            url: fullUrl,
            title,
            slug,
            sortKey
          });
        }
      }
      
      console.log('取得した記事数:', articles.length);
      return articles.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
      
    } catch (error) {
      console.error('記事データの取得エラー:', error);
      throw error;
    }
  };

  // イラスト画像の存在チェック
  const checkIllustExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  };

  // イラストデータを取得
  const fetchIllustData = async () => {
    try {
      setError(null);
      
      // 記事データを取得
      const articles = await fetchArticleData();
      const illustData: IllustData[] = [];
      
      console.log('イラスト検索を開始...');
      
      // 各記事のイラストをチェック（最大15記事まで、イラスト10件を目指す）
      const maxArticlesToCheck = Math.min(articles.length, 15);
      
      for (let i = 0; i < maxArticlesToCheck && illustData.length < 10; i++) {
        const article = articles[i];
        const slug = article.slug;
        
        // 日付情報を抽出
        const dateMatch = slug.match(/^(\d{2})(\d{2})(\d{2})(\d{2})/);
        let publishedDate = '';
        let year = '';
        let month = '';
        
        if (dateMatch) {
          year = `20${dateMatch[1]}`;
          month = dateMatch[2];
          const day = dateMatch[3];
          publishedDate = `${year}年${month}月${day}日`;
        }
        
        // イラスト画像を順番にチェック（illust1.png, illust2.png, ...）
        for (let illustNum = 1; illustNum <= 3; illustNum++) {
          if (illustData.length >= 10) break;
          
          const illustUrl = `https://www.gamesanpi.com/images/articles/${year}/${month}/${slug}/illust${illustNum}.png`;
          
          console.log(`イラストチェック中: ${illustUrl}`);
          
          const exists = await checkIllustExists(illustUrl);
          
          if (exists) {
            const illustItem: IllustData = {
              imageUrl: illustUrl,
              articleUrl: article.url,
              articleTitle: article.title,
              publishedDate,
              illustNumber: illustNum,
              sortKey: `${article.sortKey}_${illustNum}`
            };
            
            illustData.push(illustItem);
            console.log('イラスト発見:', illustUrl);
          }
        }
      }
      
      console.log('最終イラスト数:', illustData.length);
      
      // 日付順でソート
      const sortedIllusts = illustData.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
      
      return sortedIllusts.slice(0, 10);
      
    } catch (error) {
      console.error('イラストデータの取得エラー:', error);
      throw error;
    }
  };

  // イラスト一覧を取得
  const fetchIllusts = async () => {
    try {
      setError(null);
      
      const illustData = await fetchIllustData();
      
      if (illustData.length === 0) {
        throw new Error('イラストが見つかりませんでした');
      }
      
      setIllusts(illustData);
      
    } catch (err) {
      console.error('イラストの取得に失敗しました:', err);
      setError(err instanceof Error ? err.message : 'イラストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 記事をブラウザで開く
  const openArticle = async (illustData: IllustData) => {
    try {
      await WebBrowser.openBrowserAsync(illustData.articleUrl);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('ブラウザを開けませんでした:', error);
      Alert.alert('エラー', 'ブラウザを開けませんでした');
    }
  };

  // リフレッシュ
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIllusts();
    setRefreshing(false);
  };

  // 初回読み込み
  useEffect(() => {
    fetchIllusts();
  }, []);

  // 縦型イラスト用のサイズ計算（3:4のアスペクト比）
  const imageWidth = (screenWidth - 45) / 2; // 2列表示
  const imageHeight = (imageWidth * 4) / 3; // 3:4のアスペクト比

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ThemedView style={styles.headerContainer}>
          <IconSymbol 
            size={40} 
            name="photo.on.rectangle" 
            color={Colors[colorScheme ?? 'light'].tint}
            style={styles.headerIcon}
          />
          <ThemedText type="title" style={styles.headerTitle}>
            記事イラスト
          </ThemedText>
          <ThemedText type="default" style={styles.headerSubtitle}>
            最新のイラスト
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ThemedText type="default">イラストを検索中...</ThemedText>
            <ThemedText type="default" style={styles.loadingSubtext}>
              画像の存在確認を行っています
            </ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={fetchIllusts}
            >
              <ThemedText style={[styles.retryButtonText, { color: Colors[colorScheme ?? 'light'].background }]}>
                再試行
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <ThemedView style={styles.illustsContainer}>
            <View style={styles.gridContainer}>
              {illusts.map((illust, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.illustCard, { width: imageWidth }]}
                  onPress={() => openArticle(illust)}
                >
                  <View style={styles.illustImageContainer}>
                    <Image
                      source={{ uri: illust.imageUrl }}
                      style={[styles.illustImage, { width: imageWidth, height: imageHeight }]}
                      resizeMode="cover"
                      onError={() => {
                        console.log('イラスト画像の読み込みに失敗:', illust.imageUrl);
                      }}
                    />
                    <View style={styles.illustOverlay}>
                      <IconSymbol 
                        size={20} 
                        name="arrow.up.right.square" 
                        color="white"
                      />
                    </View>
                  </View>
                  
                  <View style={styles.illustInfo}>
                    <ThemedText style={styles.illustTitle} numberOfLines={2}>
                      {illust.articleTitle}
                    </ThemedText>
                    
                    <ThemedText style={styles.illustDate}>
                      {illust.publishedDate}
                    </ThemedText>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ThemedView>
        )}

        <ThemedView style={styles.footer}>
          <ThemedText type="default" style={styles.footerText}>
            下に引っ張って更新
          </ThemedText>
          <TouchableOpacity
            style={[styles.siteButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => WebBrowser.openBrowserAsync('https://www.gamesanpi.com/')}
          >
            <ThemedText style={[styles.siteButtonText, { color: Colors[colorScheme ?? 'light'].background }]}>
              ゲーム賛否サイトを見る
            </ThemedText>
          </TouchableOpacity>
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
    marginBottom: 5,
  },
  headerSubtitle: {
    textAlign: 'center',
    fontSize: 14,
    opacity: 0.7,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingSubtext: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 10,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: 20,
    color: '#F44336',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  illustsContainer: {
    paddingHorizontal: 15,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  illustCard: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    backgroundColor: '#ffffff',
  },
  illustImageContainer: {
    position: 'relative',
  },
  illustImage: {
    backgroundColor: '#f0f0f0',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  illustOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 6,
    borderRadius: 4,
  },
  illustInfo: {
    padding: 8,
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  illustTitle: {
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
    color: '#000000',
    fontWeight: '500',
  },
  illustDate: {
    fontSize: 10,
    color: '#333333',
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
    paddingHorizontal: 20,
  },
  footerText: {
    opacity: 0.6,
    fontSize: 14,
    marginBottom: 15,
  },
  siteButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  siteButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
