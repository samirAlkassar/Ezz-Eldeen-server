import mongoose from "mongoose";

const ReplySchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    firstName: String,
    lastName: String,
    comment: { type: String, required: true, max: 300 },
    userPicturePath: String,
    likes: { type: Map, of: Boolean, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  { _id: false } // prevents extra ObjectId for each reply
);

const CommentSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    postId: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    comment: { type: String, required: true, max: 300 },
    userPicturePath: String,
    likes: { type: Map, of: Boolean, default: {} },
    replies: [ReplySchema]
  },
  { timestamps: true }
);

const Comment = mongoose.model("Comment", CommentSchema);
export default Comment;
