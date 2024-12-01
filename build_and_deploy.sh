#!/bin/bash

set -e  # Abort script if any command fails

export AWS_REGION="$bamboo_AWS_REGION"
export AWS_ACCESS_KEY_ID="$bamboo_CUE_AWS_PROD_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$bamboo_CUE_AWS_PROD_SECRET_ACCESS_KEY"

# Check if AWS credentials are valid
aws sts get-caller-identity >/dev/null

# Build the Docker image
docker build . -t cue

# Create a unique container ID
CID=$(docker create cue)

# Copy the build artifacts from the Docker container to the local "dist" directory
docker cp "${CID}":app/build ./dist

# Clean up the Docker container
docker rm "${CID}"

# Validate AWS S3 connectivity
aws s3 ls >/dev/null

# Move the contents of the "prepub" directory in the S3 bucket to a backup directory
aws s3 mv s3://cue-sit-dashboard s3://cue-sit-dashboard-backup --recursive

# Sync the local "dist" directory to the "prepub" directory in the S3 bucket
aws s3 sync ./dist s3://cue-sit-dashboard

# Cleanup the "dist" directory
rm -rf ./dist

echo "Deployment completed successfully."
