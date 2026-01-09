#!/bin/bash

# Google Landmarks Dataset v2 Download Script
# Usage: bash download-gldv2.sh [train|index|test] [max_file_number]

set -e

DATASET_TYPE=$1
MAX_FILE=$2
NUM_PROC=4  # Number of parallel downloads

if [ -z "$DATASET_TYPE" ] || [ -z "$MAX_FILE" ]; then
    echo "Usage: bash download-gldv2.sh [train|index|test] [max_file_number]"
    echo "Examples:"
    echo "  bash download-gldv2.sh train 499"
    echo "  bash download-gldv2.sh index 99"
    echo "  bash download-gldv2.sh test 19"
    exit 1
fi

BASE_URL="https://s3.amazonaws.com/google-landmark"
MD5_BASE_URL="${BASE_URL}/md5sum/${DATASET_TYPE}"

echo "Downloading ${DATASET_TYPE} set (0 to ${MAX_FILE})..."

download_and_verify() {
    local i=$1
    local file_num=$(printf "%03d" $i)
    local tar_file="images_${file_num}.tar"
    local md5_file="md5.images_${file_num}.txt"
    
    echo "Downloading ${tar_file}..."
    wget -q "${BASE_URL}/${DATASET_TYPE}/${tar_file}" -O "${tar_file}"
    
    echo "Verifying ${tar_file}..."
    wget -q "${MD5_BASE_URL}/${md5_file}" -O "${md5_file}"
    md5sum -c "${md5_file}"
    
    echo "Extracting ${tar_file}..."
    tar -xf "${tar_file}"
    rm "${tar_file}" "${md5_file}"
    
    echo "Completed ${tar_file}"
}

export -f download_and_verify
export BASE_URL MD5_BASE_URL DATASET_TYPE

# Download in parallel
seq 0 $MAX_FILE | xargs -n 1 -P $NUM_PROC -I {} bash -c 'download_and_verify {}'

echo "Download complete for ${DATASET_TYPE} set!"
