# Timer App

This is a simple real-time timer application built with the MERN stack (MongoDB, Express, React, Node.js). It allows multiple users to create, start, pause, and stop timers, and see the updates in real-time.

## Features

*   Create new timers
*   Start, pause, and stop timers
*   Real-time updates across all connected clients
*   Simple and intuitive user interface

## Project Structure

The project is divided into two main parts:

*   `client/`: The React frontend application.
*   `server/`: The Node.js and Express backend server.

## Prerequisites

*   [Node.js](https://nodejs.org/) (v14 or later)
*   [npm](https://www.npmjs.com/)

## Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/your-username/timer-app.git
    cd timer-app
    ```

2.  **Install server dependencies:**

    ```bash
    cd server
    npm install
    ```

3.  **Install client dependencies:**

    ```bash
    cd ../client
    npm install
    ```

## Running the Application

You will need to run the client and server in separate terminals.

1.  **Start the server:**

    ```bash
    cd server
    npm start
    ```

    The server will start on `http://localhost:3001`.

2.  **Start the client:**

    In a new terminal:

    ```bash
    cd client
    npm start
    ```

    The client application will open in your browser at `http://localhost:3000`.

## Technologies Used

*   **Frontend:**
    *   [React](https://reactjs.org/)
    *   [Socket.IO Client](https://socket.io/docs/v4/client-api/)
*   **Backend:**
    *   [Node.js](https://nodejs.org/)
    *   [Express](https://expressjs.com/)
    *   [Socket.IO](https://socket.io/)
