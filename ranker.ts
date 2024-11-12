import { UserRating } from "./types";

export function rank(userIds: string[], userRatingMap: Map<string, UserRating>) {
    // calculate movie ranks for each user
    // using spearman's rank correlation
    userIds.forEach((user) => {
        // map of ratings <movieId, { rating, rank }>
        const ratings = userRatingMap.get(user);

        if (!ratings) {
            return;
        }

        // create object {movieId, rating, rank} 
        const ratingsArray: { movieId: string, rating: number, rank?: number }[] = Array.from(ratings.entries()).map(([movieId, { rating }]) => ({ movieId, rating }));

        // sort by rating
        ratingsArray.sort((a, b) => b.rating - a.rating);

        // rank using spearman's rank correlation
        let rank = 1;
        let sameRatingIndices: Set<number> = new Set<number>;
        for (let i = 0; i < ratingsArray.length; i++) {
            const rating = ratingsArray[i];
            const nextRating = ratingsArray[i + 1];
    
            if (nextRating) {
                if (rating.rating === nextRating.rating) {
                    sameRatingIndices.add(i);
                    sameRatingIndices.add(i + 1);
                    continue;
                } else {
                    const sameRatingIndicesArray = Array.from(sameRatingIndices);
                    if (sameRatingIndicesArray.length === 0) {
                        ratingsArray[i].rank = rank;
                        rank++;
                    } else {
                        rank += sameRatingIndicesArray.length;
    
                        const rankSum = sameRatingIndicesArray.reduce((acc, index) => acc + index + 1, 0);
    
                        const averageRank = rankSum / sameRatingIndicesArray.length;
                        sameRatingIndices.forEach((index) => {
                            ratingsArray[index].rank = averageRank;
                        });
    
                        sameRatingIndices.clear();
                    }
                }
            } else {
                const sameRatingIndicesArray = Array.from(sameRatingIndices);
                if (sameRatingIndicesArray.length === 0) {
                    ratingsArray[i].rank = rank;
                } else {
                    rank += sameRatingIndicesArray.length;
                    const rankSum = sameRatingIndicesArray.reduce((acc, index) => acc + index + 1, 0);
                    const averageRank = rankSum / sameRatingIndicesArray.length;
                    sameRatingIndices.forEach((index) => {
                        ratingsArray[index].rank = averageRank;
                    });
    
                    sameRatingIndices.clear();
                }
            }
        }

        // update userMap with ranks
        ratingsArray.forEach(({ movieId, rank }) => {
            userRatingMap.get(user)!.set(movieId, { ...userRatingMap.get(user)!.get(movieId)!, rank });
        }); // update userMap with ranks
    });

    return userRatingMap;
}