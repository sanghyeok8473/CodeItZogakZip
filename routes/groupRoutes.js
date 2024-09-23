import express from 'express';
import Group from '../models/Group.js'; // 그룹 모델
import upload from '../upload.js'; // multer 설정
import asyncHandler from '../middlewares/asyncHandler.js'; // 에러 핸들링 미들웨어

const router = express.Router();

// 그룹 목록 조회
router.get('/', asyncHandler(async (req, res) => {
  const groups = await Group.find();
  res.send(groups);
}));

// 그룹 상세 정보 조회
router.get('/:groupId', asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });

  if (!group) {
    return res.status(404).send({ message: 'Cannot find given groupId' });
  }

  // 그룹이 public이 false인 경우 비밀번호 확인
  if (!group.public) {
    const { password } = req.body;

    // 비밀번호가 제공되지 않은 경우
    if (!password) {
      return res.status(400).send({ message: 'Password is required' });
    }

    // 해시된 비밀번호와 입력된 비밀번호 비교
    const isMatch = await group.comparePassword(password, group.password);
    if (!isMatch) {
      return res.status(403).send({ message: 'Invalid password' });
    }
  }

  // 그룹이 public이거나 비밀번호가 일치하는 경우 그룹 반환
  res.send(group);
}));


// 그룹 생성
router.post('/', upload.single('mainImg'), asyncHandler(async (req, res) => {
  const lastGroup = await Group.findOne().sort({ groupId: -1 });
  const nextGroupId = lastGroup ? lastGroup.groupId + 1 : 1;

  // 비밀번호가 없으면 에러 반환
  if (!req.body.password) {
    return res.status(400).send({ message: 'Password is required for creating a group.' });
  }

  const newGroupData = {
    ...req.body,
    groupId: nextGroupId,
    mainImg: req.file ? req.file.location : '', // S3에서 반환된 이미지 URL 또는 빈 문자열
  };

  const newGroup = await Group.create(newGroupData);
  res.status(201).send(newGroup);
}));

// 그룹 수정
router.put('/:groupId', asyncHandler(async (req, res) => {
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
router.delete('/:groupId', asyncHandler(async (req, res) => {
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

export default router;
