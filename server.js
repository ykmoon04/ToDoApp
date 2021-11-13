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
        (err, result) => {
          console.log('save success');
          db.collection('counter').updateOne(
            { name: 'number of post' },
            { $inc: { totalPost: 1 } }
          );
          res.redirect('/list');
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
const LocalStrategy = require('passport-local').Strategy;
const session = require('express-session');
// app.use = 미들웨어
// 요청 - 응답 중간에 실행되는 코드
app.use(session({ secret: 'mycode', resave: true, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/login', (req, res) => {
  res.render('login.ejs');
});

app.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/fail',
  }),
  (req, res) => {
    res.redirect('/');
  }
);

app.get('/fail', (req, res) => {
  alert('login fail');
  res.redirect('/');
});

app.get('/mypage', isLogin, (req, res) => {
  console.log(req.user);
  res.render('mypage.ejs', { user: req.user });
});

// 로그인 했는지 검사하는 미들웨어
function isLogin(req, res, next) {
  if (req.user) {
    // req.user가 있으면 다음으로 통과
    // 로그인 후 세션이 있으면 req.user가 항상 있음
    next();
  } else {
    res.send('로그인 안함');
  }
}

// 인증 방식
passport.use(
  new LocalStrategy(
    {
      usernameField: 'id',
      passwordField: 'pw',
      session: true,
      passReqToCallback: false,
    },
    (inputId, inputPw, done) => {
      console.log(inputId, inputPw);
      db.collection('login').findOne({ id: inputId }, (err, result) => {
        if (err) {
          return done(err);
        }

        // done(서버에러, 성공시 사용자 db 데이터, 에러메시지)
        // db에 아이디가 없으면
        if (!result) {
          return done(null, false, { message: '존재하지 않는 아이디' });
        }

        // 아이디 있으면 pw 비교
        // pw 암호화 안함 -> 보안 X -> 나중에 더 공부하셈
        if (inputPw == result.pw) {
          return done(null, result);
        } else {
          return done(null, false, { message: '비번 틀림' });
        }
      });
    }
  )
);

// 검사가 끝났을 때 로그인 했다는 세션 정보를 만들어 저장해야 함
// 유저 정보 암호화해 세션으로 저장
// 세션 데이터를 쿠키로 보냄
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 이 세션데이터를 가진 사람을 DB에서 찾아주세요 -> 마이페이지 같은 기능에 사용
passport.deserializeUser((userid, done) => {
  db.collection('login').findOne({ id: userid }, (err, result) => {
    done(null, result);
  });
});
