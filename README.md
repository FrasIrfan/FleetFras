# FleetFras - Car Management System

## Overview
FleetFras is a modern car management system built with Next.js and Firebase, designed to support multiple user roles: Admin, Renter, and Purchaser. The system facilitates car rentals, purchases, and management with a user-friendly interface and robust features.

## Features
- **User Authentication**: Secure login and signup with email/password and Google authentication.
- **Role-Based Access**: Different dashboards and functionalities for Admin, Renter, and Purchaser roles.
- **Post Management**: Renters can create posts for car listings, which require admin approval before being visible to purchasers.
- **Chat Support**: Real-time chat functionality for users to communicate with admins and other users.
- **Role Switching**: Purchasers can request to become Renters, with admin approval.
- **UI Consistency**: Modern and consistent UI across all pages, with a global top navbar for navigation.

## Project Structure
- **`src/pages/`**: Contains all the pages of the application, including dashboards, login, signup, and role-specific pages.
- **`components/`**: Reusable components like authentication forms, dashboard layouts, and protected routes.
- **`context/`**: React context for managing authentication state.
- **`lib/`**: Firebase configuration and helper functions.
- **`styles/`**: Global and component-specific styles.

## Setup Instructions
1. **Clone the Repository**:
   ```bash
   git clone <repository-url>
   cd car-management-system
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   - Create a `.env` file in the root directory with the following Firebase credentials:
     ```env
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
     ```

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```

5. **Build for Production**:
   ```bash
   npm run build
   npm start
   ```

## Usage Flow
- **Login/Signup**: Users can log in or sign up using email/password or Google authentication.
- **Dashboard**: After logging in, users are redirected to their respective dashboards based on their role.
- **Admin Dashboard**: Admins can manage users, approve/reject posts, and handle role switch requests.
- **Renter Dashboard**: Renters can create posts, manage their listings, and communicate with purchasers.
- **Purchaser Dashboard**: Purchasers can view approved posts, initiate chats with renters, and request role switches.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.
