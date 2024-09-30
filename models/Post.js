import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const PostSchema = new mongoose.Schema(
  {
    postId: {
      type: Number,
      required: true,
      default: 1,
    },
    groupId: {
      type: Number,
      required: true,
    },
    nickname: {
      type: String,
      required: true,
      maxLength: 20,
    },
    title: {
      type: String,
      required: true,
      maxLength: 60,
    },
    content: {
      type: String,
      required: true,
      maxLength: 600,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    tags: {
      type: [String],
      default: []
    },
    location: {
      type: String,
      required: true,
    },
    moment: {
      type: String,
      required: true,
    },
    isPublic: {
      type: Boolean,
      required: true,
      default: true,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    commentCount: {
      type: Number,
      default: 0,
    },
    postPassword: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 저장 전에 비밀번호 해싱
PostSchema.pre('save', async function (next) {
  if (this.isModified('postPassword')) {
    const salt = await bcrypt.genSalt(10);
    this.postPassword = await bcrypt.hash(this.postPassword, salt);
  }
  next();
});

// 비밀번호 비교 메서드
PostSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.postPassword);
};

const Post = mongoose.model('Post', PostSchema);
export default Post;
