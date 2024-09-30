import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Post from './Post.js';

const GroupSchema = new mongoose.Schema(
  {
    groupId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
      maxLength: 20,
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isPublic: {
      type: Boolean,
      required: true,
      default: true,
    },
    password: {
      type: String,
      required: true,
    },
    likeCount: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: []
    },
    badgeCount: {
      type: Number,
      default: 0,
    },
    postCount: {
      type: Number,
      default: 0,
    },
    posts: {
      type: [Number],
      default: []
    },
    introduction: {
      type: String,
      required: true,
      maxLength: 60,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// 저장 전에 비밀번호 해싱
GroupSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// 비밀번호 비교 메서드
GroupSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Group = mongoose.model('Group', GroupSchema);
export default Group;
