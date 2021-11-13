const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: true }));
const MongoClient = require('mongodb').MongoClient;
const methodOverride = require('method-override');
app.use(methodOverride('_method'));
app.set('view engine', 'ejs');

app.use('/public', express.static('public'));

var db;
//db 접속이 되면
MongoClient.connect(
  'mongodb+srv://moomum:YM2rNLFbBtn4bU8X@cluster0.eebwo.mongodb.net/todoapp?retryWrites=true&w=majority',
  (error, client) => {
    if (error) {
      return console.log(error);
    }

    db = client.db('todoapp');
    // 8080이라는 port에 서버를 열어라
    // 서버 열고 function 실행
    app.listen(8080, function () {
      console.log('listening on 8080');
    });
  }
);

app.get('/write', (req, res) => {
  res.render('write.ejs');
});

app.get('/', (req, res) => {
  //html 파일 보내기
  res.render('index.ejs');
});

app.post('/add', (req, res) => {
  db.collection('counter').findOne(
    { name: 'number of post' },
    (err, result) => {
      let total = result.totalPost;

      db.collection('post').insertOne(
        { _id: total + 1, title: req.body.title, date: req.body.detail },
        (err, res) => {
          console.log('save success');
          db.collection('counter').updateOne(
            { name: 'number of post' },
            { $inc: { totalPost: 1 } }
          );
        }
      );
    }
  );
});

app.get('/list', (req, res) => {
  //디비에 저장된 post라는 collection 안의 모든 데이터를 꺼내주세요
  db.collection('post')
    .find()
    .toArray((err, result) => {
      res.render('list.ejs', { posts: result });
    });
});

app.delete('/delete', (req, res) => {
  //console.log(req.body);
  req.body._id = parseInt(req.body._id);
  db.collection('post').deleteOne(req.body, (err, result) => {
    console.log('delete success');
    res.status(200).send({ message: 'success' });
  });
});

app.get('/detail/:id', (req, res) => {
  db.collection('post').findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      res.render('detail.ejs', { data: result });
    }
  );
});

app.get('/edit/:id', (req, res) => {
  db.collection('post').findOne(
    { _id: parseInt(req.params.id) },
    (err, result) => {
      if (err) {
        console.log('error');
      }
      res.render('edit.ejs', { data: result });
    }
  );
});

app.put('/edit', (req, res) => {
  // 폼에 담긴 제목, 날짜 데이터를 가지고 db.collection에 업데이트 함
  db.collection('post').updateOne(
    { _id: parseInt(req.body.id) },
    { $set: { title: req.body.title, date: req.body.date } },
    (err, result) => {
      res.redirect('/list');
    }
  );
});

// 라이브러리 첨부 -> 그냥 따라 쳐라
const passport = require('passport');
const LocalStrategy = require('passport-local');
const session = require('express-session');
app.use(
  session({ secret: 'password', resave: true, saveUninitialized: false })
);
app.use(passport.initialize);
app.use(passport.session);
