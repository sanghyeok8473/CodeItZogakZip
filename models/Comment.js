import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const CommentSchema = new mongoose.Schema(
  {
    commentId: {
      type: Number,
      required: true,
      default: 1,
    },
    nickname: {
      type: String,
      required: true,
      maxLength: 20,
    },
    content: {
      type: String,
      required: true,
      maxLength: 600,
    },
    password: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// 저장 전에 비밀번호 해싱
CommentSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// 비밀번호 비교 메서드
CommentSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Comment = mongoose.model('Comment', CommentSchema);
export default Comment;
