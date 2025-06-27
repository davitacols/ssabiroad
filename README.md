# SSABIRoad - Smart Structural Analysis & Building Information Road

SSABIRoad is a sophisticated web application built with Next.js that provides comprehensive architectural and location analysis capabilities. The platform combines computer vision, geospatial data, and artificial intelligence to analyze buildings, locations, and urban environments.

## 🌟 Features

- **Building Analysis**
  - Architectural style detection
  - Material analysis
  - Structural condition assessment
  - Cultural significance evaluation
  - Energy efficiency metrics

- **Location Intelligence**
  - Precise geolocation tracking
  - Walkability and bike scores
  - Urban density analysis
  - Environmental metrics (air quality, noise levels)
  - Safety assessments

- **Smart Detection System**
  - Image-based building recognition
  - Landmark detection
  - Text recognition in architectural contexts
  - Similarity matching between buildings

- **User Features**
  - Personal accounts and profiles
  - Saved locations
  - Building bookmarks
  - Detection history
  - Custom building collections

## 🛠 Technology Stack

- **Frontend**
  - Next.js 15
  - React 18
  - TailwindCSS
  - Radix UI Components
  - Three.js for 3D visualizations
  - Leaflet for maps

- **Backend**
  - Prisma ORM
  - PostgreSQL Database
  - Authentication with NextAuth.js
  - Google Cloud Vision API integration
  - Firebase services

- **APIs & Services**
  - Location services
  - Weather data
  - Maps integration
  - AI/ML processing

## 🚀 Getting Started

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env` file with the following variables:
   ```
   POSTGRES_PRISMA_URL=your_prisma_url
   POSTGRES_URL_NON_POOLING=your_non_pooling_url
   ```

4. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

6. Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## 📚 Project Structure

- `/app` - Next.js application routes and pages
- `/components` - Reusable React components
- `/prisma` - Database schema and migrations
- `/public` - Static assets
- `/lib` - Utility functions and shared logic
- `/types` - TypeScript type definitions

## 🔒 Security

The application implements several security measures:
- JWT authentication
- Password hashing with bcrypt
- Rate limiting
- Secure database connections
- Protected API routes

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is proprietary software. All rights reserved.

## 🔧 Support

For support, please open an issue in the repository or contact the development team.