import express from 'express';
import Group from '../models/Group.js'; // 그룹 모델
import upload from '../upload.js'; // multer 설정
import asyncHandler from '../middlewares/asyncHandler.js'; // 에러 핸들링 미들웨어

const router = express.Router();

// 그룹 목록 조회
router.get('/', asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 10, sortBy = 'latest', keyword = '', isPublic } = req.query;

  // 페이지와 페이지 크기 설정
  const currentPage = parseInt(page, 10) || 1;
  const limit = parseInt(pageSize, 10) || 10;
  const skip = (currentPage - 1) * limit;

  // 검색 조건 설정
  const searchQuery = {};
  if (keyword) {
    searchQuery.name = { $regex: keyword, $options: 'i' }; // 이름에 대한 검색
  }
  if (isPublic !== undefined) {
    searchQuery.isPublic = isPublic === 'true'; // 공개 여부 필터링
  }

  // 정렬 설정
  let sortOption = { createdAt: -1 }; // 기본값: 최신순
  if (sortBy === 'mostPosted') {
    sortOption = { postCount: -1 };
  } else if (sortBy === 'mostLiked') {
    sortOption = { likeCount: -1 };
  } else if (sortBy === 'mostBadge') {
    sortOption = { badgeCount: -1 };
  }

  // 총 아이템 개수 조회
  const totalItemCount = await Group.countDocuments(searchQuery);

  // 그룹 목록 조회
  const groups = await Group.find(searchQuery)
    .sort(sortOption)
    .skip(skip)
    .limit(limit);

  // 페이징 처리된 데이터 응답
  res.send({
    currentPage,
    totalPages: Math.ceil(totalItemCount / limit),
    totalItemCount,
    data: groups.map(group => ({
      id: group.groupId,
      name: group.name,
      imageUrl: group.imageUrl,
      isPublic: group.isPublic,
      likeCount: group.likeCount,
      badgeCount: group.badgeCount,
      postCount: group.postCount,
      createdAt: group.createdAt,
      introduction: group.introduction
    }))
  });
}));

// 그룹 상세 정보 조회
router.get('/:groupId', asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });

  if (!group) {
    return res.status(404).send({ message: '주어진 groupId를 찾을 수 없습니다.' });
  }

  // 그룹이 isPublic이 false인 경우 비밀번호 확인
  if (!group.isPublic) {
    const { password } = req.body;

    // 비밀번호가 제공되지 않은 경우
    if (!password) {
      return res.status(400).send({ message: '잘못된 요청입니다' });
    }

    // 해시된 비밀번호와 입력된 비밀번호 비교
    const isMatch = await group.comparePassword(password, group.password);
    if (!isMatch) {
      return res.status(403).send({ message: '비밀번호가 틀렸습니다.' });
    }
  }

  // 응답에서 반환할 필드만 선택
  const filteredGroup = {
    id: group.groupId, // groupId를 id로 변경
    name: group.name,
    imageUrl: group.imageUrl,
    isPublic: group.isPublic,
    likeCount: group.likeCount,
    badgeCount: group.badgeCount,
    postCount: group.postCount,
    createdAt: group.createdAt,
    introduction: group.introduction,
  };

  // 그룹이 isPublic이거나 비밀번호가 일치하는 경우 필터된 그룹 정보 반환
  res.send(filteredGroup);
}));



// 그룹 등록
router.post('/', upload.single('imageUrl'), asyncHandler(async (req, res) => {
  const lastGroup = await Group.findOne().sort({ groupId: -1 });
  const nextGroupId = lastGroup ? lastGroup.groupId + 1 : 1;

  // 비밀번호가 없으면 에러 반환
  if (!req.body.password) {
    return res.status(400).send({ message: '그룹을 등록할 때에는 비밀번호가 필요합니다.' });
  }

  const newGroupData = {
    ...req.body,
    groupId: nextGroupId,
    imageUrl: req.file ? req.file.location : '', // S3에서 반환된 이미지 URL 또는 빈 문자열
  };

  const newGroup = await Group.create(newGroupData);

  // 원하는 필드만 추출하여 응답
  const filteredGroup = newGroup.toObject();
  
  const response = {
    id: filteredGroup.groupId, // groupId를 id로 변경
    name: filteredGroup.name,
    imageUrl: filteredGroup.imageUrl,
    isPublic: filteredGroup.isPublic,
    likeCount: filteredGroup.likeCount,
    badges: filteredGroup.badges,
    postCount: filteredGroup.postCount,
    createdAt: filteredGroup.createdAt,
    introduction: filteredGroup.introduction,
  };

  res.status(201).send(response);
}));


// 그룹 수정
router.put('/:groupId', asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });

  if (!group) {
    return res.status(404).send({ message: '주어진 groupId를 찾을 수 없습니다.' });
  }

  const { password } = req.body;

  if (!password) {
    return res.status(400).send({ message: '그룹 수정 시에는 비밀번호가 필요합니다.' });
  }

  // 해시된 비밀번호와 입력된 비밀번호 비교
  const isMatch = await group.comparePassword(password);
  if (!isMatch) {
    return res.status(403).send({ message: '비밀번호가 틀렸습니다.' });
  }

  // 비밀번호는 업데이트 대상에서 제외하고 나머지 필드 업데이트
  Object.keys(req.body).forEach((key) => {
    if (key !== 'password') {
      group[key] = req.body[key];
    }
  });

  await group.save();

  // 필터링된 필드만 응답으로 보냄
  const filteredGroup = {
    id: group.groupId, // groupId를 id로 변경
    name: group.name,
    imageUrl: group.imageUrl,
    isPublic: group.isPublic,
    likeCount: group.likeCount,
    badges: group.badges,
    postCount: group.postCount,
    createdAt: group.createdAt,
    introduction: group.introduction,
  };

  res.send(filteredGroup);
}));


// 그룹 삭제
router.delete('/:groupId', asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const group = await Group.findOne({ groupId });

  if (!group) {
    return res.status(404).send({ message: '존재하지 않습니다' });
  }


  const { password } = req.body;

  if (!password) {
    return res.status(400).send({ message: '잘못된 요청입니다' });
  }

  // 비밀번호 검증
  const isMatch = await group.comparePassword(password);
  if (!isMatch) {
    return res.status(403).send({ message: '비밀번호가 틀렸습니다' });
  }

  await Group.deleteOne({ groupId });
  res.status(200).send({ message: '그룹 삭제 성공' });
}));

export default router;
