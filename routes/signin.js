const express=require('express');
const router=express.Router();
const checkNotLogin=require('../middlewares/check').checkNotLogin

const sha1=require('sha1');
const UserModel=require('../models/users');

//登录页
router.get('/',checkNotLogin,(req,res,next)=>{
    res.render('signin')
})
//登录
router.post('/',checkNotLogin,(req,res,next)=>{
    const name=req.fields.name;
    const password=req.fields.password;

    //校验参数
    try{
        if(!name.length){
            throw new Error('请填写用户名')
        }
        if(!password.length){
            throw new Error('请填写密码');
        }
    }catch(e){
        req.flash('error',e.message);
        return res.redirect('back')
    }

    UserModel.getUserByName(name)
        .then(function(user){
            if(!user){
                req.flash('error','用户不存在')
                return res.redirect('back')
            }
            if(sha1(password) !== user.password){
                req.flash('error','密码错误')
                return res.redirect('back')
            }

            req.flash('success','登录成功')

            delete user.password;
            req.session.user=user;
            res.redirect('/posts');
        })
        .catch((e)=>{
            console.log(e);
        })
});

module.exports=router;