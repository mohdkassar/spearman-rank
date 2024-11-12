# User Similarity Calculation

This project calculates the similarity between users based on their movie ratings. The similarity scores are then written to a CSV file.

## Prerequisites

- Node.js (version 14 or higher)
- npm (Node Package Manager)

## Setup

1. Clone the repository:
    ```sh
    git clone <repository-url>
    cd <repository-directory>
    ```

2. Install the dependencies:
    ```sh
    npm install
    ```

3. Create a `.env` file in the root directory and add the following environment variable:
    ```env
    INPUT_FILE_PATH=path_to_input_file
    OUTPUT_FILE_PATH=path_to_output_file
    ```

## Input File

The input file should be a CSV file with the following columns: userId,movieId,rating
An example file is provided `sample_data.csv`

## Running the Project

1. Run the script:
    ```sh
    npx ts-node index.ts
    ```

2. The output CSV file will be generated in the location specified by the `OUTPUT_FILE_PATH` environment variable.

## Additional Information

- The `calculateSimilarity` function computes the similarity between two users based on their common movie ratings.
- The similarity scores are stored in a map and then written to a CSV file.