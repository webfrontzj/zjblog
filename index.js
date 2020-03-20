const path=require('path');
const express=require('express');
const session=require('express-session')
const MongoStore=require('connect-mongo')(session)
const flash=require('connect-flash');
const config=require('config-lite')(__dirname)
const routes=require('./routes')
const pkg=require('./package');

const winston=require('winston')
const expressWinston=require('express-winston')


const app=express();

app.set('views',path.join(__dirname,'views'))
app.set('view engine','ejs')

app.use(express.static(path.join(__dirname,'public')))

app.use(session({
    name:config.session.key,
    secret:config.session.secret,
    resave:true,
    saveUninitialized:false,
    cookie:{
        maxAge:config.session.maxAge
    },
    store:new MongoStore({
        url:config.mongodb
    })
}))

app.use(require('express-formidable')({
    uploadDir:path.join(__dirname,'public/images'),
    keepExtensions:true
}))

app.use(flash())

// 设置模板全局常量
app.locals.blog={
    title:pkg.name,
    description:pkg.description
}

//添加模板必须的三个变量
app.use((req,res,next)=>{
    res.locals.user=req.session.user
    res.locals.success=req.flash('success').toString()
    res.locals.error=req.flash('error').toString()
    next()
})
//正常请求日志
app.use(expressWinston.logger({
    transports:[
        new (winston.transports.Console)({
            json:true,
            colorize:true
        }),
        new winston.transports.File({
            filename:'logs/success.log'
        })
    ]
}))

routes(app)
//错误请求日志
app.use(expressWinston.errorLogger({
    transports:[
        new winston.transports.Console({
            json:true,
            colorize:true
        }),
        new winston.transports.File({
            filename:'logs/error.log'
        })
    ]
}))

app.use(function(err,req,res,next){
    console.error(err);
    req.flash('error',err.message);
    res.redirect('/posts')
})

//这样做可以实现：直接启动index.js则会监听端口启动程序，如果index.js被require了，则导出app，通常用于测试。
if(module.parent){
    //被require，则导出app
    module.exports=app;
}else{
    const port=process.env.PORT || config.port;
    //监听端口，启动程序
    app.listen(port,()=>{
        console.log(`${pkg.name} listening on port ${port}`);
    })
}
