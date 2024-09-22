import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const GroupSchema = new mongoose.Schema(
  {
    groupId: {
      type: Number,
      required: true,
      default: 0,
    },
    name: {
      type: String,
      required: true,
      maxLength: 20,
    },
    mainImg: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      required: true,
      maxLength: 60,
    },
    public: {
      type: Boolean,
      required: true,
      default: true,
    },
    password: {
      type: String,
      validate: {
        validator: function (value) {
          if (!this.public && !value) {
            return false; // 비밀번호가 없으면 유효성 검사 실패
          }
          return true;
        },
        message: 'Password is required when the group is not public.',
      },
    },
    badges: {
      type: Number,
      default: 0,
    },
    memories: {
      type: Number,
      default: 0,
    },
    likes: {
      type: Number,
      default: 0,
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
