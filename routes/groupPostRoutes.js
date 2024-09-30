import express from 'express';
import Group from '../models/Group.js';
import Post from '../models/Post.js'; // 게시글 모델
import upload from '../upload.js'; // multer 설정
import asyncHandler from '../middlewares/asyncHandler.js'; // 에러 핸들링 미들웨어

const router = express.Router();
// /api/posts/:groupId/posts의 GET, POST리퀘스트의 라우트

// 게시글 목록 조회
router.get('/:groupId', asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  const { page = 1, pageSize = 10, sortBy = 'latest', keyword = '', isPublic } = req.query;

  try {
    // 그룹을 찾습니다.
    const group = await Group.findOne({ groupId });

    if (!group) {
      return res.status(404).send({ message: '그룹을 찾을 수 없습니다.' });
    }

    // 그룹의 posts 배열에서 postId를 가져옵니다.
    const postIds = group.posts;

    // 검색 및 공개 여부에 따라 필터링
    const filter = {
      postId: { $in: postIds },
    };

    if (keyword) {
      filter.title = { $regex: keyword, $options: 'i' }; // 제목에 검색어 포함
    }

    if (isPublic !== undefined) {
      filter.isPublic = isPublic === 'true'; // 공개 여부 필터링
    }

    // 총 게시글 수를 구합니다.
    const totalItemCount = await Post.countDocuments(filter);

    // 정렬 옵션 설정
    let sortOption;
    switch (sortBy) {
      case 'mostCommented':
        sortOption = { commentCount: -1 }; // 댓글 수가 많은 순으로 정렬
        break;
      case 'mostLiked':
        sortOption = { likeCount: -1 }; // 좋아요 수가 많은 순으로 정렬
        break;
      case 'latest':
      default:
        sortOption = { createdAt: -1 }; // 최신 순으로 정렬
        break;
    }

    // 페이지네이션 적용
    const posts = await Post.find(filter)
      .sort(sortOption)
      .skip((page - 1) * pageSize)
      .limit(Number(pageSize))
      .select('postId nickname title imageUrl tags location moment isPublic likeCount commentCount createdAt'); // 필요한 필드 선택

    // 응답 데이터 변환
    const responseData = posts.map(post => ({
      id: post.postId, // postId를 id로 변경
      nickname: post.nickname,
      title: post.title,
      imageUrl: post.imageUrl,
      tags: post.tags,
      location: post.location,
      moment: post.moment,
      isPublic: post.isPublic,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      createdAt: post.createdAt,
    }));

    const totalPages = Math.ceil(totalItemCount / pageSize);

    res.status(200).send({
      currentPage: Number(page),
      totalPages,
      totalItemCount,
      data: responseData,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}));



// 게시글 등록
router.post('/:groupId', upload.single('imageUrl'), asyncHandler(async (req, res) => {
  const groupId = Number(req.params.groupId);
  
  try {
    const group = await Group.findOne({ groupId });
    if (!group) {
      return res.status(404).send({ message: '잘못된 요청입니다' });
    }

    // 그룹 비밀번호 확인
    const { groupPassword, postPassword } = req.body;

    const isMatch = await group.comparePassword(groupPassword);
    if (!isMatch) {
      return res.status(403).send({ message: '그룹 비밀번호가 일치하지 않습니다.' });
    }

    // 게시글 ID 자동 생성
    const lastPost = await Post.findOne().sort({ postId: -1 });
    const nextPostId = lastPost ? lastPost.postId + 1 : 1;

    // 새로운 게시글 데이터 생성
    const newPostData = {
      ...req.body,  // 요청 바디의 필드들을 모두 포함
      postId: nextPostId,  // 자동 증가된 postId 추가
      moment: new Date().toISOString().split('T')[0],  // 현재 지역 날짜로 moment 설정
      imageUrl: req.file ? req.file.location : '',  // 이미지가 있으면 S3 URL 설정
      createdAt: new Date(),  // 생성 시간
      groupId: groupId,  // 해당 그룹 ID 추가
    };
    

    // 새 게시글 저장
    const newPost = new Post(newPostData);
    await newPost.save();

    // 그룹의 posts 배열에 새 게시글 추가
    group.posts.push(nextPostId);
    await group.save();

    // 응답 데이터 포맷
    const responseData = {
      id: newPost.postId,
      groupId: newPost.groupId,
      nickname: newPost.nickname,
      title: newPost.title,
      content: newPost.content,
      imageUrl: newPost.imgaeUrl,
      tags: newPost.tags,
      location: newPost.location,
      moment: newPost.moment,
      isPublic: newPost.isPublic,
      likeCount: newPost.likeCount,
      commentCount: newPost.commentCount,
      createdAt: newPost.createdAt.toISOString(),
    };

    res.status(201).send(responseData);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
}));

export default router;