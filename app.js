import express from 'express';
import groups from './data/mock.js';

const app = express();
app.use(express.json());

app.get('/groups', (req, res) => { // 그룹 조회 뼈대 코드
  res.send(groups);
});

app.get('/groups/:groupId', (req, res) => { // 그룹 상세 정보 조회 뼈대 코드
  const groupId = Number(req.params.groupId);
  const group = groups.find((group) => group.id === groupId);

  if (group){
    res.status(200).send(group);
  }
  else{
    res.status(404).send({ message: 'Cannot find given groupId' });
  }
});

app.post('/groups', (req, res) => { // 그룹 등록 뼈대 코드
  const newGroup = req.body;
  const ids = groups.map((group) => group.id);
  newGroup.id = Math.max(...ids) + 1;
  newGroup.open = true;
  newGroup.badgen = 0;
  newGroup.memory = 0;
  newGroup.likes = 0;
  newGroup.createdAt = new Date();

  groups.push(newGroup);
  res.status(201).send(newGroup);
});

app.put('/groups/:groupId', (req, res) => { // 그룹 수정 뼈대 코드
  const groupId = Number(req.params.groupId);
  const group = groups.find((group) => group.id === groupId);

  if (group){
    Object.keys(req.body).forEach((key) => {
      group[key] = req.body[key];
    })
    res.status(200).send(group);
  }
  else{
    res.status(404).send({ message: 'Cannot find given groupId' });
  }
});

app.delete('/groups/:groupId', (req, res) => { // 그룹 삭제 뼈대 코드
  const groupId = Number(req.params.groupId);
  const idx = groups.findIndex((group) => group.id === groupId);

  if (idx >= 0){
    groups.splice(idx, 1); // idx부터 시작해서 요소 1개를 지움
    res.sendStatus(204);
  }
  else{
    res.status(404).send({ message: 'Cannot find given groupId' });
  }
});

app.listen(3000, () => console.log('Server Started'));
