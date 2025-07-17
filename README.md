# GOOD CARE Network - Mental Health DApp

A purpose-driven blockchain platform focused on mental health, transparency, and regenerative finance. Users can track their mental health, earn care points, maintain daily streaks, and participate in community activities.

## Features

### Core Features
- **Social Authentication**: Twitter login integration
- **Wallet Connection**: MetaMask integration for blockchain features
- **Mood Tracking**: Daily mood check-ins with 1-10 scale
- **Journal Entries**: Private journaling with points rewards
- **Care Points System**: Earn points for activities with streak multipliers
- **Daily Streaks**: Track consecutive days of mental health activities
- **Leaderboards**: Community rankings based on care points
- **Community Features**: Share gratitude and connect with others

### Points System
- **Mood Check-ins**: 10 base points + streak multiplier
- **Journal Entries**: 15 base points + streak multiplier
- **Community Posts**: 5 base points + bonus for engagement
- **Streak Multipliers**:
  - 3+ days: 1.25x
  - 7+ days: 1.5x
  - 14+ days: 2.0x
  - 30+ days: 2.5x

## Setup Instructions

### Prerequisites
- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account and project
- MetaMask browser extension

### Environment Variables
Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup
1. Run the complete schema migration:
```sql
-- Execute scripts/fix-complete-schema.sql in your Supabase SQL editor
```

2. Enable Row Level Security (RLS) on all tables
3. Set up the required policies (included in the schema script)

### Installation
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build
```

## Troubleshooting Guide

### Common Issues

#### 1. Name Setting Errors
**Problem**: Users can't set their display name
**Solution**: 
- Ensure the `users` table has the correct schema with `name` column
- Check that RLS policies allow user updates
- Verify the API endpoint `/api/users/profile` is working

#### 2. Points Not Awarded for Journal Entries
**Problem**: Users don't receive points for journal entries
**Solution**:
- Check that the `daily_activities` table exists
- Verify the `user_stats` table is properly configured
- Ensure the points system is using the correct user ID

#### 3. Streak Calculation Issues
**Problem**: Streaks not calculating correctly
**Solution**:
- Run the complete schema migration
- Check that `daily_activities` table tracks all activities
- Verify timezone settings in your database

#### 4. Twitter Authentication Not Working
**Problem**: Twitter login fails
**Solution**:
- The current implementation uses mock data
- For production, implement real Twitter OAuth
- Set up Twitter API credentials

#### 5. Database Connection Issues
**Problem**: Can't connect to Supabase
**Solution**:
- Verify environment variables are set correctly
- Check Supabase project status
- Ensure RLS policies are configured properly

### API Endpoints

#### User Management
- `POST /api/users/profile` - Get user by wallet/Twitter
- `PUT /api/users/profile` - Create new user
- `PATCH /api/users/profile` - Update user name

#### Activities
- `POST /api/mood/create` - Create mood entry
- `POST /api/journal/create` - Create journal entry
- `POST /api/community/checkin` - Community check-in

#### Leaderboards
- `GET /api/leaderboard` - Get community rankings

### Database Schema

#### Core Tables
- `users` - User profiles and basic stats
- `user_stats` - Detailed user statistics
- `daily_activities` - Activity tracking for points/streaks
- `mood_entries` - Mood check-in records
- `journal_entries` - Journal entry records
- `community_posts` - Community interaction posts

#### Supporting Tables
- `badges` - Achievement badges
- `care_objectives` - Community goals
- `daily_checkins` - Comprehensive daily check-ins

## Development

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   └── [pages]/           # App pages
├── components/            # React components
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
├── scripts/               # Database migration scripts
└── contracts/             # Smart contracts
```

### Key Components
- `useAuth.tsx` - Authentication state management
- `points-system.ts` - Unified points and streak calculation
- `UsernamePrompt.tsx` - Name setting component
- `WalletConnect.tsx` - Wallet connection component

### Adding New Features
1. Create database migration if needed
2. Add API endpoints in `app/api/`
3. Create React components in `components/`
4. Update points system if needed
5. Add to navigation and routing

## Blockchain Integration

### Current Status
- Basic wallet connection implemented
- Smart contract for CARE tokens exists
- Points system ready for blockchain integration

### Future Features
- Mint CARE tokens for achievements
- On-chain leaderboards
- Decentralized governance
- Cross-chain compatibility

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the troubleshooting guide above
2. Review the database schema
3. Check API endpoint documentation
4. Open an issue on GitHub

## Roadmap

### Phase 1 (Current)
- ✅ Basic authentication
- ✅ Points system
- ✅ Streak tracking
- ✅ Community features

### Phase 2 (Next)
- 🔄 Real Twitter OAuth
- 🔄 Enhanced UI/UX
- 🔄 Mobile optimization
- 🔄 Advanced analytics

### Phase 3 (Future)
- 🔄 Blockchain token integration
- 🔄 Decentralized governance
- 🔄 Cross-chain features
- 🔄 Advanced community tools 