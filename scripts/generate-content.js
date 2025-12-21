const fs = require('fs');
const path = require('path');

const CONTENT_DIR = path.join(__dirname, '../../content/pic2nav');

if (!fs.existsSync(CONTENT_DIR)) {
  fs.mkdirSync(CONTENT_DIR, { recursive: true });
}

const CONTENT_TYPES = {
  // Social Media Posts
  social: [
    {
      platform: 'Twitter',
      content: `🚀 Lost in a new city? Just snap a photo!

Pic2Nav uses AI to identify your location from any building or landmark photo.

✅ No GPS needed
✅ Works offline
✅ Instant results

Download now: [LINK]

#Pic2Nav #AI #Navigation #Nigeria`,
      image: 'app-screenshot.jpg'
    },
    {
      platform: 'Instagram',
      content: `📸 Turn any photo into navigation! 

Pic2Nav identifies buildings and landmarks using advanced AI. Perfect for:

🏢 Finding addresses
🗺️ Exploring new areas  
📍 Sharing locations
🎯 Real estate hunting

Join 10,000+ users navigating smarter!

#Pic2Nav #AINavigation #SmartCity #Nigeria #TechInAfrica`,
      image: 'feature-showcase.jpg'
    },
    {
      platform: 'LinkedIn',
      content: `Introducing Pic2Nav: AI-Powered Location Intelligence for Nigeria

We're solving a critical problem: address discovery in areas with limited GPS accuracy.

Our solution:
• Computer vision + ML for building recognition
• 1,930+ Nigerian locations trained
• Crowdsourced data collection
• Gamification for user engagement

Built with Next.js, React Native, and custom ML models.

Currently live on Google Play. Growing 20% MoM.

#AI #MachineLearning #PropTech #Nigeria #Startup`,
      image: 'tech-stack.jpg'
    },
    {
      platform: 'Facebook',
      content: `🎉 Contribute & Earn Rewards! 🎉

Help us map Nigeria by uploading photos of buildings and landmarks.

Earn points for every photo:
💰 10 points per upload
🔥 20 points daily streak
🎁 50 points first contribution

Unlock badges: Explorer → Contributor → Champion → Legend → Master

Top contributors get featured on our leaderboard!

Download Pic2Nav and start earning today!`,
      image: 'gamification.jpg'
    }
  ],

  // Blog Posts
  blog: [
    {
      title: 'How Pic2Nav Uses AI to Identify Buildings from Photos',
      slug: 'how-pic2nav-ai-works',
      excerpt: 'Discover the technology behind Pic2Nav\'s location recognition system',
      content: `
# How Pic2Nav Uses AI to Identify Buildings from Photos

Ever wondered how Pic2Nav can identify a building just from a photo? Let's dive into the technology.

## The Challenge

Traditional GPS works great outdoors, but struggles with:
- Indoor locations
- Dense urban areas
- Areas with poor satellite coverage
- Exact building identification

## Our Solution

Pic2Nav uses a combination of:

### 1. Computer Vision
We use Google Cloud Vision API to extract visual features from photos - colors, shapes, textures, and architectural elements.

### 2. Machine Learning
Our custom ML model (built with FAISS) compares your photo against 3,851+ trained locations, finding the closest match.

### 3. Geospatial Data
We integrate OpenStreetMap data for accurate addresses and building information.

### 4. Crowdsourcing
Users contribute photos to improve accuracy. We've collected 1,930+ Nigerian locations so far.

## How It Works

1. **Take a photo** of any building or landmark
2. **AI analyzes** visual features
3. **ML model** finds matching location
4. **Get results** with address, map, and details

## Accuracy

- 85%+ accuracy in trained areas
- Improving daily with crowdsourced data
- Works even without GPS signal

## What's Next?

We're expanding to:
- 10,000+ Nigerian locations
- AR navigation features
- Real-time Street View integration
- Multi-city coverage across Africa

Try Pic2Nav today and experience the future of navigation!
      `,
      category: 'Technology',
      tags: ['AI', 'Machine Learning', 'Computer Vision', 'Navigation']
    },
    {
      title: 'Why We Built Pic2Nav: Solving Nigeria\'s Address Problem',
      slug: 'why-we-built-pic2nav',
      excerpt: 'The story behind Pic2Nav and the problem we\'re solving',
      content: `
# Why We Built Pic2Nav: Solving Nigeria's Address Problem

Nigeria has a unique challenge: many areas lack formal addressing systems.

## The Problem

- 60%+ of Nigerian addresses are informal
- GPS coordinates don't tell you the building name
- Delivery services struggle with "yellow house near the junction"
- Real estate listings lack precise locations

## Our Mission

Make location discovery as simple as taking a photo.

## The Solution

Pic2Nav lets you:
- Identify any building from a photo
- Get exact addresses instantly
- Share locations easily
- Navigate without GPS

## Impact

Since launch:
- 10,000+ downloads
- 1,930+ Nigerian locations mapped
- 85% user satisfaction
- Growing 20% monthly

## Join the Movement

Help us map Nigeria! Download Pic2Nav and contribute photos to earn rewards.

Together, we're building Africa's most comprehensive location database.
      `,
      category: 'Company',
      tags: ['Nigeria', 'Startup', 'Social Impact', 'PropTech']
    }
  ],

  // Video Scripts
  video: [
    {
      title: 'Pic2Nav - 30 Second Explainer',
      duration: '30s',
      script: `
[0-5s] VISUAL: Person lost in Lagos, looking confused
VOICEOVER: "Lost in a new area?"

[5-10s] VISUAL: Person takes photo of building with phone
VOICEOVER: "Just snap a photo!"

[10-20s] VISUAL: App analyzing photo, showing results
VOICEOVER: "Pic2Nav uses AI to identify the location instantly. No GPS needed!"

[20-25s] VISUAL: Map showing location, address details
VOICEOVER: "Get the exact address, map, and directions."

[25-30s] VISUAL: App logo, download button
VOICEOVER: "Pic2Nav. Navigate smarter. Download now!"
      `
    },
    {
      title: 'Pic2Nav - Feature Demo (2 minutes)',
      duration: '2m',
      script: `
[0-15s] INTRO
"Welcome to Pic2Nav - the smartest way to find locations in Nigeria"

[15-45s] PHOTO SCANNER
"Take a photo of any building or landmark"
"Our AI analyzes it in seconds"
"Get instant results with address and map"

[45-75s] NEARBY PLACES
"Discover what's around you"
"Restaurants, banks, hospitals, and more"
"All with accurate locations"

[75-105s] CONTRIBUTE & EARN
"Help us map Nigeria"
"Upload photos and earn points"
"Unlock badges and compete on the leaderboard"

[105-120s] CALL TO ACTION
"Join 10,000+ users navigating smarter"
"Download Pic2Nav today - free on Google Play"
      `
    }
  ],

  // Email Campaigns
  email: [
    {
      subject: 'Welcome to Pic2Nav! 🎉',
      content: `
Hi there!

Welcome to Pic2Nav - we're excited to have you!

Here's what you can do:

📸 PHOTO SCANNER
Take a photo of any building to identify its location instantly.

🗺️ NEARBY PLACES
Discover restaurants, banks, and services around you.

🏆 EARN REWARDS
Upload photos and earn points. Unlock badges and climb the leaderboard!

QUICK START:
1. Open the app
2. Tap "Scan Location"
3. Take a photo
4. Get instant results!

Need help? Reply to this email anytime.

Happy navigating!
The Pic2Nav Team

P.S. Contribute 5 photos this week and get 100 bonus points!
      `
    },
    {
      subject: 'You\'re on a 3-day streak! 🔥',
      content: `
Amazing work! You've contributed for 3 days straight!

Your Stats:
🏆 Points: 150
📸 Photos: 15
🔥 Streak: 3 days
🎯 Rank: #247

Keep it up! Contribute today to maintain your streak and earn 20 bonus points.

LEADERBOARD UPDATE:
You're 50 points away from the top 200!

Upload 5 more photos to climb the ranks.

[CONTRIBUTE NOW]

The Pic2Nav Team
      `
    }
  ],

  // Press Release
  press: {
    title: 'Pic2Nav Launches AI-Powered Location Discovery App for Nigeria',
    content: `
FOR IMMEDIATE RELEASE

Pic2Nav Launches AI-Powered Location Discovery App for Nigeria

Revolutionary app uses computer vision to identify buildings from photos, solving Nigeria's address discovery challenge

LAGOS, NIGERIA - [DATE] - Pic2Nav, an innovative location intelligence platform, today announced the launch of its mobile application that uses artificial intelligence to identify buildings and landmarks from photos.

The app addresses a critical challenge in Nigeria where many areas lack formal addressing systems, making it difficult for residents and visitors to find specific locations.

KEY FEATURES:
• AI-powered building recognition from photos
• Works without GPS signal
• Crowdsourced data collection with gamification
• 1,930+ Nigerian locations already mapped
• Free to download on Google Play

"We're solving a real problem that affects millions of Nigerians daily," said [FOUNDER NAME], CEO of Pic2Nav. "Whether you're looking for a business address, sharing your location, or exploring a new area, Pic2Nav makes it as simple as taking a photo."

The app has already attracted 10,000+ downloads and is growing 20% month-over-month. Users can also contribute to the platform by uploading photos and earning rewards through a gamification system.

ABOUT PIC2NAV:
Pic2Nav is a location intelligence platform that combines computer vision, machine learning, and crowdsourced data to help people discover and navigate locations in Nigeria and beyond.

For more information, visit: https://ssabiroad.com
Download: [Google Play Link]

MEDIA CONTACT:
[Name]
[Email]
[Phone]
    `
  }
};

