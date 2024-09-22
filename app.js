import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Group from './models/Group.js';
import cors from 'cors';
import upload from './upload.js'; // multer 설정 추가

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

function asyncHandler(handler) {
  return async function (req, res) {
    try {
      await handler(req, res);
    } catch (e) {
      if (e.name === 'ValidationError') {
        res.status(400).send({ message: e.message });
      } else if (e.name === 'CastError') {
        res.status(404).send({ message: 'Cannot find given groupId.' });
      } else {
        res.status(500).send({ message: e.message });
      }
    }
  }
}

// 그룹 목록 조회
app.get('/groups', asyncHandler(async (req, res) => {
  const groups = await Group.find();
  res.send(groups);
}));

// 그룹 상세 정보 조회
app.get('/groups/:groupId', asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });

  if (group) {
    res.send(group);
  } else {
    res.status(404).send({ message: 'Cannot find given groupId' });
  }
}));

// 그룹 생성
app.post('/groups', upload.single('mainImg'), asyncHandler(async (req, res) => {
  const lastGroup = await Group.findOne().sort({ groupId: -1 });
  const nextGroupId = lastGroup ? lastGroup.groupId + 1 : 1;

  // public이 false인 경우 password 확인
  if (req.body.public === 'false') {
    if (!req.body.password) {
      return res.status(400).send({ message: 'Password is required for creating a closed group.' });
    }
  } else {
    // public이 true면 password 무시
    delete req.body.password;
  }

  const newGroupData = {
    ...req.body,
    groupId: nextGroupId,
    mainImg: req.file.location, // S3에서 반환된 이미지 URL
  };

  const newGroup = await Group.create(newGroupData);
  res.status(201).send(newGroup);
}));

// 그룹 수정
app.put('/groups/:groupId', asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });

  if (!group) {
    return res.status(404).send({ message: 'Cannot find given groupId' });
  }

  if (!group.public) {
    const { password } = req.body;

    if (!password) {
      return res.status(400).send({ message: 'Password is required for updating a closed group.' });
    }

    // 해시된 비밀번호와 입력된 비밀번호 비교
    const isMatch = await group.comparePassword(password);
    if (!isMatch) {
      return res.status(403).send({ message: 'Incorrect password.' });
    }
  }

  // 비밀번호는 업데이트 대상에서 제외
  Object.keys(req.body).forEach((key) => {
    if (key !== 'password') {
      group[key] = req.body[key];
    }
  });

  await group.save();
  res.send(group);
}));


// 그룹 삭제
app.delete('/groups/:groupId', asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });

  if (!group) {
    return res.status(404).send({ message: 'Cannot find given groupId' });
  }

  if (!group.public) {
    const { password } = req.body;

    if (!password) {
      return res.status(400).send({ message: 'Password is required for deleting a closed group.' });
    }

    // 비밀번호 검증
    const isMatch = await group.comparePassword(password);
    if (!isMatch) {
      return res.status(403).send({ message: 'Incorrect password.' });
    }
  }

  await Group.deleteOne({ groupId });
  res.sendStatus(204);
}));

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Connected to DB'));
