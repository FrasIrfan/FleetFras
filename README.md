# FleetFras - Car Management System

## Overview
FleetFras is a modern car management system built with Next.js, Firebase, and Tailwind CSS. It supports multiple user roles (Admin, Renter, Purchaser) and provides a seamless experience for car rentals, purchases, and management.

## Features
- **User Authentication:** Secure login/signup with email/password and Google.
- **Role-Based Access:** Separate dashboards and permissions for Admin, Renter, and Purchaser.
- **Post Management:** Renters can create car listings; admins approve/reject posts.
- **Chat Support:** Real-time chat between users and admins, and between purchasers and renters.
- **Role Switching:** Purchasers can request to become Renters (admin approval required).
- **Modern UI:** Fully responsive, mobile-first design using Tailwind CSS.
- **Global Navbar:** Sticky, responsive navbar with navigation and user info.
- **SVG Icons:** All navigation and action icons use inline SVGs for performance and consistency.

## Project Structure
- **`src/pages/`**: All Next.js pages (dashboards, posts, chats, etc.).
- **`components/`**: Reusable UI components (auth forms, protected routes, etc.).
- **`context/`**: React context for authentication.
- **`lib/`**: Firebase and admin SDK configuration.
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

3. **Environment Variables:**
   - Create a `.env` file in the root directory with the following:
     ```env
     # Firebase client config
     NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
     NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
     NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
     NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
     NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
     NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

     # Firebase Admin SDK (for SSR and API routes)
     FIREBASE_PROJECT_ID=your_project_id
     FIREBASE_CLIENT_EMAIL=your_admin_sdk_client_email
     FIREBASE_PRIVATE_KEY="your_admin_sdk_private_key"
     ```
     > **Note:** The `FIREBASE_PRIVATE_KEY` may need to be escaped or wrapped in quotes if it contains newlines.

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
- **Login/Signup:** Users authenticate and are redirected to their role-based dashboard.
- **Admin:** Manages users, posts, and role switch requests.
- **Renter:** Creates and manages car posts, chats with purchasers.
- **Purchaser:** Views available posts, chats with renters, can request to become a renter.

## Deployment
- **Auto Deployment:** The `.next` build output is not tracked in git and is generated automatically by your deployment platform (e.g., Vercel, Netlify).
- **.gitignore:** Make sure `.next` and `.env*` are in your `.gitignore`.

## Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## License
This project is licensed under the MIT License.
