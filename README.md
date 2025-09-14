# Studyo - an Integrated Study Environment

An integrated study platform that combines file organization, AI-powered analysis, and personalized music generation to enhance your learning experience.

## Features

### Smart File Organization
- Upload and organize study materials (PDFs, documents)
- Create custom folders for different subjects or topics
- Secure file storage with user authentication
- Share folders with generated links

### AI-Powered Analysis
- **Claude AI Integration**: Automatic PDF summarization using Claude Sonnet 4
- Intelligent content analysis and key concept extraction
- Markdown-formatted summaries with highlighted important terms
- Chunked processing for large documents

### Personalized Study Music
- **Suno AI Integration**: Generate custom background music for studying
- Music tailored to your study materials using AI summaries
- Rap-style educational music with lyrics about your content
- Music queue system with multiple tracks
- Real-time music generation status tracking

### User Management
- Secure user authentication with Passport.js
- Session-based login system
- Password hashing with bcryptjs
- User-specific file and folder access

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **EJS** - Server-side templating
- **Passport.js** - Authentication middleware
- **Multer** - File upload handling
- **PDF-Parse** - PDF content extraction

### Database
- **PostgreSQL** - Primary database
- **Prisma** - ORM and database client
- **Prisma Session Store** - Session management

### External APIs
- **Claude AI (Anthropic)** - Document summarization
- **Suno AI** - Music generation

### Frontend
- **EJS Templates** - Server-side rendering
- **Vanilla JavaScript** - Client-side interactions
- **CSS3** - Custom styling
- **Font Awesome** - Icons
- **Marked.js** - Markdown rendering

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL database
- API keys for Claude AI and Suno AI

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd learning-assistant-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/studyo"
   CLAUDE_API_KEY="your-claude-api-key"
   SUNO_API_KEY="your-suno-api-key"
   SESSION_SECRET="your-session-secret"
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Start the application**
   ```bash
   npm start
   ```

   The application will be available at `http://localhost:3000`

## 📁 Project Structure

```
learning-assistant-2/
├── app.js                 # Main application entry point
├── package.json           # Dependencies and scripts
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── migrations/        # Database migrations
├── controllers/           # Route handlers
│   ├── authController.js  # Authentication logic
│   ├── fileController.js  # File management
│   ├── folderController.js # Folder operations
│   ├── musicController.js # Music generation
│   └── summaryController.js # AI summarization
├── routes/               # Express routes
├── views/               # EJS templates
├── public/              # Static assets (CSS, JS)
├── uploads/             # File storage
├── config/              # Configuration files
├── middleware/          # Custom middleware
└── lib/                 # Utility libraries
```

## 🔧 API Endpoints

### Authentication
- `POST /auth/sign-up` - User registration
- `POST /auth/log-in` - User login
- `POST /auth/logout` - User logout

### Folders
- `GET /folder/create` - Create folder page
- `POST /folder/create` - Create new folder
- `GET /folder/:id/details` - Folder details
- `POST /folder/:id/update` - Update folder
- `DELETE /folder/:id/delete` - Delete folder

### Files
- `POST /file/upload` - Upload files
- `GET /file/:id/summary` - View file summary
- `POST /file/:id/summary` - Generate AI summary

### Music
- `POST /folder/:id/generate` - Generate study music
- `GET /folder/:id/status` - Check music generation status
- `POST /folder/:id/regenerate` - Regenerate music
- `GET /folder/:id/music` - Get current music
- `POST /folder/:id/skip-next` - Skip to next track
- `POST /folder/:id/skip-previous` - Skip to previous track

## 🎵 How Music Generation Works

1. **Content Analysis**: System analyzes all AI-generated summaries in a folder
2. **Context Building**: Combines summaries into rich context for music generation
3. **Suno API Integration**: Sends content-based prompts to Suno AI
4. **Music Creation**: Generates rap-style educational music with lyrics about study materials
5. **Queue Management**: Creates multiple tracks with variations on the same content

## Security Features

- Password hashing with bcryptjs
- Session-based authentication
- User-specific file access
- Input validation with express-validator
- Secure file upload handling

## Deployment

1. **Set up production database**
2. **Configure environment variables**
3. **Run database migrations**
4. **Start the application with a process manager (PM2)**

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support or questions, please open an issue in the repository.

---

**Studyo** - Making studying more engaging with AI-powered insights and personalized music! 🎓🎵
