# Member 4 - Safety Assistant Mobile (Expo)

This is a lightweight Expo React Native app that consumes the Member 4 Safety Assistant backend. It fetches the user's location, requests weather from the backend and shows safety suggestions and emergency protocols.

## Quick start

1. Install dependencies

   cd mobile-apps/member4-mobile
   npm install

2. Configure backend

By default the app reads `extra.backendBaseUrl` in `app.json`. Change it to your backend host, for example if your backend runs on port 5004 on your machine and you're using Android emulator, `http://10.0.2.2:5004` works. For iOS simulator use `http://localhost:5004`.

3. Run

   npm start

4. Permissions

The app requests location permission to fetch the weather for your current location.

## Screens

- Home: Landing with quick actions
- Weather: Gets location, calls `/api/weather/coordinates` and shows hazard analysis
- Safety Tips: Calls `/api/safety/tips`
- Emergency: Shows protocols from `/api/safety/emergency/:type`

## Notes

- Replace `app.json` extra.backendBaseUrl for different environments.
- For production, consider a secure place for environment variables.

Enjoy! 
## Design & Dev: Animation libraries & setup

To enable advanced animations and graphics, install the recommended packages:

```bash
cd mobile-apps/member4-mobile
expo install react-native-reanimated react-native-gesture-handler react-native-svg lottie-react-native expo-linear-gradient expo-blur
# then install JS deps:
npm install

# Install `expo-haptics` using `expo install` so the correct version for your Expo SDK is selected:
expo install expo-haptics
# For iOS (if using prebuild / bare workflow):
npx pod-install ios
```

If you use Reanimated v2, add the plugin to `babel.config.js` (ensure last plugin):

```js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // other plugins...
    'react-native-reanimated/plugin',
  ],
};
```

Lottie assets & sample usage

- Place Lottie JSON files in `mobile-apps/member4-mobile/assets/lottie/` (e.g. `rain.json`, `sunny.json`, `cloudy.json`, `storm.json`).
- The app will try to load `assets/lottie/{type}.json` in `WeatherScreen` and pass it to `HeroWeatherCard`.
- If you don't provide Lottie files, the UI falls back to an emoji placeholder.

Safety Card Stack

- The new `components/SafetyCardStack.js` provides a swipeable card stack for safety suggestions.
- Usage example included on the Home screen. Swipe right to save, left to dismiss, or use action buttons.

Restart Metro with cache clear after installing packages:

```bash
expo start -c
```