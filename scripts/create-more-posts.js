const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

const posts = [
  {
    title: "How to Read GPS Coordinates from Photos: A Complete Guide",
    slug: "how-to-read-gps-coordinates-from-photos",
    excerpt: "Learn how to extract GPS coordinates from photo metadata and use them for location analysis and mapping.",
    content: `
<p>GPS coordinates embedded in photos are a goldmine of location data. Whether you're organizing your photo collection or conducting professional analysis, understanding how to extract and use this data is essential.</p>

<h2>What Are GPS Coordinates in Photos?</h2>

<p>When you take a photo with location services enabled, your device automatically embeds GPS coordinates in the image's EXIF data. This includes:</p>

<ul>
<li><strong>Latitude</strong>: North-south position</li>
<li><strong>Longitude</strong>: East-west position</li>
<li><strong>Altitude</strong>: Height above sea level</li>
<li><strong>Timestamp</strong>: When the photo was taken</li>
</ul>

<h2>Methods to Extract GPS Data</h2>

<h3>1. Using Pic2Nav Web App</h3>
<p>The easiest way to extract GPS coordinates is through our web application:</p>
<ol>
<li>Upload your photo to Pic2Nav</li>
<li>View the automatically extracted coordinates</li>
<li>See the location on an interactive map</li>
<li>Export the data in various formats</li>
</ol>

<h3>2. Manual EXIF Reading</h3>
<p>For technical users, you can read EXIF data directly using tools like:</p>
<ul>
<li>ExifTool (command line)</li>
<li>Adobe Lightroom</li>
<li>Online EXIF viewers</li>
</ul>

<h2>Understanding Coordinate Formats</h2>

<p>GPS coordinates can be displayed in different formats:</p>

<h3>Decimal Degrees (DD)</h3>
<p>Example: 40.7128, -74.0060 (New York City)</p>

<h3>Degrees, Minutes, Seconds (DMS)</h3>
<p>Example: 40°42'46.0"N 74°00'21.6"W</p>

<h2>Common Issues and Solutions</h2>

<h3>No GPS Data Found</h3>
<ul>
<li>Location services were disabled</li>
<li>Photo was taken indoors with poor GPS signal</li>
<li>Privacy settings stripped the data</li>
</ul>

<h3>Inaccurate Coordinates</h3>
<ul>
<li>GPS signal interference</li>
<li>Device calibration issues</li>
<li>Atmospheric conditions</li>
</ul>

<h2>Professional Applications</h2>

<h3>Real Estate</h3>
<p>Verify property locations and create accurate listings with precise coordinates.</p>

<h3>Photography</h3>
<p>Organize shoots by location and create location-based portfolios.</p>

<h3>Research</h3>
<p>Analyze spatial patterns and conduct geographic studies.</p>

<h2>Privacy Considerations</h2>

<p>Always be aware that GPS data in photos can reveal sensitive location information. Consider:</p>
<ul>
<li>Stripping GPS data before sharing photos online</li>
<li>Using privacy-focused sharing platforms</li>
<li>Being selective about which photos contain location data</li>
</ul>

<h2>Try It Yourself</h2>

<p>Ready to extract GPS coordinates from your photos? Upload an image to Pic2Nav and see the location data instantly displayed on an interactive map.</p>
    `,
    category: "Tutorial",
    coverImage: "/images/app-screenshot-2.jpg"
  },
  {
    title: "Building Recognition Technology: How AI Identifies Structures",
    slug: "building-recognition-technology-ai-identifies-structures",
    excerpt: "Explore the fascinating world of AI-powered building recognition and how computer vision identifies architectural structures.",
    content: `
<p>Building recognition technology has revolutionized how we analyze and understand architectural structures in photographs. From identifying famous landmarks to cataloging urban development, AI-powered systems can now recognize buildings with remarkable accuracy.</p>

<h2>How Building Recognition Works</h2>

<p>Modern building recognition systems use a combination of technologies:</p>

<h3>Computer Vision</h3>
<p>Advanced algorithms analyze visual features like:</p>
<ul>
<li>Architectural styles and patterns</li>
<li>Building materials and textures</li>
<li>Structural elements (windows, doors, rooflines)</li>
<li>Surrounding context and environment</li>
</ul>

<h3>Machine Learning Models</h3>
<p>Trained on millions of building images, these models can:</p>
<ul>
<li>Classify architectural styles</li>
<li>Identify specific landmarks</li>
<li>Estimate building age and purpose</li>
<li>Recognize construction materials</li>
</ul>

<h2>Applications in Different Industries</h2>

<h3>Urban Planning</h3>
<p>City planners use building recognition to:</p>
<ul>
<li>Monitor urban development</li>
<li>Assess architectural heritage</li>
<li>Plan infrastructure improvements</li>
<li>Analyze building density patterns</li>
</ul>

<h3>Real Estate</h3>
<p>Property professionals leverage this technology for:</p>
<ul>
<li>Automated property valuation</li>
<li>Market analysis and trends</li>
<li>Investment opportunity identification</li>
<li>Property condition assessment</li>
</ul>

<h3>Insurance</h3>
<p>Insurance companies use building recognition for:</p>
<ul>
<li>Risk assessment</li>
<li>Claims processing</li>
<li>Property verification</li>
<li>Damage evaluation</li>
</ul>

<h2>Technical Challenges</h2>

<h3>Architectural Diversity</h3>
<p>Buildings vary enormously across:</p>
<ul>
<li>Cultural and regional styles</li>
<li>Historical periods</li>
<li>Construction materials</li>
<li>Functional purposes</li>
</ul>

<h3>Environmental Factors</h3>
<p>Recognition accuracy can be affected by:</p>
<ul>
<li>Lighting conditions</li>
<li>Weather and seasons</li>
<li>Viewing angles</li>
<li>Obstructions and vegetation</li>
</ul>

<h2>The Future of Building Recognition</h2>

<h3>Enhanced Accuracy</h3>
<p>Ongoing improvements include:</p>
<ul>
<li>Better training datasets</li>
<li>Advanced neural networks</li>
<li>Multi-modal analysis (combining visual and textual data)</li>
<li>Real-time processing capabilities</li>
</ul>

<h3>New Applications</h3>
<p>Emerging use cases include:</p>
<ul>
<li>Augmented reality city guides</li>
<li>Automated building inspections</li>
<li>Historical preservation projects</li>
<li>Smart city infrastructure</li>
</ul>

<h2>Try Building Recognition</h2>

<p>Experience the power of AI building recognition with Pic2Nav. Upload any photo containing buildings and see how our system identifies architectural features, estimates building types, and provides detailed analysis.</p>
    `,
    category: "Technology",
    coverImage: "/images/app-screenshot-3.jpg"
  },
  {
    title: "Location Privacy: Protecting Your Photo Metadata",
    slug: "location-privacy-protecting-photo-metadata",
    excerpt: "Learn how to protect your privacy by managing location data in photos and understanding metadata security.",
    content: `
<p>In our connected world, photos contain more information than meets the eye. Location metadata embedded in images can reveal sensitive information about your whereabouts, habits, and personal life. Understanding how to manage this data is crucial for maintaining privacy.</p>

<h2>What is Photo Metadata?</h2>

<p>Photo metadata, stored in EXIF format, includes:</p>
<ul>
<li><strong>GPS coordinates</strong>: Exact location where photo was taken</li>
<li><strong>Timestamp</strong>: Date and time of capture</li>
<li><strong>Device information</strong>: Camera model, settings</li>
<li><strong>Software details</strong>: Editing applications used</li>
</ul>

<h2>Privacy Risks</h2>

<h3>Location Tracking</h3>
<p>GPS data in photos can reveal:</p>
<ul>
<li>Your home and work addresses</li>
<li>Daily routines and patterns</li>
<li>Vacation destinations</li>
<li>Sensitive locations you've visited</li>
</ul>

<h3>Social Engineering</h3>
<p>Malicious actors can use metadata to:</p>
<ul>
<li>Stalk or harass individuals</li>
<li>Plan burglaries when you're away</li>
<li>Gather intelligence for scams</li>
<li>Build detailed profiles of your activities</li>
</ul>

<h2>How to Protect Your Privacy</h2>

<h3>Disable Location Services</h3>
<p>On your device:</p>
<ol>
<li><strong>iPhone</strong>: Settings > Privacy & Security > Location Services > Camera</li>
<li><strong>Android</strong>: Settings > Apps > Camera > Permissions > Location</li>
<li><strong>Digital Cameras</strong>: Check GPS settings in menu</li>
</ol>

<h3>Strip Metadata Before Sharing</h3>
<p>Remove location data using:</p>
<ul>
<li><strong>Built-in tools</strong>: Many social platforms automatically strip metadata</li>
<li><strong>Photo editing apps</strong>: Most editors can remove EXIF data</li>
<li><strong>Online tools</strong>: Web-based metadata removers</li>
<li><strong>Pic2Nav</strong>: Our platform offers metadata management tools</li>
</ul>

<h2>Platform-Specific Privacy</h2>

<h3>Social Media</h3>
<ul>
<li><strong>Facebook/Instagram</strong>: Automatically strips most metadata</li>
<li><strong>Twitter</strong>: Removes GPS data by default</li>
<li><strong>WhatsApp</strong>: Compresses images, removing metadata</li>
<li><strong>Email</strong>: Usually preserves all metadata</li>
</ul>

<h3>Cloud Storage</h3>
<ul>
<li><strong>Google Photos</strong>: Preserves metadata but controls access</li>
<li><strong>iCloud</strong>: Maintains metadata for personal use</li>
<li><strong>Dropbox</strong>: Preserves original files with metadata</li>
</ul>

<h2>Best Practices for Privacy</h2>

<h3>Selective Location Sharing</h3>
<ul>
<li>Enable GPS only when needed</li>
<li>Review photos before sharing</li>
<li>Use privacy-focused sharing methods</li>
<li>Consider delayed posting of location-sensitive content</li>
</ul>

<h3>Regular Privacy Audits</h3>
<ul>
<li>Check your device's location settings</li>
<li>Review app permissions regularly</li>
<li>Audit your social media privacy settings</li>
<li>Monitor what information you're sharing</li>
</ul>

<h2>Professional Considerations</h2>

<h3>Business Photography</h3>
<p>For professional photographers:</p>
<ul>
<li>Inform clients about metadata policies</li>
<li>Offer metadata removal services</li>
<li>Use secure file transfer methods</li>
<li>Maintain client privacy standards</li>
</ul>

<h3>Legal Requirements</h3>
<p>Some industries require:</p>
<ul>
<li>GDPR compliance for EU clients</li>
<li>HIPAA compliance for healthcare</li>
<li>Industry-specific privacy standards</li>
<li>Data retention policies</li>
</ul>

<h2>Tools for Metadata Management</h2>

<h3>Free Options</h3>
<ul>
<li>ExifTool (command line)</li>
<li>GIMP (image editor)</li>
<li>Online EXIF removers</li>
</ul>

<h3>Professional Solutions</h3>
<ul>
<li>Adobe Lightroom</li>
<li>Capture One</li>
<li>Pic2Nav metadata tools</li>
</ul>

<h2>Balancing Privacy and Functionality</h2>

<p>While privacy is important, location data can be valuable for:</p>
<ul>
<li>Organizing photo collections</li>
<li>Creating travel memories</li>
<li>Professional documentation</li>
<li>Emergency situations</li>
</ul>

<p>The key is making informed decisions about when and how to share location information.</p>

<h2>Take Control of Your Privacy</h2>

<p>Use Pic2Nav's metadata management tools to view, edit, and remove location data from your photos. Take control of your privacy while still enjoying the benefits of location-aware photography.</p>
    `,
    category: "Guide",
    coverImage: "/images/app-screenshot-4.jpg"
  }
]

async function createPosts() {
  try {
    let author = await prisma.user.findFirst({
      where: { email: 'admin@ssabiroad.com' }
    })

    if (!author) {
      author = await prisma.user.create({
        data: {
          id: 'admin-ssabiroad-team',
          email: 'admin@ssabiroad.com',
          name: 'SSABIRoad Team',
          updatedAt: new Date()
        }
      })
    }

    for (const postData of posts) {
      const post = await prisma.blogPost.create({
        data: {
          ...postData,
          published: true,
          authorId: author.id,
          likes: Math.floor(Math.random() * 50) + 10,
          views: Math.floor(Math.random() * 1000) + 100,
          createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        }
      })
      console.log('Created post:', post.title)
    }

    console.log('All posts created successfully!')
  } catch (error) {
    console.error('Error creating posts:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createPosts()