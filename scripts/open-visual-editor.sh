#!/bin/bash

# Open Visual Editor in a new browser window
# This script starts the dev server and opens the visual editor

echo "Starting development server..."
npm run dev &
DEV_PID=$!

# Wait for server to start
sleep 5

# Open visual editor in new browser window
open "http://localhost:3000/visual-editor"

echo "Visual Editor opened in new browser window!"
echo "Press Ctrl+C to stop the server"

wait $DEV_PID

