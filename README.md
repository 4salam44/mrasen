# Welcome to OnSpace AI

Onspace AI empowers anyone to turn ideas into powerful AI applications in minutes—no coding required. Our free, no-code platform enables effortless creation of custom AI apps; simply describe your vision and our agentic AI handles the rest. The onspace-app, built with React Native and Expo, demonstrates this capability—integrating popular third-party libraries to deliver seamless cross-platform performance across iOS, Android, and Web environments.

## Getting Started

### 1. Install Dependencies

```bash
npm install
# or
yarn install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory by copying the example file:

```bash
cp .env.example .env
```

Then edit `.env` and add your actual Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important:** Never commit the `.env` file to version control. It contains sensitive credentials.

### 3. Start the Project

- Start the development server (choose your platform):

```bash
npm run start         # Start Expo development server
npm run android       # Launch Android emulator
npm run ios           # Launch iOS simulator
npm run web           # Start the web version
```

- Reset the project (clear cache, etc.):

```bash
npm run reset-project
```

### 4. Lint the Code

```bash
npm run lint
```

## Main Dependencies

- React Native: 0.79.4
- React: 19.0.0
- Expo: ~53.0.12
- Expo Router: ~5.1.0
- Supabase: ^2.50.0
- Other commonly used libraries:  
  - @expo/vector-icons  
  - react-native-paper  
  - react-native-calendars  
  - lottie-react-native  
  - react-native-webview  
  - and more

For a full list of dependencies, see [package.json](./package.json).

## Development Tools

- TypeScript: ~5.8.3
- ESLint: ^9.25.0
- @babel/core: ^7.25.2

## Contributing

1. Fork this repository
2. Create a new branch (`git checkout -b main`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

## License

This project is private ("private": true). For collaboration inquiries, please contact the author.

---

Feel free to add project screenshots, API documentation, feature descriptions, or any other information as needed.
