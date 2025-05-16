var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors'); // 添加 cors

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var ringSigRouter = require('./routes/ring_sig');
var walletRouter = require('./routes/save'); // 新增 wallet 路由
var recoveryRouter = require('./routes/recovery'); // 新增 recovery 路由

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 配置 CORS
app.use(cors({
  origin: 'http://localhost:3000', // 允许前端域名
  methods: ['GET', 'POST', 'OPTIONS'], // 允许的 HTTP 方法
  allowedHeaders: ['Content-Type', 'Authorization'] // 允许的请求头
}));

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 挂载路由
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/wallet', ringSigRouter);
app.use('/wallet', walletRouter);
app.use('/wallet', recoveryRouter); 

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;