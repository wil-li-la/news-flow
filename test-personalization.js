#!/usr/bin/env node

const API_BASE = 'https://a08y6nfdj0.execute-api.ap-southeast-2.amazonaws.com/prod';
const TEST_USER = 'test-user-personalization';

async function makeRequest(method, path, body = null) {
  const url = `${API_BASE}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  
  if (body) {
    options.body = JSON.stringify(body);
  }
  
  console.log(`${method} ${url}`);
  const response = await fetch(url, options);
  const data = await response.json();
  console.log('Response:', JSON.stringify(data, null, 2));
  return data;
}

async function testPersonalization() {
  console.log('🧪 Testing NewsFlow Personalization System\n');
  
  // 1. Check initial user state
  console.log('1️⃣ Checking initial user state...');
  const initialUser = await makeRequest('GET', `/user/${TEST_USER}`);
  console.log('\n');
  
  // 2. Update customization level (temperature)
  console.log('2️⃣ Setting customization level to 80%...');
  await makeRequest('PUT', `/user/${TEST_USER}`, {
    customizationLevel: 80,
    updatedAt: new Date().toISOString()
  });
  console.log('\n');
  
  // 3. Get some articles to like
  console.log('3️⃣ Getting articles to test with...');
  const articles = await makeRequest('GET', '/items?limit=3');
  console.log('\n');
  
  if (articles.length > 0) {
    const testArticle = articles[0];
    
    // 4. Track viewing an article
    console.log('4️⃣ Tracking article view...');
    await makeRequest('POST', `/user/${TEST_USER}/activity`, {
      articleId: testArticle.id,
      action: 'viewed',
      timestamp: new Date().toISOString()
    });
    console.log('\n');
    
    // 5. Track liking an article (should update preferences)
    console.log('5️⃣ Tracking article like (should learn preferences)...');
    await makeRequest('POST', `/user/${TEST_USER}/activity`, {
      articleId: testArticle.id,
      action: 'liked',
      timestamp: new Date().toISOString()
    });
    console.log('\n');
    
    // 6. Check updated user preferences
    console.log('6️⃣ Checking updated user preferences...');
    const updatedUser = await makeRequest('GET', `/user/${TEST_USER}`);
    console.log('\n');
    
    // 7. Test personalized news feed
    console.log('7️⃣ Testing personalized news feed...');
    const personalizedNews = await makeRequest('GET', `/items?limit=5&userId=${TEST_USER}`);
    console.log('\n');
    
    // 8. Summary
    console.log('📊 PERSONALIZATION TEST SUMMARY:');
    console.log('================================');
    console.log(`✅ User ID: ${TEST_USER}`);
    console.log(`✅ Customization Level: ${updatedUser.customizationLevel}%`);
    console.log(`✅ Total Activities: ${updatedUser.activities?.length || 0}`);
    console.log(`✅ Seen Articles: ${updatedUser.seenArticles?.length || 0}`);
    console.log(`✅ Preferred Sources: ${updatedUser.preferredSources?.length || 0}`);
    console.log(`✅ Preferred Categories: ${updatedUser.preferredCategories?.length || 0}`);
    console.log(`✅ Preferred Labels: ${updatedUser.preferredLabels?.length || 0}`);
    console.log(`✅ Personalized Articles Returned: ${personalizedNews.length}`);
    
    const hasPreferences = (updatedUser.preferredSources?.length || 0) > 0 || 
                          (updatedUser.preferredCategories?.length || 0) > 0 || 
                          (updatedUser.preferredLabels?.length || 0) > 0;
    
    console.log(`\n🎯 PERSONALIZATION STATUS: ${hasPreferences ? '✅ WORKING' : '❌ NOT WORKING'}`);
    
    if (hasPreferences) {
      console.log('\n🔥 Learned Preferences:');
      if (updatedUser.preferredSources?.length) {
        console.log(`   Sources: ${updatedUser.preferredSources.join(', ')}`);
      }
      if (updatedUser.preferredCategories?.length) {
        console.log(`   Categories: ${updatedUser.preferredCategories.join(', ')}`);
      }
      if (updatedUser.preferredLabels?.length) {
        console.log(`   Labels: ${updatedUser.preferredLabels.join(', ')}`);
      }
    }
  } else {
    console.log('❌ No articles available for testing');
  }
}

testPersonalization().catch(console.error);