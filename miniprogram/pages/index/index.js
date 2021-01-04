Page({

  data: {
    SHOW_TOP: true,
  },

  onLoad: function(options) {
    let myDate = new Date();
    let isShowed = wx.getStorageSync("tip")
    if(isShowed != 1){
      setTimeout(() => {
        this.setData({
          SHOW_TOP: false
        })
        wx.setStorageSync("tip", 1)
      }, 2 * 1000)
    }else{
      this.setData({
        SHOW_TOP: false
      })
    }
  },

  goSearch: function() {
    wx.navigateTo({
      url: '../search/search',
    })
  },

  onBindCamera: function() {
    wx.navigateTo({
      url: '../camera/camera',
    })
  },

  onAikefu: function() {
    wx.navigateTo({
      url: '/pages/android/qa',
    })
  },

  onShareAppMessage: function() {
    return {
      title: "智能分类垃圾",
      imageUrl: "https://6c61-laji-bopv4-1259505195.tcb.qcloud.la/laji.png?sign=7c8d38e435eb3104fcf5933ebff667f5&t=1561904613",
      path: "pages/ai/index"
    }
  },

  onShareAppMessage: function (res) {
    if (res.from === 'button') {
      // 来自页面内转发按钮
      path: '/pages/index/index'
    }
    return {
      // title: '自定义转发标题',
      path: '/pages/index/index',
      imageUrl: '../../resource/images/no-result.png'
    }
  }
})