// Generate all content files
console.log('📝 Generating Pic2Nav Content...\n');

// Social Media
const socialDir = path.join(CONTENT_DIR, 'social');
fs.mkdirSync(socialDir, { recursive: true });
CONTENT_TYPES.social.forEach((post, i) => {
  const filename = `${post.platform.toLowerCase()}-${i + 1}.txt`;
  fs.writeFileSync(path.join(socialDir, filename), post.content);
  console.log(`✅ Created: social/${filename}`);
});

// Blog Posts
const blogDir = path.join(CONTENT_DIR, 'blog');
fs.mkdirSync(blogDir, { recursive: true });
CONTENT_TYPES.blog.forEach(post => {
  const filename = `${post.slug}.md`;
  const content = `---
title: ${post.title}
slug: ${post.slug}
excerpt: ${post.excerpt}
category: ${post.category}
tags: ${post.tags.join(', ')}
date: ${new Date().toISOString().split('T')[0]}
---

${post.content}
`;
  fs.writeFileSync(path.join(blogDir, filename), content);
  console.log(`✅ Created: blog/${filename}`);
});

// Video Scripts
const videoDir = path.join(CONTENT_DIR, 'video');
fs.mkdirSync(videoDir, { recursive: true });
CONTENT_TYPES.video.forEach((video, i) => {
  const filename = `script-${i + 1}-${video.duration}.txt`;
  const content = `TITLE: ${video.title}
DURATION: ${video.duration}

${video.script}
`;
  fs.writeFileSync(path.join(videoDir, filename), content);
  console.log(`✅ Created: video/${filename}`);
});

// Email Campaigns
const emailDir = path.join(CONTENT_DIR, 'email');
fs.mkdirSync(emailDir, { recursive: true });
CONTENT_TYPES.email.forEach((email, i) => {
  const filename = `campaign-${i + 1}.txt`;
  const content = `SUBJECT: ${email.subject}

${email.content}
`;
  fs.writeFileSync(path.join(emailDir, filename), content);
  console.log(`✅ Created: email/${filename}`);
});

// Press Release
fs.writeFileSync(path.join(CONTENT_DIR, 'press-release.txt'), CONTENT_TYPES.press.content);
console.log(`✅ Created: press-release.txt`);

console.log(`\n📁 All content saved to: ${CONTENT_DIR}`);
console.log('\n🎯 Next Steps:');
console.log('1. Review and customize content');
console.log('2. Add images/screenshots');
console.log('3. Schedule social media posts');
console.log('4. Publish blog posts');
console.log('5. Send email campaigns');
