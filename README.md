# Cookle AI - Backend


## Project Overview

  The backend of Cookle AI serves as the core engine for handling user authentication, recipe and cookbook management, and integrations with AI via the Gemini API. Built with NestJS, it employs Prisma for database ORM, Supabase for storage, and Google OAuth for user authentication. It runs in a Dockerized environment, using PostgreSQL as the database.

## Features

* Google OAuth: Secure user authentication using Google login.
* AI Integration: Communicate with the Gemini API for recipe generation.
* Cookbook Management: Backend APIs to manage recipes and cookbooks, including permission controls.
* Image Storage: Utilizes Supabase for handling both public and private image storage.
* Scalable Architecture: Built with modular NestJS features, making it easy to extend and maintain.
* Dockerized Deployment: Simplifies deployment with Docker and PostgreSQL.

## Technologies Used

* NestJS: A progressive Node.js framework for building efficient server-side applications.
* Prisma: ORM for easy and efficient database interaction.
* Supabase: For image storage and secure server-side operations.
* Google OAuth: For seamless and secure user authentication.
* PostgreSQL: Relational database for persistent data storage.
* Docker: To containerize the application for easy deployment.

## Environment Variables

  The backend requires the following environment variables to function properly. Create a .env file in the root of the project and add the following keys:
    
  * DATABASE_URL: Url of the database.
  * GOOGLE_CLIENT_ID: Client id from google
  * GOOGLE_CLIENT_SECRET: Client secret from google.
  * JWT_SECRET: Secret used to sign jwt tokens.
  * FRONTEND_URL: Url of the frontend.
  * SUPABASE_URL: Url of your project in supabase.
  * SUPABASE_SERVICE_ROLE_KEY: Key of the service role in supabase.
  * PUBLIC_IMAGES_BUCKET: Public images bucket name from supabase.
  * PRIVATE_IMAGES_BUCKET: Private images bucket name from supabase.
  * GEMINI_API_KEY: Gemini API key.

## Installation Instructions

1. Clone the Repository
  Start by cloning the repository to your local machine:

    `git clone https://github.com/Kurler3/cookleai-rest.git`

2. Install Dependencies
  Navigate into the backend directory and install dependencies:

    `cd cookleai-rest`
    <br>
    `npm install`

3. Set Up Environment Variables

    Create a .env file in the root directory and add the required environment variables as specified above.

4. Run the Development Server
  
    Run the server locally:

    `npm run start:dev`

    This will create a docker image and run it in a container.

## Database Setup
  
### Prisma Migrations: Run the following command to set up your database schema:

  `npx prisma migrate dev`

  This applies migrations and updates your database schema.

### Prisma Studio (optional): Launch Prisma Studio to visualize and manage your data:

  `npx prisma studio`


  