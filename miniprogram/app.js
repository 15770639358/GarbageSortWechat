//app.js
App({
  globalData: {
    token      : "",    // 登录成功后返回的token
    isLogin    : false, //判断是否登录
    userInfo   : {},    //微信用户信息（登录成功一定有userinfo，未登录可能有/可能没有userinfo）
    systemInfo : {},    // 系统信息（ windowWidth, windowHeight, ... ）
  },

  onLaunch: function () {
    let _this = this
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        env: 'garbage-sort-5s82k',
        traceUser: true,
      })
    }


    //获取设备信息
    let res = wx.getSystemInfoSync();
    _this.globalData.systemInfo = res;

    // 获取缓存token
    wx.getStorage({
      key: 'token',
      success(res) {
        _this.globalData.token = res.data;
      }
    })

    //获取缓存userInfo
    wx.getStorage({
      key: 'userInfo',
      success(res) {
        _this.globalData.userInfo = JSON.parse(res.data) ;
      }
    })
  },

  onShow() {
    if(this.globalData.token || this.globalData.userInfo) {
      this.globalData.isLogin = true
    }
  }
})
