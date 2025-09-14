const express = require('express')
const path = require('node:path');
const passport = require('passport');
require('./config/passport')
const session = require('./config/session');
const indexRouter = require('./routes/indexRouter');
const authRouter = require('./routes/authRouter');
const folderRouter = require('./routes/folderRouter');

const fileRouter = require('./routes/fileRouter');
const summaryRouter = require('./routes/summaryRouter');
const musicRouter = require('./routes/musicRouter');
const app = express();
const PORT = process.env.PORT || 3000;
const assetsPath = path.join(__dirname, "public");

app.use(express.static(assetsPath));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


app.use(express.urlencoded({ extended: false}));
app.use(session)


app.use(passport.session())

app.use('/', indexRouter);
app.use('/auth', authRouter);

app.use('/folder', folderRouter);
app.use('/file', fileRouter);
app.use('/file', summaryRouter); 
app.use('/folder', musicRouter); 

app.listen(PORT, () => {
    console.log(`App is listening on the ${PORT}`);
});