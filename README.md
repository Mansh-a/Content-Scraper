<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1PLBUvZ8gvSSwHje5I91O137zz2M_x6lL

## Run Locally

**Prerequisites:** Node.js

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Setup:**  
    Create a `.env` file (or use the existing one) and ensure your keys are set.

3.  **Run the app:**

    - **Live Mode (with real APIs):**
      ```bash
      npm run dev
      ```
    - **Mock Mode (for UI/UX testing without APIs):**
      ```bash
      npm run dev:mock
      ```
    The app will be available at [http://localhost:3000](http://localhost:3000).
