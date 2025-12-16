#!/bin/bash

echo "Starting deployment process..."

# Build the project
echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed!"
    exit 1
fi

# Run migrations
echo "Running database migrations..."
npm run migration:run:prod

if [ $? -ne 0 ]; then
    echo "Migration failed!"
    exit 1
fi

echo "Deployment completed successfully!"
echo "You can now start the application with: npm run start:prod"