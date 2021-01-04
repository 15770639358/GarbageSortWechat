// miniprogram/pages/my/my.js
import utils from '../../utils/util'

let wxLogin = utils.promisify(wx.login)
let callFunction = utils.promisify(wx.cloud.callFunction)
let wxGetSetting = utils.promisify(wx.getSetting)
let wxGetUserInfo = utils.promisify(wx.getUserInfo)
let app = getApp()
let hander
const db = wx.cloud.database()
import {getQuestionInfo} from './question'
Page({

  data: {
    headerImg: '',
    nickName: '',
    isLogin: false,
    integralInfo: '',
    todayIsSigned: false, //今日是否签到
    allQuestion: 0, //共答题目
    curQuestion: 0, //回答正确的题目
    correct: 0 //正确率
  },


  onLoad: function (options) {
    //获取节流器
    hander = this.throttle(3000)
  },

  onShow: async function () {
    // console.log('onshow')
    //缓存有 自动登入
    let {token, isLogin, userInfo} = app.globalData
    // console.log(userInfo)
    if(token && isLogin && userInfo) {
      this.authLogin(userInfo)
    }
  },

  geQuestion() {
    wx.navigateTo({
      url: '/pages/questions/questions',
    })
  },

  //获取答题信息
  async getQuestion() {
    let allQuestion = 0
    let curQuestion = 0
    let questions = await getQuestionInfo()
    questions.data.forEach(question => {
     allQuestion += question.answerQuestion.length
     curQuestion += question.correctQuestion.length
    })
    this.setData({allQuestion, curQuestion, correct: this.toPercent(curQuestion/allQuestion)})
  },


  //自动登入，获取信息
  async authLogin(userInfo) {
    this.setData({
      headerImg: userInfo.avatarUrl,
      nickName: userInfo.nickName,
      isLogin:true
    })
    this.getQuestion()
    let integralInfo = await this.getIntegralInfo()
    // console.log(integralInfo)
    if(integralInfo) {
      this.setData( {integralInfo}) 
      this.todayIsSigned()
    }
  },

  //判断今日是否已经签到
  todayIsSigned() {
    let time = new Date()
    let nowDate = utils.formatTime(time).slice(0,10)
    let singedTime = this.data.integralInfo.singedTime.slice(0,10)
    // console.log(nowDate === singedTime)
    if(nowDate === singedTime) {
      this.setData( {todayIsSigned: true} )
    } else {
      this.setData( {todayIsSigned: false} )
    }
  },

  //获取积分信息
  getIntegralInfo() {
    return new Promise(async (resolve, reject) => {
      await db.collection('integral').where({
          _openid: 'user-open-id',
        })
        .get({
          success: function (res) {
            // console.log(res.data)
            // console.log(res)
            resolve(res.data[0])
          }
        })
    })
  },

  //判断当前用户是否注册
  async isRegist() {
    return new Promise(async (resolve, reject) => {
      await db.collection('user').where({
          _openid: 'user-open-id',
        })
        .get({
          success: function (res) {
            // console.log(res.data)
            if (res.data.length === 0) {
             resolve( true )  //没有注册
            } else {
              resolve( false )
            }
          }
        })
    })
  },

  //登入
  async login( userInfo ) {
    let { code } = await wxLogin({ timeout: 5000 })
    if (code) {
      let res = await callFunction({
        name: "login",
        data: { code: code }
      })
      if (res.result.code === 0) {
        //登入成功
        utils.setStorageSync( 'token', res.result.data.session_key )
        utils.setStorageSync( 'userInfo', userInfo )
        app.globalData.token = res.result.data.session_key
        app.globalData.isLogin = true
        app.globalData.userInfo = userInfo
        this.setData({
          headerImg: userInfo.avatarUrl,
          nickName: userInfo.nickName,
          isLogin:true
        })
        this.getQuestion()
        let integralInfo = await this.getIntegralInfo()
        // console.log(integralInfo)
        if(integralInfo) {
          this.setData( {integralInfo}) 
          this.todayIsSigned()
        }
        
        // console.log(app)      
      } else {
        wx.showToast({
          title: '登入失败',
          icon: 'error'
        })
      }
    } else {
      wx.showToast({
        title: '登入失败',
        icon: 'error'
      })
    }
  },

  //点击登录
  async bindGetUserInfo() {
    //获取用户信息
    let _this = this
    let { authSetting } = await wxGetSetting()
    if (authSetting['scope.userInfo']) {
      let { userInfo } = await wxGetUserInfo()
      let isRegist = await this.isRegist()  //判断当前用户是否有过注册
      //没有注册，自动注册
      // console.log(isRegist)
      if(isRegist) {
        db.collection('user').add({
          data: {
            userName: userInfo.nickName
          },
          success: async function(res) {
            //注册成功自动登入
            _this.firstSinged()
            await _this.login(userInfo)
          }
        })
      } else {
        //已经注册 直接登入
        await this.login(userInfo)
      }
    }
  },



  //点击签到
  async singed() {
    hander( async _ => {
      let isFirstSinged = await this.isFirstSinged()
      if(isFirstSinged) {
        this.firstSinged()
      } else {
        this.singedToday()
      }
    })   
  },

  //判断当前用户是否注册后第一次签到
  async isFirstSinged() {
    let _this = this
    return new Promise(async (resolve, reject) => {
      await db.collection('integral').where({
          _openid: 'user-open-id',
        })
        .get({
          success:async function (res) {
            // console.log(res.data)
            if (res.data.length === 0) {
             resolve( true )  //第一次签到
            } else {
              resolve( false )
            }
          }
        })
    })
  },

  //第一次签到
  firstSinged() {
    let _this = this
    let time = new Date()
    let singedTime = utils.formatTime(time)
    //当前已有积分
    let nowIntegral = 2
    //以兑换积分
    let isUseIntegral = 0
    //以获取过的总积分
    let totalIntegral = 2
    // console.log(utils.formatTime(time).slice(0,10))
    //第一次签到
    db.collection('integral').add({
      data: {
        singedTime,
        nowIntegral,
        isUseIntegral,
        totalIntegral
      },
      success: async function(res) {
        let integralInfo = await _this.getIntegralInfo()
        // console.log(integralInfo)
        _this.setData( {integralInfo}) 
        _this.todayIsSigned()
        wx.showToast({
          title: '签到成功',
          icon: 'success'
        })
      }
    })
  },

  //签到
  singedToday() {
    // console.log('aaaaaaaaaaaaaaaaaaaaaaaaaa')
    let _this = this
    const _ = db.command
    let time = new Date()
    let nowDate = utils.formatTime(time).slice(0,10)
    let dataTime = utils.formatTime(time)
    let singedTime = this.data.integralInfo.singedTime.slice(0,10)
    // console.log(nowDate === singedTime)
    if(nowDate === singedTime) {
      wx.showToast({
        title: '今日已签到',
        icon: 'none'
      })
      this.setData( {todayIsSigned: true} )
    } else {
      db.collection('integral').doc(this.data.integralInfo._id).update({
        data: {
          singedTime: dataTime,
          nowIntegral:  _.inc(2),
          totalIntegral: _.inc(2)
        },
        success: async function(res) {
          let integralInfo = await _this.getIntegralInfo()
          // console.log(integralInfo)
          _this.setData( {integralInfo}) 
          _this.todayIsSigned()
          wx.showToast({
            title: '签到成功',
            icon: 'success'
          })
        }
      })
    }
  },

  //节流
  throttle(delay) {
    let prev = Date.now();
    return function (func) {
      let context = this;
      let args = arguments;
      let now = Date.now();
      if (now - prev >= delay) {
        func.apply(context, args);
        prev = Date.now();
      }
    }
  },

  //转出百分数
  toPercent(point){
    let str = Number(point*100).toFixed(1);
    str+="%";
    return str;
  }
})