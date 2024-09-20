import mongoose from "mongoose";

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
          type: Boolean,
          default: false,
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
              // open이 false일 때만 password 필수
              if (!this.open && !value) {
                return false; // password가 없으면 validation 실패
              }
              return true;
            },
            message: 'Password is required when the group is not open.',
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
    },
);

// 저장 전에 open이 true면 password 값을 제거
GroupSchema.pre('save', function (next) {
  if (this.open) {
    this.password = undefined;
  }
  next();
});

const Group = mongoose.model('Group', GroupSchema);

export default Group;