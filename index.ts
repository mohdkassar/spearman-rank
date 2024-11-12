import fs from 'fs';
import csvtojson from 'csvtojson';
import { UserRating } from './types';
import { rank } from './ranker';
import process from 'process';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

(async function initialise() {

    let userMap = new Map<string, UserRating>();

    if (!process.env.INPUT_FILE || !process.env.OUTPUT_FILE) {
        console.error('Please provide an input file and an output file in the environment variables (INPUT_FILE, OUTPUT_FILE)');
        return;
    }
    const jsonArray = await csvtojson().fromFile(process.env.INPUT_FILE);
    jsonArray.forEach((element: { userId: string, movieId: string, rating: string }) => {
        if (userMap.has(element.userId)) {
            userMap.get(element.userId)!.set(element.movieId, { rating: parseFloat(element.rating) });
        } else {
            userMap.set(element.userId, new Map().set(element.movieId, { rating: parseFloat(element.rating) }));
        }
    });

    // get user ids
    const userArray = Array.from(userMap.keys());

    userMap = rank(userArray, userMap);

    const userSimilarityMap = new Map();

    // calculate similarity between all users
    userArray.forEach((user1) => {
        userArray.forEach((user2) => {
            if (user1 === user2) {
                return;
            }

            if (userSimilarityMap.has(`${user1}-${user2}`) || userSimilarityMap.has(`${user2}-${user1}`)) {
                return;
            }

            const user1Ratings = userMap.get(user1);
            const user2Ratings = userMap.get(user2);

            const user1Movies = Array.from(user1Ratings!.keys());
            const user2Movies = Array.from(user2Ratings!.keys());

            const commonMovies = user1Movies.filter((movie) => user2Movies.includes(movie));
            if (commonMovies.length === 0 || commonMovies.length === 1) {
                // user similarity is 0
                userSimilarityMap.set(`${user1}-${user2}`, 0);
            } else {
                const similarity = calculateSimilarity(user1Ratings!, user2Ratings!, commonMovies);

                userSimilarityMap.set(`${user1}-${user2}`, similarity);
                console.log(`Similarity between ${user1} and ${user2} is ${similarity}`);
            }
        });
    });

    // userSimilarityMap to new csv file
    let csv = 'userId1,userId2,similarity\n';
    userSimilarityMap.forEach((value, key) => {
        const [userId1, userId2] = key.split('-');
        csv += `${userId1},${userId2},${value}\n`;
    });

    fs.writeFileSync(process.env.OUTPUT_FILE, csv);
})().catch(console.error);

function calculateSimilarity(user1Ratings: UserRating, user2Ratings: UserRating, commonMovies: string[]) {
    // get user ratings for common movies
    const user1CommonRatings = commonMovies.map((movie) => user1Ratings.get(movie));
    const user1AverageRank = user1CommonRatings.reduce((acc, curr) => acc + curr?.rank!, 0) / user1CommonRatings.length;

    const user2CommonRatings = commonMovies.map((movie) => user2Ratings.get(movie));
    const user2AverageRank = user2CommonRatings.reduce((acc, curr) => acc + curr?.rank!, 0) / user2CommonRatings.length;

    let summation = 0;
    user1CommonRatings.forEach((rating, index) => {
        summation += (rating?.rank! - user1AverageRank) * (user2CommonRatings[index]?.rank! - user2AverageRank);
    });

    let user1Summation = 0;
    user1CommonRatings.forEach((rating) => {
        user1Summation += Math.pow(rating?.rank! - user1AverageRank, 2);
    });

    let user2Summation = 0;
    user2CommonRatings.forEach((rating) => {
        user2Summation += Math.pow(rating?.rank! - user2AverageRank, 2);
    });

    const similarity = summation / (Math.sqrt(user1Summation) * Math.sqrt(user2Summation));

    return similarity;
}
