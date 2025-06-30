# Timer App

This is a real-time timer application with a Next.js frontend and a Node.js/Express backend. It allows multiple users to create, start, pause, and stop timers, with updates reflected in real-time across all connected clients.

## Features

*   Create new timers
*   Start, pause, and stop timers
*   Real-time updates across all connected clients
*   Modern Material-UI design
*   **User Management:** Timers are associated with specific users, and users can set a friendly name.
*   **Admin View:** An admin user can view all active users and create timers for any specific user.

## Project Structure

This project is a monorepo containing two main parts:

*   `client/`: The Next.js frontend application.
*   `server/`: The Node.js and Express backend server.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v14 or later)
*   [npm](https://www.npmjs.com/)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/nikalomoiris/timer-app.git
    cd timer-app
    ```

2.  **Install dependencies for both client and server:**

    ```bash
    # For the server
    cd server
    npm install
    
    # For the client
    cd ../client
    npm install
    ```

## Running the Application

You will need to run the client and server in separate terminal windows.

1.  **Start the server:**

    Open a new terminal, navigate to the `server` directory, and run:

    ```bash
    cd server
    node index.js
    ```

    The server will start on `http://localhost:3001`.

2.  **Start the client:**

    Open another terminal, navigate to the `client` directory, and run:

    ```bash
    cd client
    npm run dev
    ```

    The client application will open in your browser at `http://localhost:3000`.

## Views

*   **Admin View:** `http://localhost:3000/`
*   **User View:** `http://localhost:3000/user`

## Technologies Used

*   **Frontend:**
    *   [Next.js](https://nextjs.org/)
    *   [React](https://reactjs.org/)
    *   [Material-UI](https://mui.com/)
    *   [Socket.IO Client](https://socket.io/docs/v4/client-api/)
*   **Backend:**
    *   [Node.js](https://nodejs.org/)
    *   [Express](https://expressjs.com/)
    *   [Socket.IO](https://socket.io/)