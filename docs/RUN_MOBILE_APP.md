# How to Run Mobile App on Android Emulator

To run the app on an Android Emulator (e.g., via Android Studio), follow these steps:

## Prerequisites

1.  **Android Studio Installed**: Ensure you have an Android Virtual Device (AVD) set up and running.
2.  **Emulator Running**: Start your emulator before running the commands below.

## Configuration

The app is currently configured to use the default emulator loopback address: `10.0.2.2`.

-   **File**: `mobile-apps/member2-mobile/frontend/src/context/AuthContext.js`
-   **Current setting**: `const API_URL = 'http://10.0.2.2:8003/api/auth';`

## Running the App

1.  **Start the Backend**:
    ```bash
    cd mobile-apps/member2-mobile/backend
    npm run dev
    ```

2.  **Start the Mobile Frontend**:
    Open the terminal where `npx expo start` is running (or start it in `mobile-apps/member2-mobile/frontend`).

3.  **Launch on Android**:
    -   Once Expo starts, press **`a`** in the terminal.
    -   Expo will detect your running emulator and install/open the app automatically.

## Troubleshooting

-   **"Emulator not found"**: Ensure your Android Emulator is fully booted and recognized by `adb devices`.
-   **"Network request failed"**: Verify that the backend is running on port **8003** and `AuthContext.js` is set to `10.0.2.2`.
