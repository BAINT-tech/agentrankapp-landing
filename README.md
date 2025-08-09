# AgentRank Landing Page

A modern, responsive landing page for AgentRank - Home of AI Agents.

## Features

- **Hero Section**: Eye-catching deep green design with call-to-action
- **Launch Agent Modal**: Web2/Web3 agent submission with Supabase integration
- **Agent Leaderboard**: Real-time ranking system with voting functionality
- **Admin Panel**: Basic admin interface for agent approval/rejection
- **Responsive Design**: Optimized for desktop and mobile devices
- **Supabase Integration**: Real-time data storage and retrieval

## Project Structure

```
agentrankapp-landing/
├── index.html          # Main landing page
├── admin.html          # Admin panel (accessible via /admin)
├── main.js             # Main JavaScript functionality
├── admin.js            # Admin panel JavaScript
├── input.css           # Tailwind CSS input file
├── output.css          # Generated CSS file
├── tailwind.config.js  # Tailwind configuration
├── postcss.config.js   # PostCSS configuration
├── package.json        # Node.js dependencies
└── README.md           # This file
```

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Build CSS**
   ```bash
   npm run build:css
   ```

3. **Local Development**
   ```bash
   # Start a local server
   python3 -m http.server 8000
   # Or use any other static file server
   ```

## Deployment Options

### Option 1: GitHub Pages

1. Create a new GitHub repository
2. Upload all files to the repository
3. Go to Settings > Pages
4. Select "Deploy from a branch"
5. Choose "main" branch and "/ (root)" folder
6. Your site will be available at `https://yourusername.github.io/repository-name`

### Option 2: Vercel

1. Create a Vercel account
2. Import your GitHub repository
3. Deploy with default settings
4. Your site will be available at the provided Vercel URL

### Option 3: Netlify

1. Create a Netlify account
2. Drag and drop the project folder to Netlify
3. Your site will be deployed automatically

## Supabase Configuration

The project is already configured to connect to your Supabase instance:
- URL: `https://ayfruvmmcwyrxtbgzgfh.supabase.co`
- Anon Key: Already included in the code

### Required Supabase Tables

Make sure your Supabase database has an `agents` table with the following structure:

```sql
CREATE TABLE agents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  wallet_address TEXT,
  avatar_url TEXT,
  status TEXT DEFAULT 'pending',
  score INTEGER DEFAULT 0,
  badge TEXT DEFAULT 'free',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Admin Panel

Access the admin panel by navigating to `/admin.html` or `/admin` on your deployed site.

## Customization

- **Logo**: Replace the placeholder logo in the hero section with your actual AgentRank logo
- **Colors**: Modify the green color scheme in `tailwind.config.js` if needed
- **Content**: Update text content in `index.html` and `admin.html`

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

## License

This project is proprietary to AgentRank.
