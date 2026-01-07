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
