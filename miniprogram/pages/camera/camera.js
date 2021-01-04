var md5 = require('../../utils/md5.js')
var http = require('../../utils/http.js')
var util = require('../../utils/util.js')
Page({
  data: {
    accessToken: "",
    isShow: false,
    results: [],
    src: "",
    isCamera: true,
    btnTxt: "拍照",
    cWidth: 0,
    cHeight: 0
  },
  onLoad() {
    this.ctx = wx.createCameraContext()
    let time = wx.getStorageSync("time")
    let curTime = new Date().getTime()
    let timeInt = parseInt(time)
    let timeNum = parseInt((curTime - timeInt) / (1000 * 60 * 60 * 24))
    let accessToken = wx.getStorageSync("access_token")
    if (timeNum > 28 || (accessToken == "" || accessToken == null || accessToken == undefined)) {
      this.accessTokenFunc()
    } else {
      this.setData({
        accessToken: wx.getStorageSync("access_token")
      })
    }
  },
  onShow() {
    this.setData({ results: [], isCamera:true, isShow:false, btnTxt: '拍照'})
  },
  takePhoto() {
    let that = this
    if (this.data.isCamera === false) {
      this.setData({
        isCamera: true,
        btnTxt: "拍照"
      })
      return
    }
    this.ctx.takePhoto({
      quality: 'normal',
      success: (res) => {
        that.setData({
          src: res.tempImagePath,
          isCamera: false,
          btnTxt: "重拍"
        })
        wx.showLoading({
          title: '正在加载中',
        })
        //获取后缀名
        let index = res.tempImagePath.lastIndexOf(".")
        let mineType = res.tempImagePath.substr(index + 1)
        mineType = "image/" + mineType
        wx.getImageInfo({
          src: res.tempImagePath,
          success: function (res) {
            //截取图片
            that.cutImg(res)
          }
        })


      }
    })
  },

  //截取图片
  cutImg: function (res) {
    let that = this
    let ratio = 3;
    let canvasWidth = res.width //图片原始长宽
    let canvasHeight = res.height
    while (canvasWidth > 100 || canvasHeight > 100) { // 保证宽高在100以内
      canvasWidth = Math.trunc(res.width / ratio)
      canvasHeight = Math.trunc(res.height / ratio)
      ratio++;
    }
    that.setData({
      cWidth: canvasWidth,
      cHeight: canvasHeight
    })
    //----------绘制图形并取出图片路径--------------
    //创建画布
    let ctx = wx.createCanvasContext('canvas')
    // 将图片绘制到画布中
    ctx.drawImage(res.path, 0, 0, canvasWidth, canvasHeight)
    //导出画布
    ctx.draw(false, setTimeout(function () {
      //将画布输出为指定图片
      wx.canvasToTempFilePath({
        canvasId: 'canvas',
        fileType: 'png',
        destWidth: canvasWidth,
        destHeight: canvasHeight,
        success: function (res) {
          // console.log(res.tempFilePath,'aaaaaaaaaaaaaaaaaaaaaaaaa') //最终图片路径
          //将图片转换成base64
          //文件管理器
          wx.getFileSystemManager().readFile({
            filePath: res.tempFilePath,
            encoding: "base64",
            //res.data 转化为base64的图片
            success: res => {
              that.onCheckImg(res.data)
            },
            fail: res => {
              wx.hideLoading()
              wx.showToast({
                title: '拍照失败,未获取相机权限或其他原因',
                icon: "none"
              })
            }
          })
        },
        fail: function (res) {
          wx.hideLoading()
          console.log(res.errMsg)
        }
      })
    }, 800))
  },


  // 默认图片不能超过1m
  // 检查图片
  onCheckImg: function (buffer) {
    let that = this
    wx.cloud.callFunction({
      name: "checkImg",
      data: {
        type: 'image/png',
        buffer: buffer
      },
      success: res => {
        console.log(res)
        // console.log("=onCheckImg=success===" + JSON.stringify(res))
        if (res.result.errCode == 0) {
          //调用百度AI图像识别
          that.req(that.data.accessToken, buffer)
        } else if (res.result.errCode == 87014) {
          wx.hideLoading()
          wx.showToast({
            icon: 'none',
            title: '内容含有违法违规内容',
          })
        } else {
          wx.hideLoading()
        }
      },
      fail: err => {
        wx.hideLoading()
        console.log("=onCheckImg=err===" + JSON.stringify(err))
        // return cb(err)
      },
    })
  },

  //请求图片
  req: function (token, image) {
    let that = this
    http.req("https://aip.baidubce.com/rest/2.0/image-classify/v2/advanced_general?access_token=" + token, {
        "image": image
      },
      function (res) {
        // console.log(res,'+++++++++++++++++++++++++++++++')
        wx.hideLoading()
        // console.log(JSON.stringify(res))
        // console.log(res.data,'aaaaaaaaaaaaaaaaaaaa')
        let code = res.data.err_code
        if (code === 111 || code === 100 || code === 110) {
          wx.clearStorageSync("access_token")
          wx.clearStorageSync("time")
          that.accessTokenFunc()
          return
        }
        let num = res.result_num
        let results = res.data.result
        if (results != undefined && results != null) {
          that.setData({
            isShow: true,
            results: results
          })
          // console.log(results,'aaaaaaaaaaaaaaaaaaaaa')
        } else {
          wx.clearStorageSync("access_token")
          wx.showToast({
            icon: 'none',
            title: 'AI识别失败,请重新尝试',
          })
        }
      }, "POST")
  },


  //获取accessToken
  accessTokenFunc: function () {
    let that = this
    wx.cloud.callFunction({
      name: 'baiduAccessToken',
      success: res => {
        let accessToken = res.result.data.access_token
        that.setData({
          accessToken
        })
        wx.setStorageSync("access_token", res.result.data.access_token)
        wx.setStorageSync("time", new Date().getTime())
      },
      fail: err => {
        wx.clearStorageSync("access_token")
        wx.showToast({
          icon: 'none',
          title: '调用失败,请重新尝试',
        })
        console.error('[云函数] [sum] 调用失败：', err)
      }
    })
  },

  radioChange: function (e) {
    console.log(e)
    console.log(e.detail)
    console.log(e.detail.value)
    wx.navigateTo({
      url: '/pages/result/result?keyword=' + e.detail.value,
    })
  },

  hideModal: function () {
    this.setData({
      isShow: false,
    })
  },

  stopRecord() {
    this.ctx.stopRecord({
      success: (res) => {
        this.setData({
          src: res.tempThumbPath,
          videoSrc: res.tempVideoPath
        })
      }
    })
  },

  error(e) {
    wx.getSetting({
      withSubscriptions: true,
      success(res) {
        console.log(res.authSetting['scope.camera'])
        if (!res.authSetting['scope.camera']) {

          wx.showModal({ //没有权限，提示用户去授权界面
            title: '提示',
            content: '获取相机权限失败！是否去授权！',
            success(res) {
              if (res.confirm) {
                wx.openSetting({ //打开用户授权界面
                  success(res) {
                    res.authSetting = {
                      "scope.camera": true
                    }
                  }
                })
              } else if (res.cancel) { //用户不去用户授权界面，提示保存失败
                wx.showToast({
                  title: '保存失败',
                  icon: 'none',
                  duration: 2000
                })
              }
            }
          })

        }
      }
    })
  }

})