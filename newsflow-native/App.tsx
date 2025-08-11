import React, { useState } from 'react';
import { SafeAreaView, View, Text, Image, StyleSheet, Button } from 'react-native';
import { mockNews } from './mockNews';
import { NewsArticle } from './types';

const App = () => {
  const [index, setIndex] = useState(0);

  const handleNext = () => {
    setIndex((prev) => prev + 1);
  };

  const article: NewsArticle | undefined = mockNews[index];

  if (!article) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>No more articles</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Image source={{ uri: article.imageUrl }} style={styles.image} />
      <Text style={styles.title}>{article.title}</Text>
      <Text style={styles.summary}>{article.summary}</Text>
      <View style={styles.buttons}>
        <Button title="Pass" onPress={handleNext} />
        <Button title="Like" onPress={handleNext} />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summary: {
    fontSize: 16,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

export default App;
