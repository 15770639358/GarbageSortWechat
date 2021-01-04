// miniprogram/pages/questions/questions.js
const db = wx.cloud.database()
import utils from '../../utils/util'
import Toast from '../../miniprogram_npm/@vant/weapp/toast/toast';
let timer
let throttle
Page({

  data: {
    startQuestion: false, //开始答题
    value: 100,
    questions: [], //随机获取的5个题目列表，
    showQuestion: {}, //当前题目
    answerQuestion: [], //以答题目
    correctQuestion: [], //回答正确的题目
    isShow: false, //显示答案
    logo: '', //答案图片路径
    isAnswer: true, //规定时间内是否答题
    isTimeout: false, //是否超过答题时间
    result: false //答题结果
  },

  onLoad: function (options) {
    throttle = this.throttle(800)
  },

  onShow: async function () {
    clearTimeout(timer)
    await this.questions()
  },

  //开始答题
  async start() {
    let isStart = await this.getTodayIsAnswer()
    if(!isStart) {
      this.setData( {startQuestion: true} )
      this.getQuestion()
      this.time()
    } else {
      // wx.showToast({
      //   title: '今日以答题！记得明天再来哦！',
      // })
      Toast('今日以答题！记得明天再来哦！')
    }
  },

  //圆形进度条
  time() {
    let _this = this
    if(_this.data.value > 0 ) {
      timer = setTimeout( _ => {
        let value = _this.data.value - 1
        _this.setData( {value} )
        _this.time()
      },10000/100)
    } else {
      clearTimeout(timer)
      this.setData( {isTimeout: true} )
      if(this.data.isAnswer) {
        this.showAnswer(this.data.showQuestion.sortId)
        let answerQuestion = this.data.answerQuestion
        answerQuestion.push(this.data.showQuestion)
        this.setData({answerQuestion})
      }
      // this.setData({isAnswer: true})
    }
  },

  //随机获取五条数据
  async questions() {
    let _this = this
    let questions = await db.collection('product')
      .aggregate()
      .sample({
        size: 5
      })
      .end()
    _this.setData({questions: questions.list})
  },

  //获取当前题目
  getQuestion() {
    let showQuestion = this.data.questions.shift()
    if(showQuestion) {
      this.setData({showQuestion, isAnswer: true, value: 100})
      if(this.data.isTimeout) {
        this.time()
        this.setData( {isTimeout: false} )
      }
    } else {
      this.saveResult()
      this.setData( {result: true, startQuestion: false} )
    }
  },

  //答题
  answer(e) {
    if(this.data.isAnswer) {
      this.setData( {isAnswer:false} )
      let option = parseInt(e.target.dataset.sort)
      let answer = this.data.showQuestion.sortId
      if(option === answer) {
        let answerQuestion = this.data.answerQuestion
        let correctQuestion = this.data.correctQuestion
        answerQuestion.push(this.data.showQuestion)
        correctQuestion.push(this.data.showQuestion)
        this.setData({answerQuestion, correctQuestion})
        this.getQuestion()
      } else {
        let answerQuestion = this.data.answerQuestion
        answerQuestion.push(this.data.showQuestion)
        this.setData({answerQuestion})
        this.showAnswer(this.data.showQuestion.sortId)
      }
    }
  },

  //显示答案
  showAnswer(index) {
    let logoImg = ""
    switch (parseInt(index)) {
      case 1:
        logoImg = "../../resource/images/RecycleableWaste.jpg"
        break;
      case 2:
        logoImg = "../../resource/images/HazardouAwaste.jpg"
        break;
      case 3:
        logoImg = "../../resource/images/HouseholdfoodWaste.jpg"
        break;
      case 4:
        logoImg = "../../resource/images/ResidualWaste.png"
        break;
    }
    this.setData({
      logo: logoImg,
      isShow: true
    })
    this.animation(1, 1)
  },

  //点击答案去往下一题
  nextQuestion() {
    throttle(() => {
      this.animation(0, 1.3)
      setTimeout(() => {
        this.setData({
          isShow: false,
          logo: ''
        })
        this.getQuestion()
      }, 500);
    })
  },

  animation(opacity, scale) {
    let animation = wx.createAnimation({
      duration: 500,
      timingFunction: 'ease',
    });
    animation.opacity(opacity).scale(scale).step()
    this.setData({
      animation: animation.export()
    })
  },

  //答题完成 存储相关数据
  async saveResult() {
    let _this = this
    let time = new Date()
    let nowDate = utils.formatTime(time).slice(0,10)
    //integral
    let integrals = this.data.correctQuestion.length * 2
    let openId = ' '
    await db.collection('user').where({
      _openid: 'user-open-id',
    })
    .get({
      success: function (res) {
        openId = res.data[0]._openid
        let result = wx.cloud.callFunction({
          name: 'questionResult',
          data:{
            integrals,
            openId
          }
        })
      }
    })

    db.collection('qusetionResult').add({
      data: {
        nowDate,
        answerQuestion: _this.data.answerQuestion,
        correctQuestion: _this.data.correctQuestion
      },
      success: function(res) {
        // res 是一个对象，其中有 _id 字段标记刚创建的记录的 id
        console.log(res)
      }
    })
  },

  //查询当天是否答题
  getTodayIsAnswer() {
    const _ = db.command
    let today = new Date()
    today = utils.formatTime(today).slice(0,10)
    return new Promise((resolve, reject) => {
      db.collection('qusetionResult').where({
        nowDate: _.eq(today)
      })
      .get({
        success: function(res) {
          if(res.data.length > 0) {
            resolve(true)
          } else {
            resolve(false)
          }
        }
      })
    })
  },

    //节流
    throttle(delay) {
      let prev = Date.now();
      return function (func) {
        let context = this;
        let args = arguments;
        let now = Date.now();
        if (now - prev >= delay) {
          prev = Date.now();
          func.apply(context, args);
        }
      }
    },
  
  //进入后台，清空timer
  onHide() {
    clearTimeout(timer)
  }
})

