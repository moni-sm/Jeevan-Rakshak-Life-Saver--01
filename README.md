# Gaon Swasthya Sahayak (Rural Health Assistant)

## Overview

Gaon Swasthya Sahayak is an AI-powered rural health assistant designed to provide immediate medical guidance and emergency support in areas with limited access to healthcare. The application understands multiple Indian languages and can be operated using both text and voice commands. It helps users by analyzing their symptoms, providing first-aid advice, answering health-related questions, and connecting them with nearby medical facilities in case of an emergency.

Built with Next.js and Google's Generative AI (Genkit), this application serves as a critical first point of contact for non-critical health queries and can facilitate rapid response for emergencies.

## Key Features

-   **Multilingual Interface**: Supports numerous Indian languages, making it accessible to a wide rural audience.
-   **Voice and Text Input**: Users can either type or speak their symptoms and questions.
-   **AI-Powered Emergency Detection**: Analyzes user-reported symptoms in real-time to identify potential medical emergencies (e.g., heart attack, stroke).
-   **General Health Q&A**: Provides answers to general health-related questions in the user's chosen language.
-   **First-Aid Guidance**: Offers simple, safe, and effective first-aid instructions for emergencies while waiting for professional help.
-   **Nearby Hospital Locator**: Automatically detects the user's location to find and display a list of nearby hospitals with contact numbers and distance.
-   **Ambulance Dispatch**: Allows users to request an ambulance from the nearest hospital with a single click. The request is logged in a Firebase Firestore database.

## Technology Stack

-   **Frontend**: [Next.js](https://nextjs.org/) (with App Router), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/), [ShadCN UI](https://ui.shadcn.com/)
-   **Generative AI**: [Google's Genkit](https://firebase.google.com/docs/genkit)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Firestore for logging)
-   **Hosting**: [Firebase App Hosting](https://firebase.google.com/docs/app-hosting)

## How It Works

The application's intelligence is powered by Google's Genkit, which orchestrates different AI models and tools to handle user requests.

1.  **User Input**: The user describes their symptoms or asks a question via text or voice in their selected language.
2.  **Emergency Detection Flow (`emergency-detection.ts`)**:
    -   The input is first sent to an AI flow that determines if the symptoms constitute a medical emergency.
    -   It uses a powerful language model to assess the severity, confidence level, and type of emergency.
    -   If an emergency is detected and a location is available, it uses a tool (`find-nearby-hospitals.ts`) to get a list of local hospitals.
    -   The flow returns a structured response including whether it's an emergency, first-aid advice, and a list of hospitals.
3.  **Q&A Flow (`multilingual-health-qa.ts`)**:
    -   If the input is not deemed an emergency, it's routed to a different AI flow designed for general health questions.
    -   This flow provides a direct answer to the user's query in their local language.
4.  **Ambulance Dispatch (`actions.ts`)**:
    -   If the user chooses to request an ambulance from the emergency dialog, a server action is triggered.
    -   This action writes a new document to the `emergency_dispatches` collection in Firestore, logging the hospital details, user location, and a timestamp.

## Getting Started

To run this project locally, follow these steps:

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Set up Environment Variables**:
    Create a `.env` file in the root of the project and add your Firebase and Google AI API keys.
    ```
    GEMINI_API_KEY=your_google_ai_api_key
    ```

3.  **Run the Development Server**:
    This command starts the Next.js application.
    ```bash
    npm run dev
    ```

4.  **Run the Genkit Development Server**:
    In a separate terminal, start the Genkit development server to enable the AI flows.
    ```bash
    npm run genkit:dev
    ```

Open [(https://jeevan-rakshak-life-saver-01.vercel.app/)) in your browser to see the application running.

Contact 
LinkedIn - https://www.linkedin.com/in/monika--sm/
Email - minikasm2019@gmail.com


