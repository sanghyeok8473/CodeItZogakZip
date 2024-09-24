import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const PostSchema = new mongoose.Schema(
  {
    postId: {
      type: Number,
      required: true,
      default: 1,
    },
    name: {
      type: String,
      required: true,
      maxLength: 20,
    },
    title: {
      type: String,
      required: true,
      maxLength: 60,
    },
    postImg: {
      type: String,
      default: '',
    },
    content: {
      type: String,
      required: true,
      maxLength: 600,
    },
    tag: {
      type: String,
      required: true,
    },
    place: {
      type: String,
      required: true,
    },
    public: {
      type: Boolean,
      required: true,
      default: true,
    },
    password: {
      type: String,
      required: true,
    },
    likes: {
      type: Number,
      default: 0,
    },
    comments: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// 저장 전에 비밀번호 해싱
PostSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// 비밀번호 비교 메서드
PostSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Post = mongoose.model('Post', PostSchema);
export default Post;
