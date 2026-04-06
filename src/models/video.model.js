import mongoose from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
// we are using mongooseAggregatePaginate for watchhistory pagination, because we want to be able to paginate the watchhistory of a user, and we want to be able to sort the watchhistory by the date it was watched.
// and mongooseAggregatePaginate allows us to write aggregate queries and paginate the results, which is what we need for the watchhistory pagination.
// true power of mongoDB is comes from the aggregation in crud like operations
const videoSchema = new mongoose.Schema({
    videoFile: {
        type: String,                   //cloudinary url
        required: true
    },
    thumbnail: {
        type: String,                   //cloudinary url
        required: true
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    duration: {
        type: Number,      
        required: true,
    },
    views: {
        type: Number,
        default: 0,
    },
    isPublished: {
        type: Boolean,
        default: true,
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
}, { timestamps: true })


videoSchema.plugin(mongooseAggregatePaginate);
// now we can write aggregation queries and paginate the results using the paginate method provided by mongooseAggregatePaginate

export const Video = mongoose.model('Video', videoSchema);
//  command npm install aggregation 