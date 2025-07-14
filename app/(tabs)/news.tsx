import React, { useEffect, useState } from 'react';
import { Alert, Image, RefreshControl, SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import * as Haptics from 'expo-haptics';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface Article {
  title: string;
  url: string;
  imageUrl: string;
  publishedDate: string;
  slug: string;
  sortKey: string;
}

export default function NewsScreen() {
  const colorScheme = useColorScheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

 // トップページから記事情報を完全に取得
const fetchArticlesFromTopPage = async (): Promise<Article[]> => {
  try {
    const response = await fetch('https://www.gamesanpi.com/');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const articles: Article[] = [];
    const seenUrls = new Set<string>(); // 重複チェック用
    
    console.log('HTMLを取得しました。サイズ:', html.length);
    
    // 記事ブロックを包括的に検索（画像、URL、タイトルを同時取得）
    const articleBlockRegex = /<a[^>]*href="\/news\/([a-zA-Z0-9-]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]*)"[^>]*[\s\S]*?<h3[^>]*>([^<]+)<\/h3>[\s\S]*?<\/a>/g;
    let blockMatch;
    
    while ((blockMatch = articleBlockRegex.exec(html)) !== null) {
      const slug = blockMatch[1];
      const imageSrc = blockMatch[2];
      const title = blockMatch[3]
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
      
      // 重複チェック
      if (seenUrls.has(fullUrl)) {
        console.log('重複記事をスキップ:', fullUrl);
        continue;
      }
      
      // 有効なタイトルかチェック
      if (title.length > 5 && 
          title !== 'カテゴリー' && 
          title !== '人気記事' && 
          title !== 'ゲーム賛否' &&
          title !== '人気タグ' &&
          !title.includes('span') &&
          !title.includes('記事') &&
          !title.includes('タグ') &&
          !title.includes('カテゴリ')) {
        
        seenUrls.add(fullUrl); // 重複チェック用に追加
        
        // 日付部分を抽出
        const dateMatch = slug.match(/^(\d{2})(\d{2})(\d{2})(\d{2})/);
        let publishedDate = '';
        let year = '';
        let month = '';
        let sortKey = '';
        
        if (dateMatch) {
          year = `20${dateMatch[1]}`;
          month = dateMatch[2];
          const day = dateMatch[3];
          publishedDate = `${year}年${month}月${day}日`;
          sortKey = `${year}${month}${day}${dateMatch[4]}`;
        }
        
        // 画像URLを処理
        let imageUrl = imageSrc;
        if (imageSrc.startsWith('/')) {
          imageUrl = `https://www.gamesanpi.com${imageSrc}`;
        }
        
        const article: Article = {
          title,
          url: fullUrl,
          imageUrl,
          publishedDate,
          slug,
          sortKey
        };
        
        articles.push(article);
        console.log('記事追加:', article.title, '->', article.url);
      }
    }
    
    // 代替パターン：より柔軟な検索
    if (articles.length === 0) {
      console.log('メインパターンで取得できず、代替パターンを試行');
      
      // 画像とURLを別々に検索
      const urlRegex = /href="\/news\/([a-zA-Z0-9-]+)"/g;
      const imageRegex = /<img[^>]*src="([^"]*\/images\/articles\/[^"]*)"[^>]*>/g;
      const titleRegex = /<h3[^>]*>([^<]+)<\/h3>/g;
      
      const urls: string[] = [];
      const images: string[] = [];
      const titles: string[] = [];
      const seenSlugs = new Set<string>(); // 代替パターンでも重複チェック
      
      // URL収集（重複除去）
      let urlMatch;
      while ((urlMatch = urlRegex.exec(html)) !== null) {
        const slug = urlMatch[1];
        if (!seenSlugs.has(slug)) {
          seenSlugs.add(slug);
          urls.push(`https://gamesanpi.com/news/${slug}`);
        }
      }
      
      // 画像収集
      let imageMatch;
      while ((imageMatch = imageRegex.exec(html)) !== null) {
        let imageUrl = imageMatch[1];
        if (imageUrl.startsWith('/')) {
          imageUrl = `https://www.gamesanpi.com${imageUrl}`;
        }
        images.push(imageUrl);
      }
      
      // タイトル収集
      let titleMatch;
      const seenTitles = new Set<string>(); // タイトルの重複もチェック
      while ((titleMatch = titleRegex.exec(html)) !== null) {
        const title = titleMatch[1]
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/&nbsp;/g, ' ')
          .replace(/&#x27;/g, "'")
          .replace(/&#x2F;/g, '/')
          .trim();
        
        if (title.length > 10 && 
            title !== 'カテゴリー' && 
            title !== '人気記事' && 
            title !== 'ゲーム賛否' &&
            title !== '人気タグ' &&
            !title.includes('span') &&
            !title.includes('記事') &&
            !title.includes('タグ') &&
            !title.includes('カテゴリ') &&
            !seenTitles.has(title)) {
          seenTitles.add(title);
          titles.push(title);
        }
      }
      
      console.log('代替検索結果 - URL:', urls.length, 'Image:', images.length, 'Title:', titles.length);
      
      // 順序ベースでマッピング（重複チェック付き）
      const minLength = Math.min(urls.length, Math.min(images.length, titles.length));
      for (let i = 0; i < minLength; i++) {
        const url = urls[i];
        const slug = url.split('/').pop() || '';
        
        // 重複チェック
        if (seenUrls.has(url)) {
          console.log('代替パターンで重複記事をスキップ:', url);
          continue;
        }
        seenUrls.add(url);
        
        // 日付部分を抽出
        const dateMatch = slug.match(/^(\d{2})(\d{2})(\d{2})(\d{2})/);
        let publishedDate = '';
        let year = '';
        let month = '';
        let sortKey = '';
        
        if (dateMatch) {
          year = `20${dateMatch[1]}`;
          month = dateMatch[2];
          const day = dateMatch[3];
          publishedDate = `${year}年${month}月${day}日`;
          sortKey = `${year}${month}${day}${dateMatch[4]}`;
        }
        
        const article: Article = {
          title: titles[i],
          url: url,
          imageUrl: images[i],
          publishedDate,
          slug,
          sortKey
        };
        
        articles.push(article);
        console.log('代替記事追加:', article.title);
      }
    }
    
    console.log('取得した記事数（重複除去前）:', articles.length);
    
    // 最終的な重複除去（タイトルベース）
    const uniqueArticles = articles.filter((article, index, self) => 
      index === self.findIndex(a => a.url === article.url)
    );
    
    console.log('取得した記事数（重複除去後）:', uniqueArticles.length);
    return uniqueArticles;
    
  } catch (error) {
    console.error('トップページからの記事取得エラー:', error);
    throw error;
  }
};

  // 記事一覧を取得
  const fetchArticles = async () => {
    try {
      setError(null);
      
      // トップページから記事情報を取得
      const articleData = await fetchArticlesFromTopPage();
      
      if (articleData.length === 0) {
        throw new Error('記事が見つかりませんでした');
      }
      
      // 日付順でソート（新しい順）
      const sortedArticles = articleData.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
      
      // 最大10記事に制限
      const finalArticles = sortedArticles.slice(0, 10);
      setArticles(finalArticles);
      
      console.log('最終記事数:', finalArticles.length);
      console.log('記事例:', finalArticles.slice(0, 3).map(a => ({ 
        title: a.title.substring(0, 50) + '...', 
        url: a.url,
        imageUrl: a.imageUrl
      })));
      
    } catch (err) {
      console.error('記事の取得に失敗しました:', err);
      setError(err instanceof Error ? err.message : '記事の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 記事をブラウザで開く
  const openArticle = async (article: Article) => {
    try {
      await WebBrowser.openBrowserAsync(article.url);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (error) {
      console.error('ブラウザを開けませんでした:', error);
      Alert.alert('エラー', 'ブラウザを開けませんでした');
    }
  };

  // リフレッシュ
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchArticles();
    setRefreshing(false);
  };

  // 初回読み込み
  useEffect(() => {
    fetchArticles();
  }, []);

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
            name="newspaper.fill" 
            color={Colors[colorScheme ?? 'light'].tint}
            style={styles.headerIcon}
          />
          <ThemedText type="title" style={styles.headerTitle}>
            ゲーム賛否ニュース
          </ThemedText>
          <ThemedText type="default" style={styles.headerSubtitle}>
            最新記事
          </ThemedText>
        </ThemedView>

        {loading ? (
          <ThemedView style={styles.loadingContainer}>
            <ThemedText type="default">記事を読み込み中...</ThemedText>
          </ThemedView>
        ) : error ? (
          <ThemedView style={styles.errorContainer}>
            <ThemedText type="default" style={styles.errorText}>
              {error}
            </ThemedText>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
              onPress={fetchArticles}
            >
              <ThemedText style={[styles.retryButtonText, { color: Colors[colorScheme ?? 'light'].background }]}>
                再試行
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <ThemedView style={styles.articlesContainer}>
            {articles.map((article, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.articleCard, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}
                onPress={() => openArticle(article)}
              >
                <View style={styles.articleImageContainer}>
                  <Image
                    source={{ uri: article.imageUrl }}
                    style={styles.articleImage}
                    resizeMode="cover"
                    onError={() => {
                      console.log('画像の読み込みに失敗:', article.imageUrl);
                    }}
                  />
                  <View style={styles.articleImageOverlay}>
                    <IconSymbol 
                      size={24} 
                      name="arrow.up.right.square" 
                      color="white"
                    />
                  </View>
                </View>
                
                <View style={styles.articleContent}>
                  <ThemedText type="subtitle" style={styles.articleTitle} numberOfLines={3}>
                    {article.title}
                  </ThemedText>
                  
                  <ThemedText type="default" style={styles.articleDate}>
                    {article.publishedDate}
                  </ThemedText>
                  
                  <TouchableOpacity
                    style={[styles.readMoreButton, { backgroundColor: Colors[colorScheme ?? 'light'].tint + '20' }]}
                    onPress={() => openArticle(article)}
                  >
                    <ThemedText style={[styles.readMoreButtonText, { color: Colors[colorScheme ?? 'light'].tint }]}>
                      記事を読む
                    </ThemedText>
                    <IconSymbol 
                      size={16} 
                      name="chevron.right" 
                      color={Colors[colorScheme ?? 'light'].tint}
                    />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
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
  articlesContainer: {
    paddingHorizontal: 15,
  },
  articleCard: {
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
  },
  articleImageContainer: {
    position: 'relative',
    height: 200,
  },
  articleImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  articleImageOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
    borderRadius: 6,
  },
  articleContent: {
    padding: 15,
  },
  articleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    lineHeight: 22,
  },
  articleDate: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 12,
  },
  readMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  readMoreButtonText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
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