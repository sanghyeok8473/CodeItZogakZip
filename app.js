import express from 'express';
import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import Group from './models/Group.js';
import cors from 'cors';

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

app.get('/groups', asyncHandler(async (req, res) => { // 그룹 조회 뼈대 코드
  const groups = await Group.find();

  res.send(groups);
}));

app.get('/groups/:groupId', asyncHandler(async (req, res) => { // 그룹 상세 정보 조회 뼈대 코드
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });  // groupId 필드로 검색

  if (group){
    res.send(group);
  }
  else{
    res.status(404).send({ message: 'Cannot find given groupId' });
  }
}));

app.post('/groups', asyncHandler(async (req, res) => {
  // DB에서 가장 큰 groupId 값을 찾음
  const lastGroup = await Group.findOne().sort({ groupId: -1 });
  const nextGroupId = lastGroup ? lastGroup.groupId + 1 : 1;  // 가장 큰 groupId에 +1, 없으면 1부터 시작

  // 새로운 그룹 생성 데이터에 nextGroupId 추가
  const newGroupData = { ...req.body, groupId: nextGroupId };

  // 새로운 그룹 생성
  const newGroup = await Group.create(newGroupData);

  res.status(201).send(newGroup);
}));

app.put('/groups/:groupId', asyncHandler(async (req, res) => { // 그룹 수정 뼈대 코드
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });  // groupId 필드로 검색

  if (!group) {
    return res.status(404).send({ message: 'Cannot find given groupId' });
  }

  // open이 false일 경우 비밀번호 확인
  if (!group.open) {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).send({ message: 'Password is required for updating a closed group.' });
    }

    // 비밀번호가 일치하지 않는 경우
    if (password !== group.password) {
      return res.status(403).send({ message: 'Incorrect password.' });
    }
  }

  // group 객체 업데이트
  Object.keys(req.body).forEach((key) => {
    // password는 다시 덮어쓰지 않도록 예외 처리
    if (key !== 'password') {
      group[key] = req.body[key];
    }
  });

  await group.save();
  res.send(group);
}));

app.delete('/groups/:groupId', asyncHandler(async (req, res) => { // 그룹 삭제 뼈대 코드
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });  // groupId 필드로 검색

  if (!group) {
    return res.status(404).send({ message: 'Cannot find given groupId' });
  }

  // open이 false일 경우 비밀번호 확인
  if (!group.open) {
    const { password } = req.body;

    if (!password) {
      return res.status(400).send({ message: 'Password is required for deleting a closed group.' });
    }

    // 비밀번호가 일치하지 않는 경우
    if (password !== group.password) {
      return res.status(403).send({ message: 'Incorrect password.' });
    }
  }

  // 그룹 삭제
  await Group.deleteOne({ groupId });
  res.sendStatus(204);
}));

app.listen(process.env.PORT || 3000, () => console.log('Server Started'));
mongoose.connect(process.env.DATABASE_URL).then(() => console.log('Connected to DB'));