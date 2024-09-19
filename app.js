import express from 'express';
import groups from './data/mock.js';

const app = express();

app.get('/groups', (req, res) => {
  res.send(groups);
});

app.listen(3000, () => console.log('Server Started'));
